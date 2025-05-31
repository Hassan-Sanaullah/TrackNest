import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePasswordDto } from './dto';
import * as argon from 'argon2';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async userInfo(userId: string) {
    const user: any = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('Invalid ID or token');
    }
    delete user.password;

    return user;
  }

  async updatePassword(dto: UpdatePasswordDto, userId: string) {
    const { currentPassword, newPassword } = dto;

    if (currentPassword === newPassword) {
      throw new ConflictException(
        'Current and new password cannot be the same',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isMatch = await argon.verify(user.password, currentPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await argon.hash(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }
}
