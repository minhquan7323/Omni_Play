import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
} from 'class-validator';
import { Match } from '@src/common/decorators/match.decorator';

export class RegisterDto {
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Invalid email address' })
    email!: string;

    @IsNotEmpty({ message: 'Full name is required' })
    @IsString()
    fullName!: string;

    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password!: string;

    @IsNotEmpty({ message: 'Confirm password is required' })
    @Match('password', { message: 'Passwords do not match' })
    passwordConfirm!: string;

    // Role không còn được set khi register — được gán qua UserRoleAssignment sau khi tạo user
}
