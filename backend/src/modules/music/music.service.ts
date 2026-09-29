import { PaginationUtil } from '@/common/helpers/pagination.util';
import { connectIds } from '@/common/helpers/prisma.util';
import { PrismaService } from '@/database/prisma/prisma.service';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PlaylistType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { RedisService } from '../redis/redis.service';
import {
    CreateAlbumDto,
    CreateArtistDto,
    CreateTrackDto,
} from './dto/create-content.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

const TTL = 5 * 60;

@Injectable()
export class MusicService {
    private readonly logger = new Logger(MusicService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
        private readonly cloudinaryService: CloudinaryService,
    ) {}

    //------------------------------------------------------------------ SEARCH ------------------------------------------------------------------

    async searchTracks(userId: string | null, query: PaginationQueryDto) {
        const params = {
            page: 1,
            limit: 10,
            keyword: '',
            ...query,
        };
        const { page, limit, keyword } = params;
        const skip = PaginationUtil.getSkip(page, limit);

        const safeKeyword = keyword.trim().replace(/\s+/g, '-').toLowerCase();
        const cacheKey = `music:search:${safeKeyword || 'all'}:${page}:${limit}`;

        const { totalItems, tracks } = await this.redisService.getOrSet(
            cacheKey,
            TTL,
            async () => {
                const whereCondition = keyword
                    ? {
                          title: {
                              contains: keyword,
                              mode: 'insensitive' as const,
                          },
                      }
                    : {};

                const [total, items] = await Promise.all([
                    this.prisma.track.count({ where: whereCondition }),
                    this.prisma.track.findMany({
                        where: whereCondition,
                        select: {
                            id: true,
                            title: true,
                            duration: true,
                            thumbnailUrl: true,
                            audioUrl: true,
                            createdAt: true,
                            albumId: true,
                            uploaderId: true,
                            artists: { select: { id: true, name: true } },
                            album: {
                                select: { id: true, name: true, image: true },
                            },
                        },
                        skip,
                        take: limit,
                        orderBy: { createdAt: 'desc' },
                    }),
                ]);

                return { totalItems: total, tracks: items };
            },
        );

        const favoritedSet = new Set<string>();

        if (userId && tracks.length > 0) {
            const trackIds = tracks.map((t) => t.id);

            const userFavorites = await this.prisma.track.findMany({
                where: {
                    id: { in: trackIds },
                    userPlaylists: { some: { userId, type: 'FAVORITE_TRACK' } },
                },
                select: { id: true },
            });

            userFavorites.forEach((t) => favoritedSet.add(t.id));
        }

        const formattedTracks = tracks.map((track) => ({
            ...track,
            isFavorited: favoritedSet.has(track.id),
        }));

        return PaginationUtil.paginate(
            formattedTracks,
            totalItems,
            page,
            limit,
        );
    }

    filterAlbumsByGenre(genreId: string) {
        this.logger.warn(
            `Genre filtering is not implemented yet. Requested genre: ${genreId}`,
        );
        return [];
    }

    //------------------------------------------------------------------ CONTENT ------------------------------------------------------------------

    async getPopularArtists(userId: string | null, limit: number = 10) {
        const cacheKey = `music:popular-artists:${limit}`;

        const artists = await this.redisService.getOrSet(
            cacheKey,
            TTL,
            async () => {
                return this.prisma.artist.findMany({
                    take: limit,
                    orderBy: { followers: 'desc' },
                });
            },
        );

        const followedSet = new Set<string>();
        if (userId && artists.length > 0) {
            const artistIds = artists.map((a) => a.id);
            const userFollowed = await this.prisma.artist.findMany({
                where: {
                    id: { in: artistIds },
                    userPlaylists: {
                        some: { userId, type: 'FAVORITE_ARTIST' },
                    },
                },
                select: { id: true },
            });
            userFollowed.forEach((a) => followedSet.add(a.id));
        }

        return artists.map((artist) => ({
            ...artist,
            isFollowing: followedSet.has(artist.id),
        }));
    }

