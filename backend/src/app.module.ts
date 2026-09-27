import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { DatabaseModule } from '@/database/database.module';
import { UserModule } from '@/modules/users/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { FilmModule } from './modules/film/film.module';
import { MusicModule } from './modules/music/music.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TrackerModule } from './modules/tracker/tracker.module';
import { WhiteboardModule } from './modules/whiteboard/whiteboard.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        DatabaseModule,
        UserModule,
        AuthModule,
        WhiteboardModule,
        CloudinaryModule,
        FilmModule,
        MusicModule,
        TrackerModule,
        SettingsModule,
        AdminModule,
        RedisModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
    ],
})
export class AppModule {}
