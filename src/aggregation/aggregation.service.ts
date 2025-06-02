import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyAggregation() {
    this.logger.log('Starting hourly aggregation job...');

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setHours(endDate.getHours() - 1);

    try {
      const events = await this.prisma.event.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

      const map = new Map<
        string,
        {
          eventTypeCounts: Record<string, number>;
          sessions: Set<string>;
          topPages: Record<string, number>;
          referrers: Record<string, number>;
        }
      >();

      for (const event of events) {
        const hourStart = new Date(event.timestamp);
        hourStart.setMinutes(0, 0, 0);
        const key = `${event.websiteId}_${hourStart.toISOString()}`;

        if (!map.has(key)) {
          map.set(key, {
            eventTypeCounts: {},
            sessions: new Set(),
            topPages: {},
            referrers: {},
          });
        }

        const agg = map.get(key)!;

        // Increment event type count
        agg.eventTypeCounts[event.eventType] =
          (agg.eventTypeCounts[event.eventType] || 0) + 1;

        // Only add to topPages if it's a page_view
        if (event.eventType === 'page_view') {
          agg.topPages[event.url] = (agg.topPages[event.url] || 0) + 1;
        }

        // Track unique session
        agg.sessions.add(event.sessionId);

        // Aggregate referrer
        const ref = event.referrer || 'direct';
        agg.referrers[ref] = (agg.referrers[ref] || 0) + 1;
      }

      for (const [key, data] of map.entries()) {
        const [websiteId, dateStr] = key.split('_');
        const date = new Date(dateStr);

        await this.prisma.eventSummary.upsert({
          where: {
            websiteId_date: {
              websiteId,
              date,
            },
          },
          update: {
            eventTypeCounts: data.eventTypeCounts,
            sessions: data.sessions.size,
            topPages: data.topPages,
            referrers: data.referrers,
          },
          create: {
            websiteId,
            date,
            eventTypeCounts: data.eventTypeCounts,
            sessions: data.sessions.size,
            topPages: data.topPages,
            referrers: data.referrers,
          },
        });
      }

      this.logger.log('Hourly aggregation completed.');
    } catch (error) {
      this.logger.error('Error in hourly aggregation', error);
    }
  }
}
