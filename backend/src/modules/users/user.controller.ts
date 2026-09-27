import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    UseGuards,
} from '@nestjs/common';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { AtGuard } from '../auth/guards/at.guard';
import { GetJwtUser } from '@/common/decorators/get-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@UseGuards(AtGuard)
@Controller('users')
export class UserController {
    constructor(private userService: UserService) {}

    @Get()
    @ResponseMessage('Fetch list users successfully')
    async findAll() {
        return await this.userService.findAll();
    }

    @Delete(':id')
    @ResponseMessage('User deleted successfully')
    async delete(@Param('sub', ParseUUIDPipe) userId: string) {
        return await this.userService.delete(userId);
    }

    @Get(':id')
    async findOne(@Param('sub', ParseUUIDPipe) userId: string) {
        return await this.userService.findById(userId);
    }

    @Get('email')
    async findByEmail(@Body('email') email: string) {
        return await this.userService.findByEmail(email);
    }

    @Patch(':id')
    async updateProfile(
        @Param('id', ParseUUIDPipe) userId: string,
        @Body() dto: UpdateUserDto,
    ) {
        return await this.userService.update(userId, dto);
    }

    @Patch('change-password')
    async changePassword(
        @GetJwtUser('sub') userId: string,
        @Body() dto: ChangePasswordDto,
    ) {
        return await this.userService.changePassword(userId, dto);
    }
}
