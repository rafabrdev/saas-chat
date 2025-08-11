import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  // Buscar empresa por ID
  async findById(id: string) {
    return await this.prisma.company.findUnique({
      where: { id },
      include: {
        users: true,
        threads: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
  }

  // Criar empresa demo (para desenvolvimento)
  async createDemoCompany() {
    const existingCompany = await this.prisma.company.findFirst({
      where: { name: 'BR Sistemas - Demo' },
    });

    if (existingCompany) {
      return existingCompany;
    }

    return await this.prisma.company.create({
      data: {
        name: 'BR Sistemas - Demo',
        cnpj: '12.345.678/0001-90',
        plan: 'ESSENTIAL',
        createdAt: new Date(),
      },
    });
  }

  // Listar todas as empresas
  async findAll() {
    return await this.prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            threads: true,
          },
        },
      },
    });
  }
}