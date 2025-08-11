import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockPrisma } from '../../test/setup';

describe('ChatService', () => {
  let service: ChatService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      const mockMessage = {
        id: '1',
        threadId: 'thread1',
        senderType: 'user',
        senderId: 'user1',
        content: 'Hello world',
        createdAt: new Date(),
      };

      prismaService.message.create.mockResolvedValue(mockMessage);

      const result = await service.createMessage({
        threadId: 'thread1',
        senderType: 'user',
        senderId: 'user1',
        content: 'Hello world',
      });

      expect(result).toEqual(mockMessage);
      expect(prismaService.message.create).toHaveBeenCalledWith({
        data: {
          threadId: 'thread1',
          senderType: 'user',
          senderId: 'user1',
          content: 'Hello world',
        },
      });
    });

    it('should handle create message error', async () => {
      prismaService.message.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createMessage({
          threadId: 'thread1',
          senderType: 'user',
          senderId: 'user1',
          content: 'Hello world',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('getThreadMessages', () => {
    it('should return messages for a thread', async () => {
      const mockMessages = [
        {
          id: '1',
          threadId: 'thread1',
          content: 'Message 1',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          threadId: 'thread1',
          content: 'Message 2',
          createdAt: new Date('2024-01-02'),
        },
      ];

      prismaService.message.findMany.mockResolvedValue(mockMessages);

      const result = await service.getThreadMessages('thread1');

      expect(result).toEqual(mockMessages);
      expect(prismaService.message.findMany).toHaveBeenCalledWith({
        where: { threadId: 'thread1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('createThread', () => {
    it('should create a thread successfully', async () => {
      const mockThread = {
        id: 'thread1',
        companyId: 'company1',
        subject: 'Test Thread',
        status: 'new',
        createdAt: new Date(),
      };

      prismaService.thread.create.mockResolvedValue(mockThread);

      const result = await service.createThread({
        companyId: 'company1',
        subject: 'Test Thread',
      });

      expect(result).toEqual(mockThread);
    });
  });
});