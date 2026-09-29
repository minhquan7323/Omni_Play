import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from './common/logger/custom-logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const customLogger = new CustomLoggerService();

    const app = await NestFactory.create(AppModule, {
        logger: customLogger,
    });
    app.use(cookieParser());
    const configService = app.get(ConfigService);
    const port = configService.get('PORT');
    const frontendUrl = configService.get('FRONTEND_URL');

    app.enableCors({
        origin: frontendUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useWebSocketAdapter(new IoAdapter(app));
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );
    app.setGlobalPrefix('api');

    await app.listen(port);
    console.log(`Server is running on port ${port}`);
}
bootstrap();
