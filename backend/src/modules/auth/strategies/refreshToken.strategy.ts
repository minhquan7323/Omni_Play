import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';

const cookieExtractor = (req: Request) => req?.cookies?.refreshToken || null;

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
    constructor() {
        super({
            jwtFromRequest: cookieExtractor, // Đọc từ cookie thay vì Authorization header
            secretOrKey: process.env.REFRESH_TOKEN_KEY, // Key khớp với key dùng khi ký RT
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: any) {
        const refreshToken = cookieExtractor(req);
        return { ...payload, refreshToken };
    }
}
