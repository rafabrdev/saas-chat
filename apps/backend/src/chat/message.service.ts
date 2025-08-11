import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  // Criar uma nova mensagem
  async createMessage(data: {
    threadId: string;
    senderType: 'agent' | 'contact';
    senderId?: string;
    content: string;
  }) {
    const message = await this.prisma.message.create({
      data: {
        threadId: data.threadId,
        senderType: data.senderType,
        senderId: data.senderId,
        content: data.content,
        createdAt: new Date(),
      },
    });

    // Atualizar última atividade do thread
    await this.prisma.thread.update({
      where: { id: data.threadId },
      data: { lastActivity: new Date() },
    });

    return message;
  }

  // Buscar mensagens de um thread
  async getMessagesByThread(threadId: string) {
    return await this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Buscar mensagens recentes (para histórico inicial)
  async getRecentMessages(limit: number = 50) {
    return await this.prisma.message.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        thread: {
          include: {
            contact: true,
          },
        },
      },
    });
  }

  // Criar ou buscar um thread padrão
  async getOrCreateDefaultThread(companyId: string) {
    try {
      let thread = await this.prisma.thread.findFirst({
        where: {
          companyId,
          subject: 'Chat Geral',
        },
      });

      if (!thread) {
        console.log(`Creating new thread for company: ${companyId}`);
        thread = await this.prisma.thread.create({
          data: {
            companyId,
            subject: 'Chat Geral',
            status: 'active',
            createdAt: new Date(),
          },
        });
        console.log(`Thread created with ID: ${thread.id}`);
      } else {
        console.log(`Found existing thread: ${thread.id}`);
      }

      return thread;
    } catch (error) {
      console.error('Error in getOrCreateDefaultThread:', error);
      throw error;
    }
  }
}