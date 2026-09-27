import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AtGuard } from '../auth/guards';
import { GetJwtUser } from '@/common/decorators/get-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@UseGuards(AtGuard)
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get('me')
    @ResponseMessage('Get settings successfully')
    async getSettings(@GetJwtUser('sub') userId: string) {
        return this.settingsService.getUserSettings(userId);
    }

    @Patch('me')
    @ResponseMessage('Update settings successfully')
    async updateSettings(@GetJwtUser('sub') userId: string, @Body() dto: any) {
        return this.settingsService.updateUserSettings(userId, dto);
    }
}
