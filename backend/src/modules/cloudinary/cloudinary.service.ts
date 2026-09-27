import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
    async uploadFile(
        file: Express.Multer.File,
        options: { folder?: string; publicId?: string } = {},
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: options.folder || 'general',
                    public_id: options.publicId,
                    overwrite: true,
                    resource_type: 'auto',
                },
                (
                    error: UploadApiErrorResponse | undefined,
                    result: UploadApiResponse | undefined,
                ) => {
                    if (error) {
                        return reject(new Error(error.message || 'Cloudinary upload error'));
                    }

                    if (!result) {
                        return reject(new BadRequestException('Upload failed with no result returned'));
                    }

                    resolve(result.secure_url);
                },
            );

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }

    async deleteFile(publicId: string): Promise<any> {
        return await cloudinary.uploader.destroy(publicId);
    }
    extractPublicId(url: string): string | null {
        if (!url) return null;
        try {
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    }

    async deleteFileByUrl(url: string | null | undefined): Promise<void> {
        if (!url) return;
        const publicId = this.extractPublicId(url);
        if (publicId) {
            await cloudinary.uploader.destroy(publicId).catch(() => { /* ignore errors */ });
        }
    }
}