    async getNewReleases(userId: string | null, limit: number = 10) {
        const cacheKey = `music:new-releases-albums:${limit}`;

        const albums = await this.redisService.getOrSet(
            cacheKey,
            TTL,
            async () => {
                return this.prisma.album.findMany({
                    take: limit,
                    orderBy: { releaseDate: 'desc' },
                    include: { artists: { select: { id: true, name: true } } },
                });
            },
        );

        const savedSet = new Set<string>();
        if (userId && albums.length > 0) {
            const albumIds = albums.map((a) => a.id);
            const userSaved = await this.prisma.album.findMany({
                where: {
                    id: { in: albumIds },
                    userPlaylists: { some: { userId, type: 'FAVORITE_ALBUM' } },
                },
                select: { id: true },
            });
            userSaved.forEach((a) => savedSet.add(a.id));
        }

        return albums.map((album) => ({
            ...album,
            isSaved: savedSet.has(album.id),
        }));
    }

    async getTrendingTracks(userId: string | null, limit: number = 10) {
        const cacheKey = `music:trending-tracks:${limit}`;

        const tracks = await this.redisService.getOrSet(
            cacheKey,
            TTL,
            async () => {
                return this.prisma.track.findMany({
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        thumbnailUrl: true,
                        audioUrl: true,
                        createdAt: true,
                        albumId: true,
                        uploaderId: true,
                        artists: { select: { id: true, name: true } },
                        album: {
                            select: { id: true, image: true, name: true },
                        },
                    },
                });
            },
        );

        const favoritedSet = new Set<string>();
        if (userId && tracks.length > 0) {
            const trackIds = tracks.map((t) => t.id);
            const userFavorites = await this.prisma.track.findMany({
                where: {
                    id: { in: trackIds },
                    userPlaylists: { some: { userId, type: 'FAVORITE_TRACK' } },
                },
                select: { id: true },
            });
            userFavorites.forEach((t) => favoritedSet.add(t.id));
        }

