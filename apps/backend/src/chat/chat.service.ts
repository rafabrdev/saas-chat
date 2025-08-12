import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType, MessageStatus } from '@prisma/client';

export interface CreateMessageDto {
  threadId: string;
  senderType: string;
  senderId?: string;
  content: string;
  contentJson?: any;
  attachments?: any;
}

export interface CreateThreadDto {
  companyId: string;
  contactId?: string;
  subject?: string;
  createdBy?: string;
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateDemoCompany() {
    let company = await this.prisma.company.findFirst({
      where: { name: 'BR Sistemas - Demo' },
    });

    if (!company) {
      company = await this.prisma.company.create({
        data: {
          name: 'BR Sistemas - Demo',
          plan: 'ESSENTIAL',
        },
      });
    }

    return company;
  }

  async getOrCreateActiveThread(companyId: string, userId: string) {
    // Primeiro tenta encontrar um thread ativo existente
    let thread = await this.prisma.thread.findFirst({
      where: {
        companyId,
        status: { in: ['new', 'open'] },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });

    // Se não encontrar, cria um novo thread
    if (!thread) {
      thread = await this.prisma.thread.create({
        data: {
          companyId,
          status: 'new',
          subject: 'Chat Conversation',
          createdBy: userId,
          lastActivity: new Date(),
        },
      });
    }

    return thread;
  }

  async createMessage(data: {
    content: string;
    threadId: string;
    senderType: string;
    senderId?: string;
    type?: MessageType;
  }) {
    // Verificar se o thread existe
    const thread = await this.prisma.thread.findUnique({
      where: { id: data.threadId },
    });

    if (!thread) {
      throw new Error(`Thread com ID ${data.threadId} não encontrado`);
    }

    const message = await this.prisma.message.create({
      data: {
        threadId: data.threadId,
        senderType: data.senderType,
        senderId: data.senderId,
        content: data.content,
        contentHtml: data.content, // Por enquanto, salvar o mesmo conteúdo
        type: data.type || MessageType.TEXT,
        status: MessageStatus.SENT,
      },
    });

    // Atualizar lastActivity do thread
    await this.prisma.thread.update({
      where: { id: data.threadId },
      data: { lastActivity: new Date() },
    });

    return message;
  }

  async getThreadMessages(threadId: string, limit = 50, offset = 0) {
    return this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  async createThread(data: CreateThreadDto) {
    // Verificar se a empresa existe
    const company = await this.prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      // Se não existir, usar empresa demo
      const demoCompany = await this.getOrCreateDemoCompany();
      data.companyId = demoCompany.id;
    }

    return this.prisma.thread.create({
      data: {
        companyId: data.companyId,
        contactId: data.contactId,
        subject: data.subject,
        createdBy: data.createdBy,
        status: 'new',
      },
    });
  }

  async getCompanyThreads(companyId: string, limit = 20, offset = 0) {
    return this.prisma.thread.findMany({
      where: { companyId },
      orderBy: { lastActivity: 'desc' },
      take: limit,
      skip: offset,
      include: {
        contact: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateThreadStatus(threadId: string, status: string) {
    return this.prisma.thread.update({
      where: { id: threadId },
      data: { 
        status,
        lastActivity: new Date(),
      },
    });
  }

  async markMessagesAsRead(threadId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: {
        threadId,
        readAt: null,
        NOT: {
          senderId: userId,
        },
      },
      data: {
        readAt: new Date(),
      },
    });
  }

}
