import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import axios, { AxiosInstance } from 'axios';
import { SaveHistoryDto } from './dto/film.dto';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { RedisService } from '@/modules/redis/redis.service';

const KKPHIM_BASE = 'https://phimapi.com';
const TTL = 5 * 60;

@Injectable()
export class FilmService {
    private readonly logger = new Logger(FilmService.name);
    private readonly http: AxiosInstance;

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
    ) {
        this.http = axios.create({
            baseURL: KKPHIM_BASE,
            timeout: 10000,
        });
    }

    async getNewMovies(page = 1) {
        const key = `new-movies:${page}`;

        return await this.redisService.getOrSet(key, TTL, async () => {
            try {
                const { data } = await this.http.get(
                    '/danh-sach/phim-moi-cap-nhat',
                    { params: { page } },
                );
                return data;
            } catch (err) {
                this.logger.error('KKPhim API error:', err);
                throw new HttpException(
                    'Không thể kết nối API phim',
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }
        });
    }

    async getMovieList(params: {
        type?: string;
        category?: string;
        country?: string;
        year?: string;
        page?: number;
    }) {
        const sortedQuery = new URLSearchParams(
            Object.entries(params)
                .filter(([_, v]) => v !== undefined && v !== null)
                .sort(([a], [b]) => a.localeCompare(b)) as [string, string][],
        ).toString();

        const key = `list:${sortedQuery}`;

        const { type: _type, ...rest } = params;

        return await this.redisService.getOrSet(key, TTL, async () => {
            try {
                const { data } = await this.http.get(
                    `/v1/api/danh-sach/${params.type}`,
                    { params: { ...rest } },
                );
                return data;
            } catch (err) {
                this.logger.error('KKPhim list error:', err);
                throw new HttpException(
                    'Lỗi lấy danh sách phim',
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }
        });
    }

    async getMovieDetail(slug: string) {
        const key = `detail:${slug}`;

        return await this.redisService.getOrSet(key, TTL, async () => {
            try {
                const { data } = await this.http.get(`/phim/${slug}`);
                return data;
            } catch (err) {
                this.logger.error(`KKPhim detail error for ${slug}:`, err);
                throw new HttpException(
                    'Không tìm thấy phim',
                    HttpStatus.NOT_FOUND,
                );
            }
        });
    }

    async searchMovies(dto: PaginationQueryDto) {
        const params = {
            keyword: '',
            limit: 10,
            page: 1,
            ...dto,
        };

        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(
                ([_, v]) => v !== undefined && v !== null && v !== '',
            ),
        );

        const cacheQueryKey = Object.keys(cleanParams)
            .sort()
            .map((k) => `${k}=${cleanParams[k]}`)
            .join('&');
        const key = `search:${cacheQueryKey}`;

        return await this.redisService.getOrSet(key, TTL, async () => {
            try {
                const { data } = await this.http.get('/v1/api/tim-kiem', {
                    params: cleanParams,
                });
                return data;
            } catch (err) {
                this.logger.error('KKPhim search error:', err);
                throw new HttpException(
                    'Lỗi tìm kiếm phim',
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }
        });
    }

    async getCategories() {
        const key = 'categories';

        return await this.redisService.getOrSet(key, TTL, async () => {
            try {
                const { data } = await this.http.get('/the-loai');
                return data;
            } catch (err) {
                this.logger.error('KKPhim categories error:', err);
                throw new HttpException(
                    'Lỗi lấy thể loại',
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }
        });
    }

    async getCountries() {
        const key = 'countries';

        return await this.redisService.getOrSet(key, TTL, async () => {
            try {
                const { data } = await this.http.get('/quoc-gia');
                return data;
            } catch (err) {
                this.logger.error('KKPhim countries error:', err);
                throw new HttpException(
                    'Lỗi lấy quốc gia',
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }
        });
    }

    async getMoviesByCategory(slug: string, page = 1) {
        const key = `category:${slug}:${page}`;

        return await this.redisService.getOrSet(key, TTL, async () => {
            try {
                const { data } = await this.http.get(
                    `/v1/api/the-loai/${slug}`,
                    { params: { page } },
                );
                return data;
            } catch (err) {
                this.logger.error(`KKPhim category error for ${slug}:`, err);
                throw new HttpException(
                    'Lỗi lấy phim theo thể loại',
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }
        });
    }

    async getMoviesByCountry(slug: string, page = 1) {
        const key = `country:${slug}:${page}`;

        return await this.redisService.getOrSet(key, TTL, async () => {
            try {
                const { data } = await this.http.get(
                    `/v1/api/quoc-gia/${slug}`,
                    { params: { page } },
                );
                return data;
            } catch (err) {
                this.logger.error(`KKPhim country error for ${slug}:`, err);
                throw new HttpException(
                    'Lỗi lấy phim theo quốc gia',
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }
        });
    }

    // ─── User Watch History ──────────────────────────────────────────────────
    async saveWatchHistory(userId: string, dto: SaveHistoryDto) {
        return this.prisma.filmWatchHistory.upsert({
            where: {
                userId_externalFilmId: {
                    userId,
                    externalFilmId: dto.externalFilmId,
                },
            },
            update: {
                filmSlug: dto.filmSlug,
                filmTitle: dto.filmTitle,
                posterUrl: dto.posterUrl,
                thumbUrl: dto.thumbUrl,
                episodeSlug: dto.episodeSlug || '',
                episodeTitle: dto.episodeTitle || '',
                playbackPosition: dto.playbackPosition ?? 0,
                duration: dto.duration ?? 0,
                isCompleted: dto.isCompleted ?? false,
            },
            create: {
                userId,
                externalFilmId: dto.externalFilmId,
                filmSlug: dto.filmSlug,
                filmTitle: dto.filmTitle,
                posterUrl: dto.posterUrl,
                thumbUrl: dto.thumbUrl,
                episodeSlug: dto.episodeSlug || '',
                episodeTitle: dto.episodeTitle || '',
                playbackPosition: dto.playbackPosition ?? 0,
                duration: dto.duration ?? 0,
                isCompleted: dto.isCompleted ?? false,
            },
        });
    }

    async getWatchHistory(userId: string) {
        return this.prisma.filmWatchHistory.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: 30,
        });
    }

    async removeHistory(userId: string, externalFilmId: string) {
        return this.prisma.filmWatchHistory.deleteMany({
            where: { userId, externalFilmId },
        });
    }

    async checkWatchHistory(userId: string, externalFilmId: string) {
        const history = await this.prisma.filmWatchHistory.findUnique({
            where: { userId_externalFilmId: { userId, externalFilmId } },
        });
        return history;
    }

    async toggleFavorite(
        userId: string,
        dto: {
            externalFilmId: string;
            filmTitle: string;
            posterUrl?: string;
            releaseYear?: number;
            filmSlug: string;
        },
    ) {
        const existing = await this.prisma.filmFavorite.findUnique({
            where: {
                userId_externalFilmId: {
                    userId,
                    externalFilmId: dto.externalFilmId,
                },
            },
        });

        if (existing) {
            await this.prisma.filmFavorite.delete({
                where: { id: existing.id },
            });
            return { favorited: false };
        }

        await this.prisma.filmFavorite.create({
            data: { userId, ...dto },
        });
        return { favorited: true };
    }

    async removeFavorite(userId: string, externalFilmId: string) {
        return this.prisma.filmFavorite.deleteMany({
            where: { userId, externalFilmId },
        });
    }

    async getFavorites(userId: string) {
        return this.prisma.filmFavorite.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async checkFavorite(userId: string, externalFilmId: string) {
        const fav = await this.prisma.filmFavorite.findUnique({
            where: { userId_externalFilmId: { userId, externalFilmId } },
        });
        return { favorited: !!fav };
    }
}