        return tracks.map((track) => ({
            ...track,
            isFavorited: favoritedSet.has(track.id),
        }));
    }

    async getTrackLyric(trackId: string) {
        const cacheKey = `music:track-lyric:${trackId}`;

        return this.redisService.getOrSet(cacheKey, TTL, async () => {
            const track = await this.prisma.track.findUnique({
                where: { id: trackId },
                select: { id: true, title: true, lyrics: true },
            });

            if (!track) throw new NotFoundException('Track not found');

            let lyrics: {
                text: string;
                words: { startTime: number; endTime: number; data: string }[];
            }[] = [];

            if (track.lyrics) {
                try {
                    const parsed =
                        typeof track.lyrics === 'string'
                            ? JSON.parse(track.lyrics)
                            : track.lyrics;
                    if (Array.isArray(parsed)) {
                        lyrics = parsed.map((sentence: any) => ({
                            text: (sentence.words ?? [])
                                .map((w: any) => w.data)
                                .join(' '),
                            words: sentence.words ?? [],
                        }));
                    }
                } catch (error) {
                    this.logger.error('Error parsing track lyrics', error);
                }
            }

            return { id: track.id, title: track.title, lyrics };
        });
    }

    async getSystemPlaylists(limit: number = 10) {
        const cacheKey = `music:system-playlists:${limit}`;

        return this.redisService.getOrSet(cacheKey, TTL, async () => {
            return this.prisma.playlist.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { tracks: true } },
                },
            });
        });
    }

    //------------------------------------------------------------------ LIBRARY ------------------------------------------------------------------

    async toggleLibraryItem(
        userId: string,
        type: PlaylistType,
        itemId: string,
    ) {
        switch (type) {
            case PlaylistType.FAVORITE_TRACK: {
                let playlist = await this.prisma.userPlaylist.findFirst({
                    where: { userId, type },
                });
                if (!playlist) {
                    playlist = await this.prisma.userPlaylist.create({
                        data: {
                            name: 'Favorite Playlist',
                            userId,
                            type,
                            isPublic: false,
                        },
                    });
                }
                const existingTrack = await this.prisma.userPlaylist.findFirst({
                    where: {
                        id: playlist.id,
                        tracks: { some: { id: itemId } },
                    },
                });
                await this.prisma.userPlaylist.update({
                    where: { id: playlist.id },
                    data: {
                        tracks: existingTrack
                            ? { disconnect: { id: itemId } }
                            : { connect: { id: itemId } },
                    },
                });
                await this.redisService.delByPattern(
                    `music:user-playlists:${userId}:*`,
                );
                return { isToggled: !existingTrack };
            }
            case PlaylistType.FAVORITE_ALBUM: {
                const existingAlbum = await this.prisma.userPlaylist.findFirst({
                    where: {
                        userId,
                        type: PlaylistType.FAVORITE_ALBUM,
                        albums: { some: { id: itemId } },
                    },
                });
                if (existingAlbum) {
                    await this.prisma.userPlaylist.delete({
                        where: { id: existingAlbum.id },
                    });
                    await this.redisService.delByPattern(
                        `music:user-playlists:${userId}:*`,
                    );
                    return { isToggled: false };
                }
                const album = await this.prisma.album.findUnique({
                    where: { id: itemId },
                });
                if (!album) throw new NotFoundException('Album not found');
                await this.prisma.userPlaylist.create({
                    data: {
                        userId,
                        type: PlaylistType.FAVORITE_ALBUM,
                        name: album.name,
                        image: album.image,
                        isPublic: false,
                        albums: { connect: { id: itemId } },
                    },
                });
                await this.redisService.delByPattern(
                    `music:user-playlists:${userId}:*`,
                );
                return { isToggled: true };
            }

            case PlaylistType.FAVORITE_ARTIST: {
                const existingArtist = await this.prisma.userPlaylist.findFirst(
                    {
                        where: {
                            userId,
                            type: PlaylistType.FAVORITE_ARTIST,
                            artists: { some: { id: itemId } },
                        },
                    },
                );
                if (existingArtist) {
                    await this.prisma.$transaction([
                        this.prisma.userPlaylist.delete({
                            where: { id: existingArtist.id },
                        }),
                        this.prisma.artist.update({
                            where: { id: itemId },
                            data: { followers: { decrement: 1 } },
                        }),
                    ]);
                    await this.redisService.delByPattern(
                        `music:user-playlists:${userId}:*`,
                    );
                    return { isToggled: false };
                }
                const artist = await this.prisma.artist.findUnique({
                    where: { id: itemId },
                });
                if (!artist) throw new NotFoundException('Artist not found');
                await this.prisma.$transaction([
                    this.prisma.userPlaylist.create({
                        data: {
                            userId,
                            type: PlaylistType.FAVORITE_ARTIST,
                            name: artist.name,
                            description: artist.description,
                            image: artist.image,
                            isPublic: false,
                            artists: { connect: { id: itemId } },
                        },
                    }),
                    this.prisma.artist.update({
                        where: { id: itemId },
                        data: { followers: { increment: 1 } },
                    }),
                ]);
                await this.redisService.delByPattern(
                    `music:user-playlists:${userId}:*`,
                );
                return { isToggled: true };
            }

            default:
                throw new BadRequestException('Invalid library type');
        }
    }

    async checkLibraryItem(userId: string, type: PlaylistType, itemId: string) {
        let relationName = '';
        if (type === PlaylistType.FAVORITE_TRACK) relationName = 'tracks';
        else if (type === PlaylistType.FAVORITE_ALBUM) relationName = 'albums';
        else if (type === PlaylistType.FAVORITE_ARTIST)
            relationName = 'artists';
        else throw new BadRequestException('Invalid library type');

        const count = await this.prisma.userPlaylist.count({
            where: { userId, type, [relationName]: { some: { id: itemId } } },
        });
        return { isToggled: count > 0 };
    }

    async getUserPlaylists(userId: string, type?: PlaylistType) {
        const cacheKey = `music:user-playlists:${userId}:${type || 'ALL'}`;

        return await this.redisService.getOrSet(cacheKey, TTL, async () => {
            const whereClause = type ? { userId, type } : { userId };
            const [total, items] = await Promise.all([
                this.prisma.userPlaylist.count({ where: whereClause }),
                this.prisma.userPlaylist.findMany({
                    where: whereClause,
                    include: {
                        _count: {
                            select: {
                                tracks: true,
                                albums: true,
                                artists: true,
                            },
                        },
                        tracks: {
                            take: 1,
                            select: { id: true, thumbnailUrl: true },
                        },
                        albums: { take: 1, select: { id: true, image: true } },
                        artists: { take: 1, select: { id: true, image: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            ]);

            const processedItems = items
                .filter((item) => {
                    if (item.type === PlaylistType.CUSTOM) return true;
                    return (
                        item._count.tracks +
                            item._count.albums +
                            item._count.artists >
                        0
                    );
                })
                .map((item) => {
                    const { tracks, albums, artists, ...rest } = item;

                    let targetId = item.id;
                    if (
                        item.type === PlaylistType.FAVORITE_ALBUM &&
                        albums?.[0]?.id
                    ) {
                        targetId = albums[0].id;
                    } else if (
                        item.type === PlaylistType.FAVORITE_ARTIST &&
                        artists?.[0]?.id
                    ) {
                        targetId = artists[0].id;
                    }

                    return {
                        ...rest,
                        targetId,
                        image:
                            item.image ||
                            albums?.[0]?.image ||
                            artists?.[0]?.image ||
                            tracks?.[0]?.thumbnailUrl ||
                            null,
                    };
                });

            return { totalItems: processedItems.length, items: processedItems };
        });
    }

    //------------------------------------------------------------------ PLAYLIST ------------------------------------------------------------------

    async getPlaylistDetail(playlistId: string, userId: string | null) {
        const cacheKey = `music:playlist-detail:${playlistId}`;

        const playlist = await this.redisService.getOrSet(
            cacheKey,
            TTL,
            async () => {
                const data = await this.prisma.userPlaylist.findUnique({
                    where: { id: playlistId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                        tracks: {
                            include: {
                                artists: true,
                                album: true,
                            },
                        },
                    },
                });

                if (!data) throw new NotFoundException('Playlist not found');
                return data;
            },
        );

        let isSaved = false;
        if (userId) {
            const count = await this.prisma.userPlaylist.count({
                where: { userId, type: PlaylistType.CUSTOM, id: playlistId },
            });
            isSaved = count > 0;
        }

        return {
            ...playlist,
            isSaved,
        };
    }

    async createPlaylist(
        userId: string,
        dto: CreatePlaylistDto,
        imageFile: Express.Multer.File,
    ) {
        if (!imageFile) throw new BadRequestException('Image file is required');
        const imageUrl = await this.cloudinaryService.uploadFile(imageFile, {
            folder: 'music/images/playlists',
            publicId: randomUUID(),
        });

        const playlist = await this.prisma.userPlaylist.create({
            data: {
                ...dto,
                userId,
                type: 'CUSTOM',
                image: imageUrl,
            },
        });

        await this.redisService.delByPattern(
            `music:user-playlists:${userId}:*`,
        );
        return playlist;
    }

    async updatePlaylist(
        userId: string,
        playlistId: string,
        dto: CreatePlaylistDto,
        imageFile: Express.Multer.File,
    ) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
        });
        if (!playlist) throw new NotFoundException('Playlist not found');
        if (playlist.userId !== userId)
            throw new ForbiddenException('You do not own this playlist');

        if (playlist.type !== 'CUSTOM') {
            throw new BadRequestException(
                'Cannot update system playlist metadata',
            );
        }

        let imageUrl = playlist.image;
        if (imageFile) {
            // Xóa ảnh cũ trước khi upload ảnh mới
            await this.cloudinaryService.deleteFileByUrl(playlist.image);
            imageUrl = await this.cloudinaryService.uploadFile(imageFile, {
                folder: 'music/images/playlists',
                publicId: randomUUID(),
            });
        }

        const updatedPlaylist = await this.prisma.userPlaylist.update({
            where: { id: playlistId },
            data: {
                ...dto,
                image: imageUrl,
            },
        });

        await this.redisService.delByPattern(
            `music:user-playlists:${userId}:*`,
        );
        return updatedPlaylist;
    }

    async deletePlaylist(userId: string, playlistId: string) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
        });
        if (!playlist) throw new NotFoundException('Playlist not found');
        if (playlist.userId !== userId)
            throw new ForbiddenException('You do not own this playlist');

        // Xóa ảnh playlist trên Cloudinary
        await this.cloudinaryService.deleteFileByUrl(playlist.image);
        await this.redisService.delByPattern(
            `music:user-playlists:${userId}:*`,
        );
        await this.prisma.userPlaylist.delete({ where: { id: playlistId } });
        return { success: true };
    }

    async addTrackToPlaylist(
        userId: string,
        playlistId: string,
        trackId: string,
    ) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
            select: { userId: true },
        });

        if (!playlist) throw new NotFoundException('Playlist not found');
        if (playlist.userId !== userId)
            throw new ForbiddenException('You do not own this playlist');

        await this.redisService.delByPattern(
            `music:user-playlists:${userId}:*`,
        );
        await this.prisma.userPlaylist.update({
            where: { id: playlistId },
            data: {
                tracks: { connect: { id: trackId } },
            },
        });

        return { success: true };
    }

    async removeTrackFromPlaylist(
        userId: string,
        playlistId: string,
        trackId: string,
    ) {
        const playlist = await this.prisma.userPlaylist.findUnique({
            where: { id: playlistId },
            select: { userId: true },
        });

        if (!playlist) throw new NotFoundException('Playlist not found');
        if (playlist.userId !== userId)
            throw new ForbiddenException('You do not own this playlist');

        await this.redisService.del(`music:user-playlists:${userId}`);
        await this.prisma.userPlaylist.update({
            where: { id: playlistId },
            data: {
                tracks: { disconnect: { id: trackId } },
            },
        });

        return { success: true };
    }

    //------------------------------------------------------------------ ARTIST ------------------------------------------------------------------

    async getArtistDetail(artistId: string, userId: string | null) {
        const cacheKey = `music:artist-detail:${artistId}`;

        const artist = await this.redisService.getOrSet(
            cacheKey,
            TTL,
            async () => {
                const data = await this.prisma.artist.findUnique({
                    where: { id: artistId },
                    include: {
                        tracks: {
                            include: {
                                artists: true,
                                album: true,
                            },
                        },
                    },
                });

                if (!data) throw new NotFoundException('Artist not found');
                return data;
            },
        );

        let isFollowing = false;
        if (userId) {
            const count = await this.prisma.userPlaylist.count({
                where: {
                    userId,
                    type: 'FAVORITE_ARTIST',
                    artists: { some: { id: artistId } },
                },
            });
            isFollowing = count > 0;
        }

        return {
            ...artist,
            isFollowing,
        };
    }

    async getArtistRadio(
        artistId: string,
        userId: string | null,
        limit: number = 10,
    ) {
        const cacheKey = `music:artist-radio:${artistId}:${limit}`;

        const { tracks, artists } = await this.redisService.getOrSet(
            cacheKey,
            TTL,
            async () => {
                const artist = await this.prisma.artist.findUnique({
                    where: { id: artistId },
                    select: { id: true, name: true, image: true },
                });

                if (!artist) throw new NotFoundException('Artist not found');

                const artistTracks = await this.prisma.track.findMany({
                    where: { artists: { some: { id: artistId } } },
                    take: Math.ceil(limit / 2),
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                        thumbnailUrl: true,
                        audioUrl: true,
                        createdAt: true,
                        albumId: true,
                        uploaderId: true,
                        artists: { select: { id: true, name: true } },
                        album: {
                            select: { id: true, image: true, name: true },
                        },
                    },
                });

                const similarArtists = await this.prisma.artist.findMany({
                    where: { id: { not: artistId } },
                    take: Math.ceil(limit / 2),
                    orderBy: { followers: 'desc' },
                });

                return { tracks: artistTracks, artists: similarArtists };
            },
        );

        const favoritedTrackSet = new Set<string>();
        const followedArtistSet = new Set<string>();

        if (userId && tracks.length > 0) {
            const trackIds = tracks.map((t) => t.id);
            const userFavorites = await this.prisma.track.findMany({
                where: {
                    id: { in: trackIds },
                    userPlaylists: { some: { userId, type: 'FAVORITE_TRACK' } },
                },
                select: { id: true },
            });
            userFavorites.forEach((t) => favoritedTrackSet.add(t.id));
        }

        if (userId && artists.length > 0) {
            const artistIds = artists.map((a) => a.id);
            const userFollowed = await this.prisma.artist.findMany({
                where: {
                    id: { in: artistIds },
                    userPlaylists: {
                        some: { userId, type: 'FAVORITE_ARTIST' },
                    },
                },
                select: { id: true },
            });
            userFollowed.forEach((a) => followedArtistSet.add(a.id));
        }

        return {
            tracks: tracks.map((track) => ({
                ...track,
                isFavorited: favoritedTrackSet.has(track.id),
            })),
            artists: artists.map((artist) => ({
                ...artist,
                isFollowing: followedArtistSet.has(artist.id),
            })),
        };
    }

    async getArtistAlbums(
        artistId: string,
        page: number = 1,
        limit: number = 15,
    ) {
        const cacheKey = `music:artist-albums:${artistId}:${page}:${limit}`;

        return this.redisService.getOrSet(cacheKey, TTL, async () => {
            const skip = (page - 1) * limit;

            const artist = await this.prisma.artist.findUnique({
                where: { id: artistId },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    image: true,
                    followers: true,
                },
            });

            if (!artist) throw new NotFoundException('Artist not found');

            const albums = await this.prisma.album.findMany({
                where: { artists: { some: { id: artistId } } },
                take: limit,
                skip,
                orderBy: { releaseDate: 'desc' },
            });

            const totalAlbums = await this.prisma.album.count({
                where: { artists: { some: { id: artistId } } },
            });

            return {
                artist,
                albums,
                totalAlbums,
                currentPage: page,
                totalPages: Math.ceil(totalAlbums / limit),
            };
        });
    }

    async createArtist(dto: CreateArtistDto, imageFile: Express.Multer.File) {
        if (!imageFile) throw new BadRequestException('Image file is required');
        const imageUrl = await this.cloudinaryService.uploadFile(imageFile, {
            folder: 'music/images/artists',
            publicId: randomUUID(),
        });

        return this.prisma.artist.create({
            data: {
                name: dto.name,
                description: dto.description,
                image: imageUrl,
            },
        });
    }

    async updateArtist(
        id: string,
        dto: CreateArtistDto,
        imageFile: Express.Multer.File | null,
    ) {
        let imageUrl;
        if (imageFile) {
            const existing = await this.prisma.artist.findUnique({
                where: { id },
                select: { image: true },
            });
            await this.cloudinaryService.deleteFileByUrl(existing?.image);
            imageUrl = await this.cloudinaryService.uploadFile(imageFile, {
                folder: 'music/images/artists',
                publicId: randomUUID(),
            });
        }

        return this.prisma.artist.update({
            where: { id },
            data: {
                ...dto,
                ...(imageUrl && { image: imageUrl }),
            },
        });
    }

    async deleteArtist(id: string) {
        const [trackCount, albumCount] = await Promise.all([
            this.prisma.track.count({ where: { artists: { some: { id } } } }),
            this.prisma.album.count({ where: { artists: { some: { id } } } }),
        ]);

        if (trackCount > 0) {
            throw new BadRequestException(
                `Không thể xóa nghệ sĩ này vì còn ${trackCount} bài hát đang gắn với họ. Vui lòng gỡ bài hát trước.`,
            );
        }

        if (albumCount > 0) {
            throw new BadRequestException(
                `Không thể xóa nghệ sĩ này vì còn ${albumCount} album đang gắn với họ. Vui lòng xóa hoặc gỡ album trước.`,
            );
        }

        await this.cloudinaryService.deleteFile(`music/images/artists/${id}`);
        return this.prisma.artist.delete({ where: { id } });
    }

    //------------------------------------------------------------------ ALBUM ------------------------------------------------------------------

    async getAlbumDetail(albumId: string, userId: string | null) {
        const cacheKey = `music:album-detail:${albumId}`;

        const album = await this.redisService.getOrSet(
            cacheKey,
            TTL,
            async () => {
                const data = await this.prisma.album.findUnique({
                    where: { id: albumId },
                    include: {
                        artists: true,
                        tracks: {
                            include: {
                                artists: true,
                                album: true,
                            },
                        },
                    },
                });

                if (!data) throw new NotFoundException('Album not found');
                return data;
            },
        );

        let isSaved = false;
        if (userId) {
            const count = await this.prisma.userPlaylist.count({
                where: {
                    userId,
                    type: 'FAVORITE_ALBUM',
                    albums: { some: { id: albumId } },
                },
            });
            isSaved = count > 0;
        }

        return {
            ...album,
            isSaved,
        };
    }

    async createAlbum(
        uploaderId: string,
        dto: CreateAlbumDto,
        imageFile: Express.Multer.File,
    ) {
        if (!imageFile) throw new BadRequestException('Image file is required');
        const imageUrl = await this.cloudinaryService.uploadFile(imageFile, {
            folder: 'music/images/albums',
            publicId: randomUUID(),
        });

        return this.prisma.album.create({
            data: {
                name: dto.name,
                releaseDate: dto.releaseDate
                    ? new Date(dto.releaseDate)
                    : undefined,
                image: imageUrl,
                uploaderId,
                artists: connectIds(dto.artistIds),
            },
        });
    }

    async updateAlbum(
        id: string,
        dto: CreateAlbumDto,
        imageFile: Express.Multer.File | null,
    ) {
        let imageUrl;
        if (imageFile) {
            const existing = await this.prisma.album.findUnique({
                where: { id },
                select: { image: true },
            });
            await this.cloudinaryService.deleteFileByUrl(existing?.image);
            imageUrl = await this.cloudinaryService.uploadFile(imageFile, {
                folder: 'music/images/albums',
                publicId: randomUUID(),
            });
        }

        const { artistIds, ...restDto } = dto;

        return this.prisma.album.update({
            where: { id },
            data: {
                ...restDto,
                ...(imageUrl && { image: imageUrl }),
                ...(artistIds !== undefined && {
                    artists: {
                        set: [],
                        connect: artistIds.map((id) => ({ id })),
                    },
                }),
            },
        });
    }

    async deleteAlbum(id: string) {
        await this.cloudinaryService.deleteFile(`music/images/albums/${id}`);
        await this.prisma.track.updateMany({
            where: { albumId: id },
            data: { albumId: null },
        });
        return this.prisma.album.delete({ where: { id } });
    }

    //------------------------------------------------------------------ TRACK ------------------------------------------------------------------

    async getTrackDetail(trackId: string, userId: string | null) {
        const cacheKey = `music:track-detail:${trackId}`;

        const track = await this.redisService.getOrSet(
            cacheKey,
            TTL,
            async () => {
                const data = await this.prisma.track.findUnique({
                    where: { id: trackId },
                    include: {
                        artists: true,
                        album: true,
                        uploader: {
                            select: {
                                id: true,
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                });

                if (!data) throw new NotFoundException('Track not found');
                return data;
            },
        );

        let isFavorited = false;
        if (userId) {
            const count = await this.prisma.userPlaylist.count({
                where: {
                    userId,
                    type: 'FAVORITE_TRACK',
                    tracks: { some: { id: trackId } },
                },
            });
            isFavorited = count > 0;
        }

        return {
            ...track,
            isFavorited,
        };
    }

    async createTrack(
        uploaderId: string,
        dto: CreateTrackDto,
        audioFile: Express.Multer.File,
        thumbnailFile: Express.Multer.File,
    ) {
        const [audioUrl, thumbnailUrl] = await Promise.all([
            this.cloudinaryService.uploadFile(audioFile, {
                folder: 'music/audio',
                publicId: randomUUID(),
            }),
            this.cloudinaryService.uploadFile(thumbnailFile, {
                folder: 'music/images/tracks',
                publicId: randomUUID(),
            }),
        ]);

        await this.redisService.delByPattern(`music:*`);

        return this.prisma.track.create({
            data: {
                title: dto.title,
                duration: Number(dto.duration),
                audioUrl: audioUrl,
                thumbnailUrl: thumbnailUrl,
                lyrics: dto.lyrics,
                uploaderId,
                albumId: dto.albumId,
                artists: connectIds(dto.artistIds),
            },
            include: {
                artists: true,
                album: true,
            },
        });
    }

    async updateTrack(
        id: string,
        dto: CreateTrackDto,
        audioFile?: Express.Multer.File,
        thumbnailFile?: Express.Multer.File,
    ) {
        let audioUrl, thumbnailUrl;

        if (audioFile || thumbnailFile) {
            const existing = await this.prisma.track.findUnique({
                where: { id },
                select: { audioUrl: true, thumbnailUrl: true },
            });

            if (audioFile) {
                await this.cloudinaryService.deleteFileByUrl(
                    existing?.audioUrl,
                );
                audioUrl = await this.cloudinaryService.uploadFile(audioFile, {
                    folder: 'music/audio',
                    publicId: randomUUID(),
                });
            }

            if (thumbnailFile) {
                await this.cloudinaryService.deleteFileByUrl(
                    existing?.thumbnailUrl,
                );
                thumbnailUrl = await this.cloudinaryService.uploadFile(
                    thumbnailFile,
                    {
                        folder: 'music/images/tracks',
                        publicId: randomUUID(),
                    },
                );
            }
        }

        const { artistIds, ...restDto } = dto;

        await this.redisService.delByPattern(`music:*`);

        return this.prisma.track.update({
            where: { id },
            data: {
                ...restDto,
                duration: Number(dto.duration),
                ...(audioUrl && { audioUrl }),
                ...(thumbnailUrl && { thumbnailUrl }),
                ...(artistIds !== undefined && {
                    artists: {
                        set: [],
                        connect: artistIds.map((id) => ({ id })),
                    },
                }),
            },
        });
    }

    async deleteTracks(ids: string[]) {
        await this.prisma.track.deleteMany({ where: { id: { in: ids } } });
        await Promise.all(
            ids.map(async (id) => {
                await this.cloudinaryService.deleteFile(`music/audio/${id}`);
                await this.cloudinaryService.deleteFile(
                    `music/images/tracks/${id}`,
                );
            }),
        );
        await this.redisService.delByPattern(`music:*`);
    }
}
