import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { MessageService } from './message.service';
import { CompanyService } from './company.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { 
          expiresIn: '7d',
        },
      }),
    }),
  ],
  providers: [ChatGateway, MessageService, CompanyService, PrismaService],
  exports: [MessageService, CompanyService, PrismaService],
})
export class ChatModule {}
