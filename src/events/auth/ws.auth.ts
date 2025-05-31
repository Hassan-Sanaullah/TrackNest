import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

interface DecodedToken {
  sub: string;
  email?: string;
  [key: string]: any;
}

export function authenticateWsClient(
  token: string,
  configService: ConfigService,
): DecodedToken | null {
  if (!token || typeof token !== 'string') {
    throw new Error('No token provided');
  }

  try {
    const secret: any = configService.get<string>('JWT_SECRET');
    return jwt.verify(token, secret) as DecodedToken;
  } catch (err) {
    return null;
  }
}
