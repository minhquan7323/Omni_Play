import { IsBoolean, IsOptional, IsString, IsArray } from 'class-validator';

export class CreatePlaylistDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;
}