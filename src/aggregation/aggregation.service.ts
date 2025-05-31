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
      // Group events by websiteId, sessionId, and eventType
      const rawEvents = await this.prisma.event.groupBy({
        by: ['websiteId', 'sessionId', 'eventType'],
        where: {
          timestamp: {
            gte: startDate,
            lt: endDate,
          },
        },
        _count: true,
      });

      // Prepare aggregation map
      const aggregationMap = new Map<
        string,
        { pageViews: number; uniqueSessions: Set<string> }
      >();

      rawEvents.forEach((event) => {
        const day = startDate.toISOString().slice(0, 10); // YYYY-MM-DD
        const key = `${event.websiteId}_${day}`;

        if (!aggregationMap.has(key)) {
          aggregationMap.set(key, {
            pageViews: 0,
            uniqueSessions: new Set(),
          });
        }

        const agg = aggregationMap.get(key)!;

        if (event.eventType === 'page_view') {
          agg.pageViews += event._count;
        }

        agg.uniqueSessions.add(event.sessionId);
      });

      // Upsert results into EventSummary table
      for (const [key, { pageViews, uniqueSessions }] of aggregationMap.entries()) {
        const [websiteId, dateStr] = key.split('_');
        const date = new Date(dateStr); // ✅ Convert string to proper Date

        await this.prisma.eventSummary.upsert({
          where: {
            websiteId_date: {
              websiteId,
              date,
            },
          },
          update: {
            pageViews: { increment: pageViews },
            uniqueSessions: { increment: uniqueSessions.size },
          },
          create: {
            websiteId,
            date,
            pageViews,
            uniqueSessions: uniqueSessions.size,
          },
        });
      }

      this.logger.log('Hourly aggregation completed.');
    } catch (error) {
      this.logger.error('Error in hourly aggregation', error);
    }
  }
}
