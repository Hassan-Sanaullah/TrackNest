import { Injectable, NestMiddleware, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    if (!ip) return next();

    const key = `ratelimit:${ip}`;
    const count = await this.redisClient.incr(key);

    if (count === 1) {
      await this.redisClient.expire(key, 60); // 1 minute
    }

    if (count > 100) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }
}
