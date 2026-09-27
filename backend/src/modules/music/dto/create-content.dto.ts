import { IsArray, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateArtistDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    image: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateAlbumDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsDateString()
    releaseDate?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    artistIds?: string[];
}

export class CreateTrackDto {
    @IsString()
    title: string;

    @IsString()
    duration: string;

    @IsOptional()
    @IsString()
    lyrics?: string;

    @IsOptional()
    @IsString()
    albumId?: string;

    @IsArray()
    @IsString({ each: true })
    artistIds: string[];
}