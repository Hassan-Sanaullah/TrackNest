import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { WebsitesService } from './websites.service';
import { CreateWebsiteDto } from './dto';
import { GetUser } from 'src/auth/decorator';

@UseGuards(JwtGuard)
@Controller('websites')
export class WebsitesController {
    constructor(private websitesService: WebsitesService) { }

    @Post('create')
    createWebsite(@Body() dto: CreateWebsiteDto, @GetUser('id') userId: string) {
        return this.websitesService.createWebsite(dto, userId);
    }

    @Get()
    getWebsite(@GetUser('id') userId: string) {
        return this.websitesService.getWebsite(userId);
    }
}
