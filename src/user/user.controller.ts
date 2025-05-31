import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';
import { UpdatePasswordDto } from './dto';
import { GetUser } from 'src/auth/decorator';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  userInfo(@GetUser('id') userId: string) {
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    return this.userService.userInfo(userId);
  }

  @Patch('update-password')
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @GetUser('id') userId: string,
  ) {
    return this.userService.updatePassword(dto, userId);
  }
}
