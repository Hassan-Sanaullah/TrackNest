import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { StatsService } from './stats.service';

@UseGuards(JwtGuard)
@Controller('stats')
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get(':websiteId/overview')
  async getOverview(
    @Param('websiteId') websiteId: string,
    @GetUser('id') userId: string,
  ) {
    return this.statsService.getOverview(websiteId, userId);
  }

}
