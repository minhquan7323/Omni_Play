import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    constructor() {
        const pool = new Pool({
            connectionString: process.env.PGDB_URL,
        });

        const adapter = new PrismaPg(pool);

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        console.log('Prisma connected to PostgreSQL database');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log('Prisma disconnected from PostgreSQL database');
    }
}
