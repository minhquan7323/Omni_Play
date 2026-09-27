import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1, { message: 'Page must be greater than 0' })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1, { message: 'Limit must be greater than 0' })
    @Max(100, { message: 'Limit must be less than or equal to 100' })
    limit?: number = 10;

    @IsOptional()
    @IsString()
    keyword?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    year?: string;

    @IsOptional()
    @IsIn(['modified.time', '_id', 'year'])
    sort_field?: string;

    @IsOptional()
    @IsIn(['desc', 'asc'])
    sort_type?: string;

    @IsOptional()
    @IsIn(['vietsub', 'thuyet-minh', 'long-tieng'])
    sort_lang?: string;
}
