import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto } from './dto';
import Redis from 'ioredis';

@Injectable()
export class EventsService {
  private redisPublisher: Redis;

  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {
  }

  async trackEvent(
    domain: string,
    dto: CreateEventDto,
    ip: string,
    userAgent: string,
  ) {
    console.log(dto)
    const website = await this.prisma.website.findUnique({
      where: { id: dto.websiteId },
    });

    if (!website) {
      throw new ForbiddenException('Unregistered website');
    }

    let session = await this.prisma.session.findUnique({
      where: {
        sessionId_websiteId: {
          sessionId: dto.sessionId,
          websiteId: website.id,
        },
      },
    });

    if (!session) {
      session = await this.prisma.session.create({
        data: {
          sessionId: dto.sessionId,
          ip: ip,
          userAgent: userAgent,
          websiteId: website.id,
        },
      });
    }

    const eventCreate = await this.prisma.event.create({
      data: {
        eventType: dto.eventType,
        url: dto.url,
        referrer: dto.referrer,
        userAgent: userAgent,
        ip: ip,
        sessionId: dto.sessionId,
        websiteId: website.id,
      },
    });

    await this.redisClient.publish(
      `events:${eventCreate.websiteId}`,
      JSON.stringify(eventCreate),
    );

    return eventCreate;
  }
}
