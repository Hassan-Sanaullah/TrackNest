import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService, @Inject('REDIS_CLIENT') private redisClient: Redis,) { }

  async verifyOwnership(userId: string, websiteId: string): Promise<void> {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website || website.userId !== userId) {
      throw new ForbiddenException('Not your website');
    }
  }

  // Runtime type check for Record<string, number>
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
    let cached
    try {
      cached = await this.redisClient.get(cacheKey);
    } catch (err) {
      console.error('Redis error:', err);
    }
    console.log(cached)
    if (cached) {
      return JSON.parse(cached);
    }


    // Fetch all event summaries
    const summaries = await this.prisma.eventSummary.findMany({
      where: { websiteId },
    });

    if (!summaries.length) {
      const data = {
        eventTypeCounts: {},
        uniqueSessions: 0,
        topPages: [],
        topReferrers: [],
      };

      await this.redisClient.set(cacheKey, JSON.stringify(data), 'EX', 60);
      return data;
    }

    // Aggregators
    let totalSessions = 0;
    const aggregatedEventTypes: Record<string, number> = {};
    const combinedTopPages: Record<string, number> = {};
    const combinedReferrers: Record<string, number> = {};

    for (const summary of summaries) {
      totalSessions += summary.sessions ?? 0;

      // Safe parse eventTypeCounts
      const eventTypes = summary.eventTypeCounts;
      if (this.isRecordOfNumbers(eventTypes)) {
        for (const [type, count] of Object.entries(eventTypes)) {
          aggregatedEventTypes[type] = (aggregatedEventTypes[type] || 0) + count;
        }
      }

      // Safe parse topPages
      if (this.isRecordOfNumbers(summary.topPages)) {
        for (const [page, count] of Object.entries(summary.topPages)) {
          combinedTopPages[page] = (combinedTopPages[page] || 0) + count;
        }
      }

      // Safe parse referrers
      if (this.isRecordOfNumbers(summary.referrers)) {
        for (const [ref, count] of Object.entries(summary.referrers)) {
          combinedReferrers[ref] = (combinedReferrers[ref] || 0) + count;
        }
      }
    }

    // Get top 5 pages
    const topPages = Object.entries(combinedTopPages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, count]) => ({ url, count }));

    // Get top 5 referrers
    const topReferrers = Object.entries(combinedReferrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));


    const data = {
      eventTypeCounts: aggregatedEventTypes,
      uniqueSessions: totalSessions,
      topPages,
      topReferrers,
    };

    await this.redisClient.set(cacheKey, JSON.stringify(data), 'EX', 60);
    return data
  }
}
