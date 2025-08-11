import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  companyName?: string;
  cnpj?: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
    company: {
      id: string;
      name: string;
      plan: string;
    };
  };
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterDto): Promise<AuthResult> {
    // Verificar se o email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Criar empresa se não for fornecida
    let company;
    if (data.companyName) {
      company = await this.prisma.company.create({
        data: {
          name: data.companyName,
          cnpj: data.cnpj,
          plan: 'ESSENTIAL',
        },
      });
    } else {
      // Buscar empresa demo ou criar uma
      company = await this.prisma.company.findFirst({
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
    }

    // Criar usuário
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'agent', // Por padrão, todos são agentes
        companyId: company.id,
      },
      include: {
        company: true,
      },
    });

    // Gerar token JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        company: {
          id: user.company.id,
          name: user.company.name,
          plan: user.company.plan,
        },
      },
      token,
    };
  }

  async login(data: LoginDto): Promise<AuthResult> {
    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // Verificar se o usuário está ativo
    if (!user.active) {
      throw new UnauthorizedException('Usuário desativado');
    }

    // Gerar token JWT
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        company: {
          id: user.company.id,
          name: user.company.name,
          plan: user.company.plan,
        },
      },
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
      },
    });

    if (!user || !user.active) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      company: {
        id: user.company.id,
        name: user.company.name,
        plan: user.company.plan,
      },
    };
  }

  async refreshToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário não encontrado ou desativado');
    }

    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    });
  }
}