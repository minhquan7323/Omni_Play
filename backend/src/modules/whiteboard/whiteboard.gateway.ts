import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WhiteboardService } from './whiteboard.service';
import { BoardRole } from './constants/whiteboard.constant';
import { PrismaService } from '@/database/prisma/prisma.service';

interface ClientData {
    userId: string;
    fullName: string;
    boardId: string;
    role: string;
}

@WebSocketGateway({
    namespace: 'whiteboard',
    cors: { origin: '*' },
})
export class WhiteboardGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer() server!: Server;

    private activeUsers: Map<
        string,
        Map<
            string,
            { userId: string; fullName: string; role: string; socketId: string }
        >
    > = new Map();

    constructor(
        private readonly jwtService: JwtService,
        private readonly whiteboardService: WhiteboardService,
        private readonly prisma: PrismaService, // 👈 Inject PrismaService
    ) {}

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.query.token as string;
            const boardId = client.handshake.query.boardId as string;

            if (!token || !boardId) {
                client.emit('error', { message: 'Missing token or boardId' });
                return client.disconnect();
            }

            // FIX: Use ACCESS_TOKEN_KEY (not JWT_SECRET) to match auth.service.ts
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.ACCESS_TOKEN_KEY,
            });
            const userId = payload.sub;

            // Lấy fullName từ Token payload hoặc query từ Postgres để đảm bảo chính xác
            let fullName = payload.fullName || payload.name;
            if (!fullName) {
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { fullName: true },
                });
                fullName = user?.fullName || 'Anonymous User';
            }

            const permissionResult =
                await this.whiteboardService.validateAccess(boardId, userId);
            if (!permissionResult.canAccess) {
                client.emit('error', {
                    message: permissionResult.reason,
                    isForbidden: true,
                });
                return client.disconnect();
            }

            client.data = { userId, fullName, boardId, role: permissionResult.role } as ClientData;
            await client.join(boardId);

            // Cập nhật Presence Map
            if (!this.activeUsers.has(boardId)) {
                this.activeUsers.set(boardId, new Map());
            }
            this.activeUsers.get(boardId)!.set(client.id, {
                userId,
                fullName,
                role: permissionResult.role ?? BoardRole.VIEWER,
                socketId: client.id,
            });

            const boardData =
                await this.whiteboardService.getBoardData(boardId);

            client.emit('init-board', {
                records: boardData.records,
                role: permissionResult.role,
            });

            this.broadcastActiveUsers(boardId);
        } catch (err) {
            client.emit('error', { message: 'Unauthorized / Invalid Token' });
            console.error('WebSocket connection error:', err);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const { boardId } = client.data || {};
        if (boardId && this.activeUsers.has(boardId)) {
            this.activeUsers.get(boardId)!.delete(client.id);
            if (this.activeUsers.get(boardId)!.size === 0) {
                this.activeUsers.delete(boardId);
            } else {
                this.broadcastActiveUsers(boardId);
            }
        }
    }

    private broadcastActiveUsers(boardId: string) {
        const usersMap = this.activeUsers.get(boardId);
        const usersList = usersMap ? Array.from(usersMap.values()) : [];
        this.server.to(boardId).emit('presence-update', usersList);
    }

    @SubscribeMessage('update-changes')
    async handleUpdateChanges(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { changes: any },
    ) {
        const { boardId, role, userId } = client.data as ClientData;

        if (role === BoardRole.VIEWER) {
            client.emit('error', {
                message: 'ReadOnly permission: You cannot edit this board.',
            });
            return;
        }

        client.to(boardId).emit('changes-updated', {
            userId,
            changes: payload.changes,
        });

        await this.whiteboardService.saveBoardChanges(boardId, payload.changes);
    }

    @SubscribeMessage('cursor-move')
    handleCursorMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { x: number; y: number },
    ) {
        const { boardId, userId, fullName } = client.data as ClientData;
        client.to(boardId).emit('cursor-updated', {
            userId,
            fullName,
            x: payload.x,
            y: payload.y,
        });
    }

    @SubscribeMessage('user-typing')
    handleUserTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { shapeId: string; isTyping: boolean },
    ) {
        const { boardId, userId, fullName } = client.data as ClientData;
        client.to(boardId).emit('typing-update', {
            userId,
            fullName,
            shapeId: payload.shapeId,
            isTyping: payload.isTyping,
        });
    }

    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: Socket) {
        client.emit('pong', { time: Date.now() });
    }

    async notifyMemberRoleUpdated(
        boardId: string,
        targetUserId: string,
        newRole: string,
    ) {
        const roomSockets = await this.server.in(boardId).fetchSockets();
        for (const socket of roomSockets) {
            if ((socket.data as ClientData).userId === targetUserId) {
                socket.data.role = newRole;
                socket.emit('role-changed', { newRole });
            }
        }
        this.broadcastActiveUsers(boardId);
    }

    async kickUser(boardId: string, targetUserId: string, reason: string) {
        const roomSockets = await this.server.in(boardId).fetchSockets();
        for (const socket of roomSockets) {
            if ((socket.data as ClientData).userId === targetUserId) {
                socket.emit('kicked', { reason });
                socket.disconnect();
            }
        }
        this.broadcastActiveUsers(boardId);
    }

    async getBoardStats(boardId: string) {
        const usersMap = this.activeUsers.get(boardId);
        return {
            boardId,
            activeCount: usersMap?.size ?? 0,
            users: usersMap ? Array.from(usersMap.values()) : [],
        };
    }

    getAllActiveBoards() {
        const result: { boardId: string; activeCount: number }[] = [];
        this.activeUsers.forEach((usersMap, boardId) => {
            result.push({ boardId, activeCount: usersMap.size });
        });
        return result;
    }
}