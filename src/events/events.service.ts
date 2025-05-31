import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto } from './dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async trackEvent(
    domain: string,
    dto: CreateEventDto,
    ip: string,
    userAgent: string,
  ) {
    const website = await this.prisma.website.findFirst({
      where: { domain: domain },
    });

    if (!website) {
      throw new ForbiddenException('Unregistered domain');
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

    return eventCreate;
  }
}
