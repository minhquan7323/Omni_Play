import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);

    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) { }

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            this.logger.error(`Redis GET error for key: ${key}`, err);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds: number): Promise<void> {
        try {
            await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (err) {
            this.logger.error(`Redis SET error for key: ${key}`, err);
        }
    }

    async getOrSet<T>(
        key: string,
        ttlSeconds: number,
        fn: () => Promise<T>,
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const result = await fn();

        if (result !== undefined && result !== null) {
            await this.set(key, result, ttlSeconds);
        }

        return result;
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (err) {
            this.logger.error(`Redis DEL error for key: ${key}`, err);
        }
    }

    async delByPattern(pattern: string): Promise<void> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (err) {
            this.logger.error(`Redis DEL pattern error for pattern: ${pattern}`, err);
        }
    }
}
