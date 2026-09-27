import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export interface LogContext {
    traceId?: string;
    ipAddress?: string;
    userId?: string;
}

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService extends ConsoleLogger {
    private logContext: LogContext = {};
    private fileLogger: winston.Logger;

    constructor() {
        super();

        this.fileLogger = winston.createLogger({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `${timestamp} ${level.toUpperCase().padEnd(5)} ${message}`;
                }),
            ),
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: 'logs/app-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '10m',
                    maxFiles: '10d',
                    zippedArchive: true,
                }),
            ],
        });
    }

    setLogContext(context: LogContext) {
        this.logContext = { ...this.logContext, ...context };
    }

    log(message: any, context?: string) {
        super.log(message, context || this.context);
        this.writeToFile('info', message);
    }

    error(message: any, stack?: string, context?: string) {
        super.error(message, stack, context || this.context);
        this.writeToFile('error', message, stack);
    }

    warn(message: any, context?: string) {
        super.warn(message, context || this.context);
        this.writeToFile('warn', message);
    }

    // Hàm loại bỏ tất cả mã màu ANSI trước khi lưu vào file text
    private stripAnsi(str: string): string {
        return str.replace(/\x1B\[\d+m/g, '');
    }

    private writeToFile(level: string, message: any, stack?: string) {
        let cleanMessage =
            typeof message === 'object' ? JSON.stringify(message) : message;

        // Tách mã màu ANSI ra khỏi chuỗi log trước khi lưu xuống file
        cleanMessage = this.stripAnsi(cleanMessage);

        if (stack) {
            cleanMessage += `\n${this.stripAnsi(stack)}`;
        }

        this.fileLogger.log({ level, message: cleanMessage });
    }
}
