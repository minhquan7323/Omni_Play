import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CLOUDINARY, CloudinaryProvider } from './cloudinary.provider';

@Global()
@Module({
    imports: [],
    providers: [CloudinaryProvider, CloudinaryService],
    exports: [CloudinaryService, CLOUDINARY],
})
export class CloudinaryModule {}
