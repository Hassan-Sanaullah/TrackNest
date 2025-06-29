import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private redisClient: Redis,
  ) {}

  async verifyOwnership(userId: string, websiteId: string): Promise<void> {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website || website.userId !== userId) {
      throw new ForbiddenException('Not your website');
    }
  }

  private isRecordOfNumbers(value: unknown): value is Record<string, number> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.values(value).every((v) => typeof v === 'number')
    );
  }

  async getOverview(websiteId: string, userId: string) {
    await this.verifyOwnership(userId, websiteId);

    const cacheKey = `overview:${websiteId}`;

    // Try cache first
    try {
      const cached = await this.redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      console.error('Redis error:', err);
    }

    // 1. Fetch all pre-aggregated event summaries
    const summaries = await this.prisma.eventSummary.findMany({
      where: { websiteId },
    });

    // 2. Get latest summary time
    const latestSummary = summaries.reduce((latest, current) =>
      current.date > latest.date ? current : latest,
      summaries[0] ?? null,
    );

    const deltaStart = latestSummary?.date ?? new Date(Date.now() - 1000 * 60 * 60); // default to 1 hour ago
    const deltaEnd = new Date();

    // 3. Fetch live events (after the last summary)
    const liveEvents = await this.prisma.event.findMany({
      where: {
        websiteId,
        timestamp: {
          gte: deltaStart,
          lt: deltaEnd,
        },
      },
      select: {
        eventType: true,
        url: true,
        referrer: true,
        sessionId: true,
      },
    });

    // Aggregators
    let totalSessions = 0;
    const aggregatedEventTypes: Record<string, number> = {};
    const combinedTopPages: Record<string, number> = {};
    const combinedReferrers: Record<string, number> = {};

    // 4. Aggregate pre-computed summaries
    for (const summary of summaries) {
      totalSessions += summary.sessions ?? 0;

      if (this.isRecordOfNumbers(summary.eventTypeCounts)) {
        for (const [type, count] of Object.entries(summary.eventTypeCounts)) {
          aggregatedEventTypes[type] = (aggregatedEventTypes[type] || 0) + count;
        }
      }

      if (this.isRecordOfNumbers(summary.topPages)) {
        for (const [url, count] of Object.entries(summary.topPages)) {
          combinedTopPages[url] = (combinedTopPages[url] || 0) + count;
        }
      }

      if (this.isRecordOfNumbers(summary.referrers)) {
        for (const [ref, count] of Object.entries(summary.referrers)) {
          combinedReferrers[ref] = (combinedReferrers[ref] || 0) + count;
        }
      }
    }

    // 5. Aggregate live (unaggregated) events
    const liveSessions = new Set<string>();

    for (const event of liveEvents) {
      aggregatedEventTypes[event.eventType] =
        (aggregatedEventTypes[event.eventType] || 0) + 1;

      if (event.eventType === 'page_view') {
        combinedTopPages[event.url] = (combinedTopPages[event.url] || 0) + 1;
      }

      const ref = event.referrer || 'direct';
      combinedReferrers[ref] = (combinedReferrers[ref] || 0) + 1;

      liveSessions.add(event.sessionId);
    }

    totalSessions += liveSessions.size;

    // 6. Get top 5 pages and referrers
    const topPages = Object.entries(combinedTopPages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, count]) => ({ url, count }));

    const topReferrers = Object.entries(combinedReferrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));

    // 7. Final result
    const data = {
      eventTypeCounts: aggregatedEventTypes,
      uniqueSessions: totalSessions,
      topPages,
      topReferrers,
    };

    // 8. Cache for 60s
    try {
      await this.redisClient.set(cacheKey, JSON.stringify(data), 'EX', 60);
    } catch (err) {
      console.error('Redis cache set error:', err);
    }

    return data;
  }
}
