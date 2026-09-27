import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { BoardRole } from '../constants/whiteboard.constant';

export class CreateBoardDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsBoolean()
    @IsOptional()
    isPrivate?: boolean = false;

    @IsString()
    @IsOptional()
    password?: string;
}

export class UpdateBoardDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsBoolean()
    @IsOptional()
    isPrivate?: boolean;
}

export class AddMemberDto {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsEnum(BoardRole)
    role!: BoardRole;
}

export class UpdateRoleDto {
    @IsEnum(BoardRole)
    role!: BoardRole;
}

export class VerifyPasswordDto {
    @IsString()
    @IsNotEmpty()
    password!: string;
}
