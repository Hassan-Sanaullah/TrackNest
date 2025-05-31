// create-website.dto.ts
import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateWebsiteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  domain: string;
}
