import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/response.interface';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
    T,
    ApiResponse<T>
> {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        if (request.headers.accept === 'text/event-stream') {
            return next.handle();
        }

        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        const message =
            this.reflector.get<string>(
                RESPONSE_MESSAGE_KEY,
                context.getHandler(),
            ) || 'Execute successfully';

        return next.handle().pipe(
            map((data) => ({
                statusCode,
                message,
                data: data ?? null,
                // timestamp: new Date().toISOString(),
            })),
        );
    }
}
