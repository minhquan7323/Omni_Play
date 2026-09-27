import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const clr = {
    reset: '\x1b[0m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    gray: '\x1b[90m',
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();

        const { method, originalUrl, socket } = req;
        const startTime = Date.now();

        const traceId =
            (req.headers['x-request-id'] as string) || uuidv4().substring(0, 8);
        const ipAddress =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
            socket.remoteAddress ||
            '127.0.0.1';

        res.setHeader('X-Trace-Id', traceId);

        return next.handle().pipe(
            tap(() => {
                const user = req['user'] as any;
                const userId = user?.id || 'ANONYMOUS';
                const statusCode = res.statusCode;
                const duration = Date.now() - startTime;

                const statusColor = statusCode >= 400 ? clr.red : clr.green;

                const coloredMessage =
                    `${clr.yellow}[Trace: ${traceId}]${clr.reset} ` +
                    `${clr.cyan}[IP: ${ipAddress}]${clr.reset} ` +
                    `${clr.magenta}[User: ${userId}]${clr.reset} - ` +
                    `${clr.blue}${method}${clr.reset} ${originalUrl} ` +
                    `${statusColor}${statusCode}${clr.reset} ` +
                    `${clr.gray}+${duration}ms${clr.reset}`;

                const plainMessage = `[Trace: ${traceId}] [IP: ${ipAddress}] [User: ${userId}] - ${method} ${originalUrl} ${statusCode} +${duration}ms`;

                this.logger.log(coloredMessage);

                req['plainLogMessage'] = plainMessage;
            }),
        );
    }
}
