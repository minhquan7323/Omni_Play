import { compareHashData, hashData } from '@/common/helpers/util';
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BoardRole } from './constants/whiteboard.constant';
import {
    AddMemberDto,
    CreateBoardDto,
    UpdateBoardDto,
} from './dto/whiteboard.dto';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';
import { Board } from './schemas/board.schema';
import { BoardData } from './schemas/board-data.schema';
import { PrismaService } from '@/database/prisma/prisma.service';

@Injectable()
export class WhiteboardService {
    constructor(
        @InjectModel(Board.name) private boardModel: Model<Board>,
        @InjectModel(BoardData.name) private boardDataModel: Model<BoardData>,
        private cloudinaryService: CloudinaryService,
        private prisma: PrismaService,
    ) { }

    async findAll() {
        const boards = await this.boardModel
            .find()
            .select('-password')
            .lean()
            .exec();
        if (!boards.length) return [];

        const userMap = await this.getUserMap(boards.map((b) => b.ownerId));

        return boards.map((b) => ({
            ...b,
            ownerName: userMap.get(b.ownerId) ?? 'Unknown Owner',
        }));
    }

    async findOneById(boardId: string) {
        const board = await this.boardModel.findOne({ boardId }).lean().exec();
        if (!board) throw new NotFoundException('Board not found');

        const allUserIds = [
            board.ownerId,
            ...board.members.map((m) => m.userId),
        ];
        const userMap = await this.getUserMap(allUserIds);

        const enrichedMembers = board.members.map((m) => ({
            ...m,
            fullName: userMap.get(m.userId) ?? 'Unknown User',
        }));

        return {
            ...board,
            owner: {
                userId: board.ownerId,
                fullName: userMap.get(board.ownerId) ?? 'Unknown Owner',
            },
            members: enrichedMembers,
        };
    }

    async create(ownerId: string, dto: CreateBoardDto) {
        let hashedPassword = undefined;
        if (dto.password) {
            hashedPassword = await hashData(dto.password);
        }

        const board = await this.boardModel.create({
            name: dto.name,
            ownerId,
            isPrivate: dto.isPrivate ?? false,
            password: hashedPassword,
            members: [{ userId: ownerId, role: BoardRole.OWNER }],
        });

        await this.boardDataModel.create({
            boardId: board.boardId,
            records: {},
        });

        return {
            boardId: board.boardId,
            name: board.name,
            isPrivate: board.isPrivate,
            hasPassword: !!dto.password,
        };
    }

    async updateBoardInfo(
        boardId: string,
        currentUserId: string,
        dto: UpdateBoardDto,
    ) {
        const board = await this.boardModel.findOne({ boardId }).exec();
        if (!board) throw new NotFoundException('Board not found');

        if (!this.isUserOwner(board, currentUserId)) {
            throw new ForbiddenException(
                'Only the owner can edit board information',
            );
        }

        if (dto.name) board.name = dto.name;
        if (typeof dto.isPrivate === 'boolean') board.isPrivate = dto.isPrivate;

        await board.save();
        return board;
    }

    async getUserBoards(userId: string) {
        const boards = await this.boardModel
            .find({ 'members.userId': userId })
            .select('-password')
            .lean()
            .exec();

        if (!boards.length) return [];

        const userMap = await this.getUserMap(boards.map((b) => b.ownerId));

        return boards.map((b) => ({
            ...b,
            ownerName: userMap.get(b.ownerId) ?? 'Unknown Owner',
        }));
    }

    async verifyPassword(
        boardId: string,
        userId: string,
        passwordInput: string,
    ) {
        const board = await this.boardModel
            .findOne({ boardId })
            .select('+password');
        if (!board) throw new NotFoundException('Board not found');
        if (!board.password)
            throw new BadRequestException('Board has no password');

        const isMatch = await compareHashData(passwordInput, board.password);
        if (!isMatch) throw new BadRequestException('Password is incorrect');

        if (
            !this.isUserMember(board, userId) &&
            !this.isUserOwner(board, userId)
        ) {
            board.members.push({ userId, role: BoardRole.VIEWER });
            await board.save();
        }

        return;
    }

