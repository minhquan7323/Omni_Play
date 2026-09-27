import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAtGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any) {
        return user || null;
    }
}