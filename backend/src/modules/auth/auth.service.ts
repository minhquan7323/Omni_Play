import { PrismaService } from '@/database/prisma/prisma.service';
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './../users/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { compareHashData, hashData } from '@/common/helpers/util';
import { User } from '@prisma/client';
import { GoogleUser } from './strategies/google.strategy';

type UserWithRoles = User & {
    userRoles: {
        role: {
            slug: string;
            name: string;
            scope: string;
            permissions: {
                permission: { slug: string };
            }[];
        };
    }[];
};

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                userRoles: {
                    include: {
                        role: {
                            select: {
                                slug: true,
                                name: true,
                                scope: true,
                                permissions: { select: { permission: { select: { slug: true } } } },
                            },
                        },
                    },
                },
            },
        });

        if (!user || !user.password) {
            throw new BadRequestException('Invalid credentials');
        }

        const isPasswordValid = await compareHashData(
            dto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new BadRequestException('Invalid credentials');
        }

        return this.handleAuthSuccess(user);
    }

    async register(dto: RegisterDto) {
        const userExists = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (userExists) {
            throw new BadRequestException('Email has already been registered');
        }

        const hashedPassword = await hashData(dto.password);
        const newUser = await this.prisma.user.create({
            data: {
                email: dto.email,
                fullName: dto.fullName,
                password: hashedPassword,
            },
            include: {
                userRoles: {
                    include: {
                        role: {
                            select: {
                                slug: true,
                                name: true,
                                scope: true,
                                permissions: { select: { permission: { select: { slug: true } } } },
                            },
                        },
                    },
                },
            },
        });

        return this.handleAuthSuccess(newUser);
    }

    async logout(userId: string, refreshToken: string) {
        const hashedRt = await hashData(refreshToken);
        await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                tokenHash: hashedRt,
                isRevoked: false,
            },
            data: { isRevoked: true },
        });
    }

    async logoutAll(userId: string) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });
    }

    async loginWithGoogle(googleUser: GoogleUser) {
        let user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { googleId: googleUser.googleId },
                    { email: googleUser.email },
                ],
            },
            include: {
                userRoles: {
                    include: {
                        role: {
                            select: {
                                slug: true,
                                name: true,
                                scope: true,
                                permissions: { select: { permission: { select: { slug: true } } } },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: googleUser.email,
                    fullName: googleUser.fullName,
                    password: null,
                    avatarUrl: googleUser.avatarUrl,
                    googleId: googleUser.googleId,
                    provider: 'GOOGLE',
                },
                include: {
                    userRoles: {
                        include: {
                            role: {
                                select: {
                                    slug: true,
                                    name: true,
                                    scope: true,
                                    permissions: { select: { permission: { select: { slug: true } } } },
                                },
                            },
                        },
                    },
                },
            });
        } else if (!user.googleId) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: googleUser.googleId,
                    avatarUrl: googleUser.avatarUrl || user.avatarUrl,
                    provider: 'GOOGLE',
                },
                include: {
                    userRoles: {
                        include: {
                            role: {
                                select: {
                                    slug: true,
                                    name: true,
                                    scope: true,
                                    permissions: { select: { permission: { select: { slug: true } } } },
                                },
                            },
                        },
                    },
                },
            });
        }

        return this.handleAuthSuccess(user);
    }

    async refreshTokens(userId: string, rt: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: {
                        role: {
                            select: {
                                slug: true,
                                name: true,
                                scope: true,
                                permissions: { select: { permission: { select: { slug: true } } } },
                            },
                        },
                    },
                },
            },
        });

        if (!user) throw new ForbiddenException('Access Denied');

        const storedTokens = await this.prisma.refreshToken.findMany({
            where: {
                userId,
                isRevoked: false,
                expiresAt: { gt: new Date() },
            },
        });

        let matchedToken: (typeof storedTokens)[0] | null = null;
        for (const stored of storedTokens) {
            const isMatch = await compareHashData(rt, stored.tokenHash);
            if (isMatch) {
                matchedToken = stored;
                break;
            }
        }

        if (!matchedToken) throw new ForbiddenException('Access Denied');

        await this.prisma.refreshToken.update({
            where: { id: matchedToken.id },
            data: { isRevoked: true },
        });

        const roles = user.userRoles.map((ur) => ur.role.slug);
        const permissions = [...new Set(
            user.userRoles.flatMap((ur) =>
                ur.role.permissions.map((rp) => rp.permission.slug)
            )
        )];
        const tokens = await this.getTokens(
            user.id,
            user.email,
            user.fullName,
            roles,
            permissions,
        );
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return { ...tokens, roles, permissions };
    }

    private async handleAuthSuccess(user: UserWithRoles) {
        const roles = user.userRoles.map((ur) => ur.role.slug);
        // Deduplicate permissions across all roles
        const permissions = [...new Set(
            user.userRoles.flatMap((ur) =>
                ur.role.permissions.map((rp) => rp.permission.slug)
            )
        )];
        const tokens = await this.getTokens(
            user.id,
            user.email,
            user.fullName,
            roles,
            permissions,
        );
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                roles,
                permissions,
                avatarUrl: user.avatarUrl ?? null,
                provider: user.provider ?? 'LOCAL',
            },
            ...tokens,
        };
    }

    private async saveRefreshToken(userId: string, refreshToken: string) {
        const hashedRefreshToken = await hashData(refreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: hashedRefreshToken,
                expiresAt,
            },
        });
    }

    private async getTokens(
        userId: string,
        email: string,
        fullName: string,
        roles: string[],
        permissions: string[] = [],
    ) {
        const payload = { sub: userId, email, fullName, roles, permissions };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.ACCESS_TOKEN_KEY,
                expiresIn: '15m',
            }),
            this.jwtService.signAsync(
                { sub: userId, email, fullName, roles },
                {
                    secret: process.env.REFRESH_TOKEN_KEY,
                    expiresIn: '7d',
                },
            ),
        ]);

        return { accessToken, refreshToken };
    }
}
