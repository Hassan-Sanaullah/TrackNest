import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { CreateEventDto } from './dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post('track')
  trackEvent(
    @Headers('x-domain') domain: string,
    @Body() dto: CreateEventDto,
    @Req() req,
  ) {
    const ip = normalizeIp(req.ip);
    const userAgent = req.headers['user-agent'];
    return this.eventsService.trackEvent(domain, dto, ip, userAgent);
  }
}

// extract the IPv4 part cleanly
function normalizeIp(ip: string): string {
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  } else if (ip === '::1') {
    return '127.0.0.1';
  }
  return ip;
}
