import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private readonly prisma: PrismaService) {}

    async getUserSettings(userId: string) {
        let settings = await this.prisma.userSettings.findUnique({
            where: { userId },
        });

        if (!settings) {
            settings = await this.prisma.userSettings.create({
                data: {
                    userId,
                    theme: 'dark',
                    language: 'vi',
                    fontFamily: 'inter',
                    accentColor: '#6366f1',
                    fontSize: 'md',
                    sidebarCompact: false,
                },
            });
        }

        return settings;
    }

    async updateUserSettings(
        userId: string,
        dto: {
            theme?: string;
            language?: string;
            fontFamily?: string;
            accentColor?: string;
            fontSize?: string;
            sidebarCompact?: boolean;
        },
    ) {
        return this.prisma.userSettings.upsert({
            where: { userId },
            update: dto,
            create: { userId, ...dto },
        });
    }
}
