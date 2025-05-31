import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.query.token as string; // token comes from query params

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      // Optionally attach user info to socket for later use
      (client as any).user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
