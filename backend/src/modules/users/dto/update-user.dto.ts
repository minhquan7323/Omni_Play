import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsNotEmpty({ message: 'Full name is required' })
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string | null;
}
