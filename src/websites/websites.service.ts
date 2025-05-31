import { ConflictException, Injectable } from '@nestjs/common';
import { CreateWebsiteDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WebsitesService {
  constructor(private prisma: PrismaService) {}

  async createWebsite(dto: CreateWebsiteDto, userId: string) {
    const exists = await this.prisma.website.findFirst({
      where: { name: dto.name, userId: userId },
    });

    if (exists) {
      throw new ConflictException('Website with the same name already exists');
    }

    const website = await this.prisma.website.create({
      data: { name: dto.name, domain: dto.domain, userId: userId },
    });

    return { message: 'Website created' };
  }

  async getWebsite(userId: string) {
    const websites = await this.prisma.website.findMany({
      where: { userId: userId },
      omit: { userId: true },
    });

    return websites;
  }
}
