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
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

interface ReactionEventData {
  messageId: string;
  emoji: string;
}

interface ConnectedUser {
  id: string;
  socketId: string;
  name?: string;
  companyId?: string;
  connectedAt: Date;
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
  private connectedUsers = new Map<string, ConnectedUser>();
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    try {
      // TODO: Implementar autenticação JWT do socket
      const userId = client.handshake.query.userId as string || `anonymous-${Date.now()}`;
      let companyId = client.handshake.query.companyId as string;
      
      // Se não tiver companyId, buscar ou criar empresa demo
      if (!companyId) {
        const demoCompany = await this.chatService.getOrCreateDemoCompany();
        companyId = demoCompany.id;
      }
      
      const user: ConnectedUser = {
        id: userId,
        socketId: client.id,
        name: `User ${userId}`,
        companyId,
        connectedAt: new Date(),
      };

      this.connectedUsers.set(client.id, user);
      this.userSockets.set(userId, client.id);

      // Join company room
      client.join(`company:${companyId}`);

      // Send message history
      await this.sendMessageHistory(client, companyId);

      // Broadcast user connected
      this.broadcastUserList(companyId);

      client.emit('connected', { userId, socketId: client.id });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.emit('connectionError', { message: 'Failed to establish connection' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const user = this.connectedUsers.get(client.id);
    if (user) {
      this.connectedUsers.delete(client.id);
      this.userSockets.delete(user.id);
      
      // Broadcast updated user list
      if (user.companyId) {
        this.broadcastUserList(user.companyId);
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { text: string; threadId?: string; tempId?: string },
  ) {
    try {
      const user = this.connectedUsers.get(client.id);
      if (!user) {
        client.emit('messageError', { message: 'User not found' });
        return;
      }

      if (!user.companyId) {
        client.emit('messageError', { message: 'Company not found' });
        return;
      }

      // Get or create thread
      let threadId = data.threadId;
      if (!threadId) {
        // Use o novo método que garante um thread válido
        const thread = await this.chatService.getOrCreateActiveThread(
          user.companyId,
          user.id
        );
        threadId = thread.id;
      }

      // Save message to database
      if (threadId) { // Adiciona verificação para garantir que threadId não é undefined
        const message = await this.chatService.createMessage({
          threadId,
          senderType: 'user',
          senderId: user.id,
          content: data.text,
        });

        const enrichedMessage = {
          id: message.id,
          text: message.content,
          sender: 'user',
          senderName: user.name,
          senderId: user.id,
          threadId: message.threadId,
          createdAt: message.createdAt.toISOString(),
        };

        // Broadcast to company room
        this.server.to(`company:${user.companyId}`).emit('message', enrichedMessage);

        // Send confirmation to sender with threadId
        client.emit('messageDelivered', { 
          tempId: data.tempId, 
          message: enrichedMessage,
          threadId: threadId // Incluir threadId na resposta
        });

        return { success: true, message: enrichedMessage, threadId };
      } else {
        // Lidar com o caso onde o threadId é undefined
        const errorMessage = 'Ocorreu um erro ao obter ou criar o chat. Tente novamente.';
        this.logger.error(errorMessage);
        client.emit('messageError', { 
          message: errorMessage,
          tempId: data.tempId 
        });
      }
    } catch (error) {
      this.logger.error(`Send message error: ${error.message}`);
      client.emit('messageError', { 
        message: 'Failed to send message',
        tempId: data.tempId 
      });
    }
  }

  @SubscribeMessage('getHistory')
  async handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId?: string; page?: number; limit?: number },
  ) {
    try {
      const user = this.connectedUsers.get(client.id);
      if (!user) {
        return { error: 'User not found' };
      }

      let messages: any[] = [];
      let hasMore = false;

      if (data.threadId) {
        // Get specific thread messages
        messages = await this.chatService.getThreadMessages(
          data.threadId,
          data.limit || 50,
          (data.page || 0) * (data.limit || 50)
        );
        hasMore = messages.length === (data.limit || 50);
      } else {
        // Get recent messages from company
        const threads = await this.chatService.getCompanyThreads(
          user.companyId!,
          1,
          0
        );
        
        if (threads.length > 0) {
          messages = await this.chatService.getThreadMessages(threads[0].id);
        }
      }

      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.senderType,
        senderId: msg.senderId,
        threadId: msg.threadId,
        createdAt: msg.createdAt.toISOString(),
      }));

      return { messages: formattedMessages, hasMore };
    } catch (error) {
      this.logger.error(`Get history error: ${error.message}`);
      return { error: 'Failed to get message history' };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { isTyping: boolean; threadId?: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    // Broadcast typing status to company room (except sender)
    client.to(`company:${user.companyId}`).emit('userTyping', {
      userId: user.id,
      userName: user.name,
      isTyping: data.isTyping,
      threadId: data.threadId,
    });
  }

  @SubscribeMessage('joinThread')
  async handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    try {
      client.join(`thread:${data.threadId}`);
      
      // Mark messages as read
      const user = this.connectedUsers.get(client.id);
      if (user) {
        await this.chatService.markMessagesAsRead(data.threadId, user.id);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Join thread error: ${error.message}`);
      return { error: 'Failed to join thread' };
    }
  }

  private async sendMessageHistory(client: Socket, companyId: string) {
    try {
      // Verificar se companyId é válido
      if (!companyId) {
        client.emit('history', []);
        return;
      }

      const threads = await this.chatService.getCompanyThreads(companyId, 1, 0);
      
      if (threads.length > 0 && threads[0].id) {
        const messages = await this.chatService.getThreadMessages(threads[0].id);
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.senderType,
          senderId: msg.senderId,
          threadId: msg.threadId,
          createdAt: msg.createdAt.toISOString(),
        }));

        client.emit('history', formattedMessages);
      } else {
        // Não há threads ainda, enviar histórico vazio
        client.emit('history', []);
      }
    } catch (error) {
      this.logger.error(`Send history error: ${error.message}`);
      client.emit('history', []);
    }
  }

  private broadcastUserList(companyId: string) {
    const companyUsers = Array.from(this.connectedUsers.values())
      .filter(user => user.companyId === companyId)
      .map(user => ({
        id: user.id,
        name: user.name,
        connectedAt: user.connectedAt,
      }));

    this.server.to(`company:${companyId}`).emit('onlineUsers', companyUsers);
  }

  // Helper method to send message to specific user
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Get connected users stats
  getConnectionStats() {
    const stats = {
      totalConnections: this.connectedUsers.size,
      usersByCompany: new Map<string, number>(),
    };

    for (const user of this.connectedUsers.values()) {
      if (user.companyId) {
        const current = stats.usersByCompany.get(user.companyId) || 0;
        stats.usersByCompany.set(user.companyId, current + 1);
      }
    }

    return stats;
  }

}
