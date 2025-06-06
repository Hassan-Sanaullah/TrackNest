import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { WebsitesModule } from './websites/websites.module';
import { EventsModule } from './events/events.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AggregationService } from './aggregation/aggregation.service';
import { RedisModule } from './redis/redis.module';
import { StatsModule } from './stats/stats.module';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PrismaModule,
    WebsitesModule,
    EventsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RedisModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AggregationService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('events'); // Apply to route(s) as needed
  }
}
