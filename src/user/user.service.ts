import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  userInfo(token: string) {
    const secret = this.config.get('JWT_SECRET');
    const payload = this.jwt.verify(token, { secret: secret });

    const user = this.prisma;
  }
}
