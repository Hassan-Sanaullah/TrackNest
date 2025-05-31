import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsGateway } from './events.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  controllers: [EventsController],
  providers: [EventsService, EventsGateway],
})
export class EventsModule {}
