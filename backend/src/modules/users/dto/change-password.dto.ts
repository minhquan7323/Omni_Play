import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(32, { message: 'Password cannot exceed 32 characters' })
    oldPassword: string;

    @MinLength(6, {
        message: 'New password must be at least 6 characters long',
    })
    @IsNotEmpty({ message: 'New password is required' })
    @IsString()
    newPassword: string;
}
