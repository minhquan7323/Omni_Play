import { GetJwtUser } from '@/common/decorators/get-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AtGuard } from '../auth/guards/at.guard';
import {
    AddMemberDto,
    CreateBoardDto,
    UpdateBoardDto,
    UpdateRoleDto,
    VerifyPasswordDto,
} from './dto/whiteboard.dto';
import { WhiteboardService } from './whiteboard.service';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(AtGuard)
@Controller('whiteboards')
export class WhiteboardController {
    constructor(private readonly whiteboardService: WhiteboardService) {}

    @Get()
    @ResponseMessage('Fetched all boards successfully')
    async findAll() {
        return await this.whiteboardService.findAll();
    }

    @Get(':boardId')
    @ResponseMessage('Fetched boards successfully')
    async findOneById(@Param('boardId') boardId: string) {
        return await this.whiteboardService.findOneById(boardId);
    }

    @Patch(':boardId')
    @ResponseMessage('Updated board info successfully')
    async updateBoardInfo(
        @GetJwtUser('sub') currentUserId: string,
        @Param('boardId') boardId: string,
        @Body() dto: UpdateBoardDto,
    ) {
        return await this.whiteboardService.updateBoardInfo(
            boardId,
            currentUserId,
            dto,
        );
    }

    @Post()
    @ResponseMessage('Board created successfully')
    async create(
        @Body() dto: CreateBoardDto,
        @GetJwtUser('sub') ownerId: string,
    ) {
        return await this.whiteboardService.create(ownerId, dto);
    }

    @Post(':boardId/verify-password')
    @ResponseMessage('Password verification successfully')
    async verifyPassword(
        @GetJwtUser('sub') userId: string,
        @Param('boardId') boardId: string,
        @Body() dto: VerifyPasswordDto,
    ) {
        return await this.whiteboardService.verifyPassword(
            boardId,
            userId,
            dto.password,
        );
    }

    @Post(':boardId/members')
    @ResponseMessage('Member added successfully')
    async addMember(
        @GetJwtUser('sub') currentUserId: string,
        @Param('boardId') boardId: string,
        @Body() dto: AddMemberDto,
    ) {
        return await this.whiteboardService.addMember(
            boardId,
            currentUserId,
            dto,
        );
    }

    @Patch(':boardId/thumbnail')
    @UseInterceptors(FileInterceptor('file'))
    async uploadThumbnail(
        @Param('boardId') boardId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('File is required');
        const url = await this.whiteboardService.uploadThumbnailToCloudinary(
            boardId,
            file,
        );
        return { thumbnailUrl: url };
    }

    @Patch(':boardId/members/:targetUserId')
    @ResponseMessage('Member role updated successfully')
    async updateMemberRole(
        @GetJwtUser('sub') currentUserId: string,
        @Param('boardId') boardId: string,
        @Param('targetUserId') targetUserId: string,
        @Body() dto: UpdateRoleDto,
    ) {
        return await this.whiteboardService.updateMemberRole(
            boardId,
            currentUserId,
            targetUserId,
            dto.role,
        );
    }

    @Post(':boardId/ban/:targetUserId')
    async banUser(
        @GetJwtUser('sub') currentUserId: string,
        @Param('boardId') boardId: string,
        @Param('targetUserId') targetUserId: string,
    ) {
        return await this.whiteboardService.banUser(
            boardId,
            currentUserId,
            targetUserId,
        );
    }

    @Delete(':boardId/members/:targetUserId')
    @ResponseMessage('Member removed successfully')
    async removeMember(
        @GetJwtUser('sub') currentUserId: string,
        @Param('boardId') boardId: string,
        @Param('targetUserId') targetUserId: string,
    ) {
        return await this.whiteboardService.removeMember(
            boardId,
            currentUserId,
            targetUserId,
        );
    }

    @Delete(':boardId')
    @ResponseMessage('Board deleted successfully')
    async delete(
        @GetJwtUser('sub') currentUserId: string,
        @Param('boardId') boardId: string,
    ) {
        return await this.whiteboardService.delete(boardId, currentUserId);
    }
}
