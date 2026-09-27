import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { TrackAction, TrackModule } from './constants/tracker.constant';

@Injectable()
export class TrackerService {
    private queue: Array<() => Promise<void>> = [];
    private processing = false;

    constructor(private readonly prisma: PrismaService) {
        this.startQueue();
    }

    track(data: {
        userId?: string;
        action: TrackAction;
        module: TrackModule;
        metadata?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    }) {
        this.queue.push(async () => {
            try {
                await this.prisma.userActionLog.create({
                    data: {
                        userId: data.userId,
                        action: data.action,
                        module: data.module,
                        metadata: data.metadata,
                        ipAddress: data.ipAddress,
                        userAgent: data.userAgent,
                        sessionId: data.sessionId,
                    },
                });
            } catch (err) {
                console.warn('Tracker error (silenced):', err);
            }
        });
    }

    private startQueue() {
        const processQueue = async () => {
            if (!this.processing && this.queue.length > 0) {
                this.processing = true;
                try {
                    const batch = this.queue.splice(0, 20);
                    await Promise.allSettled(batch.map((fn) => fn()));
                } finally {
                    this.processing = false;
                }
            }
            setTimeout(() => void processQueue(), 500);
        };
        setTimeout(() => void processQueue(), 500);
    }

    async getUserActions(userId: string, limit = 100) {
        return this.prisma.userActionLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async getAllActions(filters: {
        userId?: string;
        action?: string;
        module?: string;
        from?: Date;
        to?: Date;
        limit?: number;
        page?: number;
    }) {
        const where: any = {};
        if (filters.userId) where.userId = filters.userId;
        if (filters.action) where.action = filters.action;
        if (filters.module) where.module = filters.module;
        if (filters.from || filters.to) {
            where.createdAt = {};
            if (filters.from) where.createdAt.gte = filters.from;
            if (filters.to) where.createdAt.lte = filters.to;
        }

        const page = filters.page || 1;
        const limit = filters.limit || 50;

        const [data, total] = await Promise.all([
            this.prisma.userActionLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: (page - 1) * limit,
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                },
            }),
            this.prisma.userActionLog.count({ where }),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getStats() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [totalToday, totalWeek, byModule, byAction] = await Promise.all([
            this.prisma.userActionLog.count({
                where: { createdAt: { gte: dayAgo } },
            }),
            this.prisma.userActionLog.count({
                where: { createdAt: { gte: weekAgo } },
            }),
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

        return { totalToday, totalWeek, byModule, byAction };
    }
}
