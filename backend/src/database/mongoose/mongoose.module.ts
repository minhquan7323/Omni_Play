import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule as NestMongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        NestMongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
            }),
            inject: [ConfigService],
        }),
    ],
    exports: [NestMongooseModule],
})
export class MongooseModule {}