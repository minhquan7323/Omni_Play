import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from '@/modules/redis/redis.service';
import { PERMISSIONS, ROLE_PERMISSION_MATRIX, ROLES, RoleSlug } from '@/common/constants/roles.constants';

const CACHE_TTL = {
    STATS: 5 * 60,          // 5 min
    LIST: 2 * 60,           // 2 min
    ROLES: 10 * 60,         // 10 min
    MUSIC_STATS: 5 * 60,    // 5 min
} as const;

@Injectable()
export class AdminService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectModel('Board') private readonly boardModel: Model<any>,
        private readonly redisService: RedisService,
    ) { }

    // ─── Dashboard Overview ──────────────────────────────────────────────────────
    async getDashboardStats() {
        return this.redisService.getOrSet('admin:stats', CACHE_TTL.STATS, async () => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            activeUsers,
            bannedUsers,
            suspendedUsers,
            newUsersThisWeek,
            totalRoles,
            totalTracks,
            totalAlbums,
            totalArtists,
            totalFilmWatches,
            totalFilmFavorites,
            actionsToday,
            actionsThisWeek,
            totalBoards,
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            this.prisma.user.count({ where: { status: 'BANNED' } }),
            this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
            this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
            this.prisma.role.count(),
            this.prisma.track.count(),
            this.prisma.album.count(),
            this.prisma.artist.count(),
            this.prisma.filmWatchHistory.count(),
            this.prisma.filmFavorite.count(),
            this.prisma.userActionLog.count({ where: { createdAt: { gte: dayAgo } } }),
            this.prisma.userActionLog.count({ where: { createdAt: { gte: weekAgo } } }),
            this.boardModel.countDocuments(),
        ]);

        // User growth last 7 days
        const userGrowth = await this.getUserGrowthLast7Days();
        // Activity by module (last 7 days)
        const activityByModule = await this.prisma.userActionLog.groupBy({
            by: ['module'],
            _count: true,
            where: { createdAt: { gte: weekAgo } },
        });

        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                banned: bannedUsers,
                suspended: suspendedUsers,
                newThisWeek: newUsersThisWeek,
            },
            roles: { total: totalRoles },
            music: {
                tracks: totalTracks,
                albums: totalAlbums,
                artists: totalArtists,
            },
            film: {
                totalWatches: totalFilmWatches,
                totalFavorites: totalFilmFavorites,
            },
            activity: {
                today: actionsToday,
                thisWeek: actionsThisWeek,
            },
            whiteboards: {
                total: totalBoards,
            },
            userGrowth,
            activityByModule: activityByModule.map((item) => ({
                module: item.module,
                count: item._count,
            })),
        };
        });
    }

    private async getUserGrowthLast7Days() {
        const results: { date: string; users: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const start = new Date();
            start.setDate(start.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);

            const count = await this.prisma.user.count({
                where: { createdAt: { gte: start, lte: end } },
            });
            results.push({
                date: start.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
                users: count,
            });
        }
        return results;
    }

    // ─── Users ──────────────────────────────────────────────────────────────────
    async getUsers(filters: { search?: string; status?: string; page?: number; limit?: number }) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const cacheKey = `admin:users:${page}:${limit}:${filters.search ?? ''}:${filters.status ?? ''}`;

        return this.redisService.getOrSet(cacheKey, CACHE_TTL.LIST, async () => {
            const where: any = {};
            if (filters.search) {
                where.OR = [
                    { fullName: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            if (filters.status) where.status = filters.status;

            const [data, total] = await Promise.all([
                this.prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        avatarUrl: true,
                        status: true,
                        provider: true,
                        createdAt: true,
                        userRoles: {
                            include: { role: { select: { name: true, slug: true } } },
                        },
                        _count: {
                            select: {
                                filmWatchHistory: true,
                                filmFavorites: true,
                                uploadedTracks: true,
                            },
                        },
                    },
                    take: limit,
                    skip: (page - 1) * limit,
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.user.count({ where }),
            ]);

            return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
        });
    }

    async getUserById(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                status: true,
                provider: true,
                createdAt: true,
                updatedAt: true,
                userRoles: {
                    include: {
                        role: { select: { id: true, name: true, slug: true, scope: true } },
                    },
                },
                _count: {
                    select: {
                        filmWatchHistory: true,
                        filmFavorites: true,
                        uploadedTracks: true,
                        actionLogs: true,
                    },
                },
            },
        });
    }

    async updateUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED') {
        const result = await this.prisma.user.update({ where: { id: userId }, data: { status } });
        await this.redisService.delByPattern('admin:users:*');
        await this.redisService.del('admin:stats');
        return result;
    }

    async assignRole(userId: string, roleId: string, scope = 'GLOBAL') {
        const result = await this.prisma.userRoleAssignment.upsert({
            where: { userId_roleId_scope: { userId, roleId, scope: scope as any } },
            update: {},
            create: { userId, roleId, scope: scope as any },
        });
        await this.redisService.delByPattern('admin:users:*');
        return result;
    }

    async removeRole(userId: string, roleId: string, scope = 'GLOBAL') {
        const result = await this.prisma.userRoleAssignment.delete({
            where: { userId_roleId_scope: { userId, roleId, scope: scope as any } },
        });
        await this.redisService.delByPattern('admin:users:*');
        return result;
    }

    // ─── Role & Permission Management ───────────────────────────────────────────
    async getRoles() {
        return this.redisService.getOrSet('admin:roles', CACHE_TTL.ROLES, () =>
            this.prisma.role.findMany({
                include: {
                    permissions: { include: { permission: true } },
                    _count: { select: { users: true } },
                },
                orderBy: { isSystem: 'desc' },
            })
        );
    }

    async createRole(dto: {
        slug: string;
        name: string;
        description?: string;
        scope?: string;
    }) {
        const result = await this.prisma.role.create({
            data: {
                slug: dto.slug,
                name: dto.name,
                description: dto.description,
                scope: (dto.scope as any) ?? 'GLOBAL',
            },
        });
        await this.redisService.del('admin:roles');
        return result;
    }

    async updateRole(roleId: string, dto: { name?: string; description?: string }) {
        const result = await this.prisma.role.update({
            where: { id: roleId },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
            },
        });
    }

    async deleteRole(roleId: string) {
        return this.prisma.role.delete({ where: { id: roleId } });
    }

    async getPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ scope: 'asc' }, { slug: 'asc' }],
        });
    }

    async createPermission(dto: {
        slug: string;
        name: string;
        scope: string;
        description?: string;
    }) {
        return this.prisma.permission.create({
            data: {
                slug: dto.slug,
                name: dto.name,
                scope: dto.scope as any,
                description: dto.description,
            },
        });
    }

    async assignPermissionToRole(roleId: string, permissionId: string) {
        const result = await this.prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId, permissionId } },
            update: {},
            create: { roleId, permissionId },
        });
        await this.redisService.del('admin:roles');
        return result;
    }

    async removePermissionFromRole(roleId: string, permissionId: string) {
        const result = await this.prisma.rolePermission.delete({
            where: { roleId_permissionId: { roleId, permissionId } },
        });
        await this.redisService.del('admin:roles');
        return result;
    }

    // ─── Music Admin ─────────────────────────────────────────────────────────────
    async getMusicStats() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [totalTracks, totalAlbums, totalArtists, newTracksThisWeek] =
            await Promise.all([
                this.prisma.track.count(),
                this.prisma.album.count(),
                this.prisma.artist.count(),
                this.prisma.track.count({ where: { createdAt: { gte: weekAgo } } }),
            ]);

        return { totalTracks, totalAlbums, totalArtists, newTracksThisWeek };
    }

    async getTracks(filters: { search?: string; page?: number; limit?: number }) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const where: any = {};

        if (filters.search) {
            where.title = { contains: filters.search, mode: 'insensitive' };
        }

        const [data, total] = await Promise.all([
            this.prisma.track.findMany({
                where,
                include: {
                    album: { select: { name: true, image: true } },
                    artists: { select: { id: true, name: true } },
                    uploader: { select: { fullName: true, email: true } },
                },
                take: limit,
                skip: (page - 1) * limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.track.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async updateTrack(trackId: string, dto: { title?: string; duration?: number; genre?: string; thumbnailUrl?: string }) {
        return this.prisma.track.update({
            where: { id: trackId },
            data: {
                ...(dto.title && { title: dto.title }),
                ...(dto.duration && { duration: dto.duration }),
                ...(dto.genre && { genre: dto.genre }),
                ...(dto.thumbnailUrl && { thumbnailUrl: dto.thumbnailUrl }),
            },
            include: {
                album: { select: { name: true, image: true } },
                artists: { select: { id: true, name: true } },
            },
        });
    }

    async deleteTrack(trackId: string) {
        return this.prisma.track.delete({ where: { id: trackId } });
    }

    async getAlbums(filters: { search?: string; page?: number; limit?: number }) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const where: any = {};

        if (filters.search) {
            where.name = { contains: filters.search, mode: 'insensitive' };
        }

        const [data, total] = await Promise.all([
            this.prisma.album.findMany({
                where,
                include: {
                    artists: { select: { id: true, name: true } },
                    uploader: { select: { fullName: true } },
                    _count: { select: { tracks: true } },
                },
                take: limit,
                skip: (page - 1) * limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.album.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async updateAlbum(albumId: string, dto: { name?: string; description?: string; image?: string; releaseYear?: number }) {
        return this.prisma.album.update({
            where: { id: albumId },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.image && { image: dto.image }),
                ...(dto.releaseYear && { releaseYear: dto.releaseYear }),
            },
        });
    }

    async deleteAlbum(albumId: string) {
        return this.prisma.album.delete({ where: { id: albumId } });
    }

    async getArtists(filters: { search?: string; page?: number; limit?: number }) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const where: any = {};

        if (filters.search) {
            where.name = { contains: filters.search, mode: 'insensitive' };
        }

        const [data, total] = await Promise.all([
            this.prisma.artist.findMany({
                where,
                include: {
                    _count: { select: { tracks: true, albums: true } },
                },
                take: limit,
                skip: (page - 1) * limit,
            }),
            this.prisma.artist.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async updateArtist(artistId: string, dto: { name?: string; bio?: string; image?: string }) {
        return this.prisma.artist.update({
            where: { id: artistId },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.bio !== undefined && { bio: dto.bio }),
                ...(dto.image && { image: dto.image }),
            },
        });
    }

    async deleteArtist(artistId: string) {
        return this.prisma.artist.delete({ where: { id: artistId } });
    }

    // ─── Film Admin ──────────────────────────────────────────────────────────────
    async getFilmStats() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [totalWatches, totalFavorites, completedWatches] = await Promise.all([
            this.prisma.filmWatchHistory.count(),
            this.prisma.filmFavorite.count(),
            this.prisma.filmWatchHistory.count({ where: { isCompleted: true } }),
        ]);

        // Top 10 most watched films
        const topFilms = await this.prisma.filmWatchHistory.groupBy({
            by: ['externalFilmId', 'filmTitle', 'posterUrl'],
            _count: true,
            orderBy: { _count: { externalFilmId: 'desc' } },
            take: 10,
        });

        // Watch activity last 7 days
        const watchActivity: { date: string; watches: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const start = new Date();
            start.setDate(start.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);

            const count = await this.prisma.filmWatchHistory.count({
                where: { updatedAt: { gte: start, lte: end } },
            });
            watchActivity.push({
                date: start.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
                watches: count,
            });
        }

        return {
            totalWatches,
            totalFavorites,
            completedWatches,
            completionRate:
                totalWatches > 0
                    ? Math.round((completedWatches / totalWatches) * 100)
                    : 0,
            topFilms: topFilms.map((f) => ({
                externalFilmId: f.externalFilmId,
                filmTitle: f.filmTitle,
                posterUrl: f.posterUrl,
                watchCount: f._count,
            })),
            watchActivity,
        };
    }

    async getWatchHistories(filters: {
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const where: any = {};

        if (filters.search) {
            where.filmTitle = { contains: filters.search, mode: 'insensitive' };
        }

        const [data, total] = await Promise.all([
            this.prisma.filmWatchHistory.findMany({
                where,
                include: {
                    user: { select: { fullName: true, email: true, avatarUrl: true } },
                },
                take: limit,
                skip: (page - 1) * limit,
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.filmWatchHistory.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // ─── Tracking Admin ──────────────────────────────────────────────────────────
    async getTrackingLogs(filters: {
        userId?: string;
        action?: string;
        module?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const where: any = {};

        if (filters.userId) where.userId = filters.userId;
        if (filters.action) where.action = filters.action;
        if (filters.module) where.module = filters.module;

        const [data, total] = await Promise.all([
            this.prisma.userActionLog.findMany({
                where,
                include: {
                    user: { select: { fullName: true, email: true, avatarUrl: true } },
                },
                take: limit,
                skip: (page - 1) * limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.userActionLog.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async getTrackingStats() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [totalToday, totalWeek, byModule, byAction] = await Promise.all([
            this.prisma.userActionLog.count({ where: { createdAt: { gte: dayAgo } } }),
            this.prisma.userActionLog.count({ where: { createdAt: { gte: weekAgo } } }),
            this.prisma.userActionLog.groupBy({
                by: ['module'],
                _count: true,
                where: { createdAt: { gte: weekAgo } },
            }),
            this.prisma.userActionLog.groupBy({
                by: ['action'],
                _count: true,
                orderBy: { _count: { action: 'desc' } },
                take: 10,
                where: { createdAt: { gte: weekAgo } },
            }),
        ]);

        return {
            totalToday,
            totalWeek,
            byModule: byModule.map((m) => ({ module: m.module, count: m._count })),
            byAction: byAction.map((a) => ({ action: a.action, count: a._count })),
        };
    }

    // ─── Whiteboard Admin ────────────────────────────────────────────────────────
    async getWhiteboards(filters: { search?: string; page?: number; limit?: number }) {
        const page = filters.page || 1;
        const limit = filters.limit || 20;

        const searchQuery = filters.search
            ? { name: { $regex: filters.search, $options: 'i' } }
            : {};

        const [boards, total] = await Promise.all([
            this.boardModel
                .find(searchQuery)
                .select('-password')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .lean()
                .exec(),
            this.boardModel.countDocuments(searchQuery),
        ]);

        // Enrich with user info
        const ownerIds = [...new Set((boards as any[]).map((b) => b.ownerId))];
        const owners = await this.prisma.user.findMany({
            where: { id: { in: ownerIds } },
            select: { id: true, fullName: true, email: true, avatarUrl: true },
        });
        const ownerMap = new Map(owners.map((o) => [o.id, o]));

        const enriched = (boards as any[]).map((b) => ({
            ...b,
            owner: ownerMap.get(b.ownerId) ?? null,
        }));

        return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async updateWhiteboard(boardId: string, dto: { name?: string; isPrivate?: boolean }) {
        return this.boardModel.findOneAndUpdate(
            { boardId },
            { $set: { ...dto } },
            { new: true },
        ).exec();
    }

    async deleteWhiteboard(boardId: string) {
        return this.boardModel.findOneAndDelete({ boardId }).exec();
    }

    // ─── Seed ────────────────────────────────────────────────────────────────────
    async seedDefaultRolesAndPermissions() {
        // ── 1. Upsert all permissions ──────────────────────────────────────────
        const permissionDefs: { slug: string; name: string; scope: string }[] = [
            { slug: PERMISSIONS.ADMIN_DASHBOARD, name: 'Xem Dashboard', scope: 'GLOBAL' },
            { slug: PERMISSIONS.ADMIN_STATS, name: 'Xem thống kê', scope: 'GLOBAL' },
            { slug: PERMISSIONS.ADMIN_USERS_VIEW, name: 'Xem danh sách users', scope: 'GLOBAL' },
            { slug: PERMISSIONS.ADMIN_USERS_MANAGE, name: 'Quản lý users', scope: 'GLOBAL' },
            { slug: PERMISSIONS.ADMIN_ROLES_VIEW, name: 'Xem roles', scope: 'GLOBAL' },
            { slug: PERMISSIONS.ADMIN_ROLES_MANAGE, name: 'Quản lý roles', scope: 'GLOBAL' },
            { slug: PERMISSIONS.ADMIN_TRACKING_VIEW, name: 'Xem tracking logs', scope: 'GLOBAL' },
            { slug: PERMISSIONS.MUSIC_VIEW, name: 'Xem nhạc (admin)', scope: 'MUSIC' },
            { slug: PERMISSIONS.MUSIC_TRACK_CREATE, name: 'Tạo track', scope: 'MUSIC' },
            { slug: PERMISSIONS.MUSIC_TRACK_UPDATE, name: 'Sửa track', scope: 'MUSIC' },
            { slug: PERMISSIONS.MUSIC_TRACK_DELETE, name: 'Xóa track', scope: 'MUSIC' },
            { slug: PERMISSIONS.MUSIC_ALBUM_CREATE, name: 'Tạo album', scope: 'MUSIC' },
            { slug: PERMISSIONS.MUSIC_ALBUM_UPDATE, name: 'Sửa album', scope: 'MUSIC' },
            { slug: PERMISSIONS.MUSIC_ALBUM_DELETE, name: 'Xóa album', scope: 'MUSIC' },
            { slug: PERMISSIONS.MUSIC_ARTIST_CREATE, name: 'Tạo nghệ sĩ', scope: 'MUSIC' },
            { slug: PERMISSIONS.MUSIC_ARTIST_UPDATE, name: 'Sửa nghệ sĩ', scope: 'MUSIC' },
            { slug: PERMISSIONS.MUSIC_ARTIST_DELETE, name: 'Xóa nghệ sĩ', scope: 'MUSIC' },
            { slug: PERMISSIONS.MUSIC_PLAYLIST_SYSTEM, name: 'Tạo playlist hệ thống', scope: 'MUSIC' },
            { slug: PERMISSIONS.FILM_VIEW, name: 'Xem phim (admin)', scope: 'FILM' },
            { slug: PERMISSIONS.FILM_MANAGE, name: 'Quản lý phim', scope: 'FILM' },
            { slug: PERMISSIONS.WHITEBOARD_VIEW, name: 'Xem whiteboard (admin)', scope: 'WHITEBOARD' },
            { slug: PERMISSIONS.WHITEBOARD_MANAGE, name: 'Quản lý whiteboard', scope: 'WHITEBOARD' },
        ];

        for (const perm of permissionDefs) {
            await this.prisma.permission.upsert({
                where: { slug: perm.slug },
                update: { name: perm.name },
                create: perm as any,
            });
        }

        // ── 2. Upsert all roles ────────────────────────────────────────────────
        const roleDefs: { slug: RoleSlug; name: string; scope: string; isSystem?: boolean; description?: string }[] = [
            { slug: ROLES.SUPERADMIN, name: 'Super Admin', scope: 'GLOBAL', isSystem: true, description: 'Toàn quyền hệ thống' },
            { slug: ROLES.ADMIN, name: 'Admin', scope: 'GLOBAL', isSystem: true, description: 'Quản trị viên' },
            { slug: ROLES.MUSIC_MANAGER, name: 'Music Manager', scope: 'MUSIC', description: 'Quản lý nội dung âm nhạc' },
            { slug: ROLES.MUSIC_ARTIST, name: 'Music Artist', scope: 'MUSIC', description: 'Nghệ sĩ âm nhạc' },
            { slug: ROLES.FILM_MANAGER, name: 'Film Manager', scope: 'FILM', description: 'Quản lý nội dung phim' },
            { slug: ROLES.FILM_MODERATOR, name: 'Film Moderator', scope: 'FILM', description: 'Kiểm duyệt phim' },
            { slug: ROLES.WHITEBOARD_MANAGER, name: 'Whiteboard Manager', scope: 'WHITEBOARD', description: 'Quản lý bảng trắng' },
            { slug: ROLES.USER, name: 'User', scope: 'GLOBAL', isSystem: true, description: 'Người dùng thông thường' },
        ];

        for (const role of roleDefs) {
            await this.prisma.role.upsert({
                where: { slug: role.slug },
                update: { name: role.name, description: role.description },
                create: role as any,
            });
        }

        // ── 3. Assign permissions to roles using ROLE_PERMISSION_MATRIX ────────
        // Load all permissions and roles from DB for ID lookup
        const [dbPerms, dbRoles] = await Promise.all([
            this.prisma.permission.findMany({ select: { id: true, slug: true } }),
            this.prisma.role.findMany({ select: { id: true, slug: true } }),
        ]);

        const permMap = new Map(dbPerms.map((p) => [p.slug, p.id]));
        const roleMap = new Map(dbRoles.map((r) => [r.slug, r.id]));

        for (const [roleSlug, permissions] of Object.entries(ROLE_PERMISSION_MATRIX)) {
            const roleId = roleMap.get(roleSlug);
            if (!roleId) continue;

            for (const permSlug of permissions) {
                const permId = permMap.get(permSlug);
                if (!permId) continue;
                await this.prisma.rolePermission.upsert({
                    where: { roleId_permissionId: { roleId, permissionId: permId } },
                    update: {},
                    create: { roleId, permissionId: permId },
                });
            }
        }

        // Clear all admin cache after seed
        await this.redisService.delByPattern('admin:*');

        return {
            message: 'Seed hoàn tất',
            permissions: permissionDefs.length,
            roles: roleDefs.length,
        };
    }
}
