import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

// Mock do PrismaClient
export const mockPrisma = {
  company: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  thread: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  contact: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock do Redis
export const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  keys: jest.fn(),
  flushall: jest.fn(),
};

// Helper para criar aplicação de teste
export async function createTestApp(moduleMetadata: any): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule(moduleMetadata).compile();
  
  const app = moduleRef.createNestApplication();
  await app.init();
  
  return app;
}

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Setup global para testes
beforeAll(() => {
  // Configure timezone para testes consistentes
  process.env.TZ = 'UTC';
});

afterAll(async () => {
  // Cleanup
});