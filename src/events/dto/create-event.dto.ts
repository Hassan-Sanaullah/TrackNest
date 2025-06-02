// create-event.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsString()
  websiteId: string;

  @IsString()
  eventType: string;

  @IsString()
  url: string;

  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
