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

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private messages: any[] = [];

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
    // Send message history to the new client
    client.emit('history', this.messages);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = {
      id: Date.now().toString(),
      text: data.text,
      sender: 'user',
      createdAt: new Date().toISOString(),
    };
    
    // Store message in memory (in production, use a database)
    this.messages.push(message);
    
    // Broadcast message to all connected clients
    this.server.emit('message', message);
    
    return message;
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @MessageBody() data: { sender: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    
    // Store message in memory
    this.messages.push(message);
    
    // Broadcast message to all connected clients
    this.server.emit('receiveMessage', message);
    
    return message;
  }
}
