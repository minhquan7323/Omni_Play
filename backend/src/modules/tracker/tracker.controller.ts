import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { AtGuard } from '../auth/guards';
import { GetJwtUser } from '@/common/decorators/get-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@UseGuards(AtGuard)
@Controller('tracker')
export class TrackerController {
    constructor(private readonly trackerService: TrackerService) {}

    @Get('me')
    @ResponseMessage('Get my actions successfully')
    async getMyActions(@GetJwtUser('sub') userId: string) {
        return this.trackerService.getUserActions(userId);
    }

    @Get('admin')
    @ResponseMessage('Get all actions successfully')
    async getAllActions(
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('module') module?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.trackerService.getAllActions({
            userId,
            action,
            module,
            page: page ? +page : 1,
            limit: limit ? +limit : 50,
        });
    }

    @Get('stats')
    @ResponseMessage('Get action statistics successfully')
    async getStats() {
        return this.trackerService.getStats();
    }
}
