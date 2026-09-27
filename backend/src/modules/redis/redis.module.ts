import { Global, Module } from '@nestjs/common';
import { REDIS_CLIENT, RedisProvider } from './redis.provider';
import { RedisService } from './redis.service';

@Global()
@Module({
    imports: [],
    providers: [RedisProvider, RedisService],
    exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
