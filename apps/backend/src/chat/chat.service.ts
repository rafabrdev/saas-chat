import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  async createMessage(data: CreateMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        threadId: data.threadId,
        senderType: data.senderType,
        senderId: data.senderId,
        content: data.content,
        contentJson: data.contentJson,
        attachments: data.attachments,
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