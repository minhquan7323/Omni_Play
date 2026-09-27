import { Global, Module } from '@nestjs/common';
import { MongooseModule } from './mongoose/mongoose.module';
import { PrismaModule } from './prisma/prisma.module';

@Global()
@Module({
    imports: [PrismaModule, MongooseModule],
    exports: [PrismaModule, MongooseModule],
})
export class DatabaseModule {}
