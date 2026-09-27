import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type JwtPayload = {
    sub: string;
    email: string;
    fullName: string; // Token thực tế chứa fullName, không phải username
    roles: string[]; // Mảng slug của các role (VD: ["film_reviewer", "music_artist"])
};

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.ACCESS_TOKEN_KEY, // Key khớp với key dùng khi ký AT
        });
    }

    validate(payload: JwtPayload) {
        return payload;
    }
}
