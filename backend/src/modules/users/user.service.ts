import { compareHashData, hashData } from '@/common/helpers/util';
import { PrismaService } from '@/database/prisma/prisma.service';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.user.findMany();
    }

    async delete(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) throw new NotFoundException('User not found');

        await this.prisma.user.delete({
            where: { id: userId },
        });

        return;
    }

    async findById(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) throw new NotFoundException('User not found');

        return user;
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) throw new NotFoundException('User not found');

        return user;
    }

    async update(userId: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { ...dto },
        });

        return user;
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.findById(userId);

        const isPasswordValid = await compareHashData(
            dto.oldPassword,
            user.password,
        );

        if (!isPasswordValid) {
            throw new BadRequestException('Old password is incorrect');
        }

        const hashedPassword = await hashData(dto.newPassword);

        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return;
    }
}
