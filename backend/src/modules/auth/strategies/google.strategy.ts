import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

export interface GoogleUser {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    accessToken: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            callbackURL: `${process.env.APP_URL || 'http://localhost:3001'}/auth/google/callback`,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        _refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, displayName, emails, photos } = profile;

        const user: GoogleUser = {
            googleId: id,
            email: emails[0].value,
            fullName: displayName,
            avatarUrl: photos?.[0]?.value,
            accessToken,
        };

        done(null, user);
    }
}