    async addMember(boardId: string, currentUserId: string, dto: AddMemberDto) {
        const board = await this.boardModel.findOne({ boardId }).exec();
        if (!board) throw new NotFoundException('Board not found');

        if (!this.isUserOwner(board, currentUserId)) {
            throw new ForbiddenException('Only the owner can add members');
        }

        const targetUser = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });
        if (!targetUser) {
            throw new NotFoundException('User does not exist');
        }

        if (this.isUserMember(board, dto.userId)) {
            throw new BadRequestException(
                'User is already a member of the board',
            );
        }

        board.members.push({ userId: dto.userId, role: dto.role });
        await board.save();
        return board;
    }

    async updateMemberRole(
        boardId: string,
        currentUserId: string,
        targetUserId: string,
        newRole: BoardRole,
    ) {
        const board = await this.boardModel.findOne({ boardId }).exec();
        if (!board) throw new NotFoundException('Board not found');

        if (!this.isUserOwner(board, currentUserId)) {
            throw new ForbiddenException(
                'Only the owner can change member roles',
            );
        }

        if (this.isUserOwner(board, targetUserId)) {
            throw new BadRequestException(
                'Cannot change the role of the Owner',
            );
        }

        const member = this.isUserMember(board, targetUserId);
        if (!member)
            throw new NotFoundException('Member not found in the board');

        member.role = newRole;
        await board.save();
        return board;
    }

    async uploadThumbnailToCloudinary(
        boardId: string,
        file: Express.Multer.File,
    ): Promise<string> {
        const uploadResult = await this.cloudinaryService.uploadFile(file, {
            folder: 'whiteboard_thumbnails',
            publicId: `board_${boardId}`,
        });

        await this.boardModel.updateOne(
            { boardId },
            { $set: { thumbnailUrl: uploadResult } },
        );

        return uploadResult;
    }

    async banUser(
        boardId: string,
        currentUserId: string,
        targetUserId: string,
    ) {
        const board = await this.boardModel.findOne({ boardId }).exec();
        if (!board) throw new NotFoundException('Board not found');

        if (!this.isUserOwner(board, currentUserId)) {
            throw new ForbiddenException('Only the owner can ban users');
        }

        if (!board.bannedUserIds.includes(targetUserId)) {
            board.bannedUserIds.push(targetUserId);
        }
        board.members = board.members.filter((m) => m.userId !== targetUserId);
        await board.save();
        return board;
    }

    async removeMember(
        boardId: string,
        currentUserId: string,
        targetUserId: string,
    ) {
        const board = await this.boardModel.findOne({ boardId }).exec();
        if (!board) throw new NotFoundException('Board not found');

        if (!this.isUserOwner(board, currentUserId)) {
            throw new ForbiddenException('Only the owner can remove members');
        }

        board.members = board.members.filter((m) => m.userId !== targetUserId);

        await board.save();
        return board;
    }

    async delete(boardId: string, currentUserId: string) {
        const board = await this.boardModel.findOne({ boardId }).exec();
        if (!board) throw new NotFoundException('Board not found');

        if (!this.isUserOwner(board, currentUserId)) {
            throw new ForbiddenException('Only the owner can delete the board');
        }

        await this.boardModel.deleteOne({ boardId });
        await this.boardDataModel.deleteOne({ boardId });
    }

    async validateAccess(boardId: string, userId: string) {
        const board = await this.boardModel.findOne({ boardId }).exec();
        if (!board) {
            return { canAccess: false, reason: 'Board not found' };
        }

        if (board.bannedUserIds?.includes(userId)) {
            return {
                canAccess: false,
                reason: 'You are banned from this Board',
            };
        }

        if (this.isUserOwner(board, userId)) {
            return { canAccess: true, role: BoardRole.OWNER };
        }

        const member = this.isUserMember(board, userId);
        if (member) {
            return { canAccess: true, role: member.role };
        }

        if (!board.isPrivate && !board.password) {
            return { canAccess: true, role: BoardRole.VIEWER };
        }

        return {
            canAccess: false,
            reason: 'Board requires access permission or password',
        };
    }

    async saveBoardChanges(boardId: string, changes: any) {
        const updateQuery: Record<string, any> = {};

        if (changes.added) {
            Object.keys(changes.added).forEach((id) => {
                updateQuery[`records.${id}`] = changes.added[id];
            });
        }
        if (changes.updated) {
            Object.keys(changes.updated).forEach((id) => {
                updateQuery[`records.${id}`] = changes.updated[id][1];
            });
        }

        const unsetQuery: Record<string, any> = {};
        if (changes.removed) {
            Object.keys(changes.removed).forEach((id) => {
                unsetQuery[`records.${id}`] = 1;
            });
        }

        const updateOperation: any = {};
        if (Object.keys(updateQuery).length > 0)
            updateOperation['$set'] = updateQuery;
        if (Object.keys(unsetQuery).length > 0)
            updateOperation['$unset'] = unsetQuery;

        if (Object.keys(updateOperation).length > 0) {
            await this.boardDataModel.updateOne({ boardId }, updateOperation);
        }
    }

    async getBoardData(boardId: string) {
        let board = await this.boardDataModel.findOne({ boardId });
        if (!board) {
            board = await this.boardDataModel.create({ boardId, records: {} });
        }
        return board;
    }

    private isUserMember(board: Board, userId: string) {
        return board.members.find((m) => m.userId === userId);
    }

    private isUserOwner(board: Board, userId: string): boolean {
        return board.ownerId === userId;
    }

    private async getUserMap(userIds: string[]): Promise<Map<string, string>> {
        const uniqueIds = [...new Set(userIds.filter(Boolean))];
        if (!uniqueIds.length) return new Map();

        const users = await this.prisma.user.findMany({
            where: { id: { in: uniqueIds } },
            select: { id: true, fullName: true },
        });
        return new Map(users.map((u) => [u.id, u.fullName]));
    }
}
