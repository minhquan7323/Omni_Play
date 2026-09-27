import { Optional } from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsNotEmpty({ message: 'Full name is required' })
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string | null;

    // role và refreshToken không còn là field trực tiếp trên User model
    // - role: quản lý qua UserRoleAssignment
    // - refreshToken: quản lý qua bảng RefreshToken riêng
}
