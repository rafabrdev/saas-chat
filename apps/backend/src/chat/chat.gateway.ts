import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';
import { CompanyService } from './company.service';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    companyId: string;
    role: string;
    name: string;
  };
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  senderType: 'agent' | 'contact';
  senderName: string;
  createdAt: string;
  threadId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket['user'] & { socketId: string }>();

  constructor(
    private messageService: MessageService,
    private companyService: CompanyService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`🔌 Client attempting to connect: ${client.id}`);

    try {
      // Extrair token do handshake
      const token = this.extractTokenFromSocket(client);
      
      if (!token) {
        this.logger.warn('No token provided');
        client.emit('auth_error', { message: 'Token de autenticação necessário' });
        client.disconnect();
        return;
      }

      // Verificar e decodificar token
      const payload = this.jwtService.verify(token);
      const user = {
        id: payload.sub,
        email: payload.email,
        companyId: payload.companyId,
        role: payload.role,
        name: payload.name || 'Usuário',
      };

      client.user = user;
      
      // Adicionar à lista de usuários conectados
      this.connectedUsers.set(client.id, { 
        ...user,
        socketId: client.id 
      });

      this.logger.log(`✅ User authenticated: ${user.email} (${user.role})`);

      // Buscar thread padrão da empresa
      const defaultThread = await this.messageService.getOrCreateDefaultThread(user.companyId);
      
      // Enviar histórico de mensagens
      const messages = await this.messageService.getMessagesByThread(defaultThread.id);
      
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        text: msg.content || '',
        sender: msg.senderType === 'agent' ? 'agent' : 'user',
        senderType: msg.senderType,
        senderName: msg.senderId || 'Usuário',
        createdAt: msg.createdAt.toISOString(),
        threadId: msg.threadId,
      }));

      client.emit('history', formattedMessages);
      client.emit('authenticated', { 
        user: user,
        companyId: user.companyId, 
        threadId: defaultThread.id 
      });
      
      // Notificar outros usuários da mesma empresa
      this.notifyCompanyUsers(user.companyId, 'user_joined', {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
      }, client.id);

    } catch (error) {
      this.logger.error('Authentication error:', error.message);
      client.emit('auth_error', { message: 'Token inválido ou expirado' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
    
    const user = this.connectedUsers.get(client.id);
    if (user) {
      // Notificar outros usuários da mesma empresa
      this.notifyCompanyUsers(user.companyId, 'user_left', {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
      }, client.id);
      
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { text: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) {
        client.emit('error', { message: 'Usuário não autenticado' });
        return;
      }

      const user = client.user;
      
      // Buscar thread padrão da empresa
      const defaultThread = await this.messageService.getOrCreateDefaultThread(user.companyId);

      // Salvar mensagem no banco
      const savedMessage = await this.messageService.createMessage({
        threadId: defaultThread.id,
        senderType: user.role === 'agent' ? 'agent' : 'contact',
        senderId: user.id,
        content: data.text,
      });

      const chatMessage: ChatMessage = {
        id: savedMessage.id,
        text: savedMessage.content || '',
        sender: user.role === 'agent' ? 'agent' : 'user',
        senderType: savedMessage.senderType as 'agent' | 'contact',
        senderName: user.name,
        createdAt: savedMessage.createdAt.toISOString(),
        threadId: savedMessage.threadId,
      };

      // Broadcast para todos os usuários da mesma empresa
      this.broadcastToCompany(user.companyId, 'message', chatMessage);

      return chatMessage;
    } catch (error) {
      this.logger.error('Error handling message:', error);
      client.emit('error', { message: 'Erro ao enviar mensagem' });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.user) return;
    
    this.notifyCompanyUsers(client.user.companyId, 'user_typing', {
      userId: client.user.id,
      userName: client.user.name,
    }, client.id);
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.user) return;
    
    this.notifyCompanyUsers(client.user.companyId, 'user_stopped_typing', {
      userId: client.user.id,
      userName: client.user.name,
    }, client.id);
  }

  // Métodos utilitários
  private extractTokenFromSocket(client: Socket): string | null {
    // Token pode vir do handshake query ou auth header
    const token = client.handshake.auth?.token || 
                 client.handshake.query?.token ||
                 client.request.headers.authorization?.replace('Bearer ', '');
    
    return token || null;
  }

  private broadcastToCompany(companyId: string, event: string, data: any) {
    for (const [socketId, user] of this.connectedUsers) {
      if (user.companyId === companyId) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }

  private notifyCompanyUsers(companyId: string, event: string, data: any, excludeSocketId?: string) {
    for (const [socketId, user] of this.connectedUsers) {
      if (user.companyId === companyId && socketId !== excludeSocketId) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }
}