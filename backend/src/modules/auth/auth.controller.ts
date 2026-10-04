import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { GetJwtUser } from '@/common/decorators/get-user.decorator';
import { AtGuard, RtGuard, GoogleAuthGuard } from './guards';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
};

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @ResponseMessage('Logged in successfully')
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.authService.login(loginDto);
        response.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

        return {
            user: result.user,
            accessToken: result.accessToken,
        };
    }

    @Post('register')
    @ResponseMessage('Registered successfully')
    async register(
        @Body() registerDto: RegisterDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const result = await this.authService.register(registerDto);
        response.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

        return {
            user: result.user,
            accessToken: result.accessToken,
        };
    }

    @Post('logout')
    @UseGuards(AtGuard)
    @ResponseMessage('Logged out successfully')
    async logout(
        @Req() req: any,
        @GetJwtUser('sub') userId: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        console.log(req);
        const refreshToken = req.cookies['refreshToken'];
        if (refreshToken) {
            await this.authService.logout(userId, refreshToken);
        }
        response.clearCookie('refreshToken', COOKIE_OPTIONS);
        return;
    }

    @Post('refresh')
    @UseGuards(RtGuard)
    @ResponseMessage('Token refreshed successfully')
    async refreshTokens(
        @Req() req: any,
        @GetJwtUser('sub') userId: string,
        @Res({ passthrough: true }) response: Response,
    ) {
        const refreshToken = req.cookies['refreshToken'];
        const result = await this.authService.refreshTokens(
            userId,
            refreshToken,
        );

        response.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

        return {
            accessToken: result.accessToken,
        };
    }

    // ─── Google OAuth ────────────────────────────────────────────────────────
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
        // Guard redirects to Google automatically
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleCallback(@Req() req: Request, @Res() res: Response) {
        const googleUser = (req as any).user;
        const result = await this.authService.loginWithGoogle(googleUser);

        res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

        // Redirect to FE with access token (FE reads from URL hash and stores)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendUrl}/auth/callback?token=${result.accessToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
        return res.redirect(redirectUrl);
    }
}
