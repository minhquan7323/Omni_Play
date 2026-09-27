import { GetJwtUser } from "@/common/decorators/get-user.decorator";
import { ResponseMessage } from "@/common/decorators/response-message.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileFieldsInterceptor, FileInterceptor } from "@nestjs/platform-express";
import { PlaylistType } from "@prisma/client";
import { AtGuard, OptionalAtGuard } from "../auth/guards";
import { CreateAlbumDto, CreateArtistDto, CreateTrackDto } from "./dto/create-content.dto";
import { CreatePlaylistDto } from "./dto/create-playlist.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { MusicService } from "./music.service";

@Controller('music')
export class MusicController {
    constructor(private readonly musicService: MusicService) { }

    //------------------------------------------------------------------ LIBRARY ------------------------------------------------------------------

    @Post('library/toggle')
    @UseGuards(AtGuard)
    @ResponseMessage('Toggle library item successfully')
    async toggleLibraryItem(
        @GetJwtUser('sub') userId: string,
        @Body('type') type: PlaylistType,
        @Body('itemId') itemId: string
    ) {
        return this.musicService.toggleLibraryItem(userId, type, itemId);
    }

    @Get('library/check')
    @UseGuards(AtGuard)
    @ResponseMessage('Check library status successfully')
    async checkLibraryItem(
        @GetJwtUser('sub') userId: string,
        @Query('type') type: PlaylistType,
        @Query('itemId') itemId: string
    ) {
        return this.musicService.checkLibraryItem(userId, type, itemId);
    }

    @Get('library/playlists')
    @UseGuards(AtGuard)
    @ResponseMessage('Get user playlists successfully')
    async getUserPlaylists(@GetJwtUser('sub') userId: string, @Query('type') type?: PlaylistType) {
        return this.musicService.getUserPlaylists(userId, type);
    }

    //------------------------------------------------------------------ SEARCH ------------------------------------------------------------------

    @Get('search')
    @UseGuards(OptionalAtGuard)
    @ResponseMessage('Search tracks successfully')
    async searchTracks(
        @GetJwtUser('sub') userId: string | null,
        @Query() query: PaginationQueryDto
    ) {
        return this.musicService.searchTracks(userId, query);
    }

    @Get('filter-albums')
    @ResponseMessage('Filter albums by genre successfully')
    async filterAlbumsByGenre(@Query('genreId') genreId: string) {
        return this.musicService.filterAlbumsByGenre(genreId);
    }

    //------------------------------------------------------------------ CONTENT ------------------------------------------------------------------

    @Get('albums/new-releases')
    @UseGuards(OptionalAtGuard)
    @ResponseMessage('Get new releases successfully')
    async getNewReleases(@GetJwtUser('sub') userId: string | null) {
        return this.musicService.getNewReleases(userId);
    }


    @Get('system-playlists')
    @ResponseMessage('Get system playlists successfully')
    async getSystemPlaylists() {
        return this.musicService.getSystemPlaylists();
    }

    @Get('artists/popular')
    @UseGuards(OptionalAtGuard)
    @ResponseMessage('Get popular artists successfully')
    async getPopularArtists(@GetJwtUser('sub') userId: string | null) {
        return this.musicService.getPopularArtists(userId);
    }

    @Get('tracks/trending')
    @UseGuards(OptionalAtGuard)
    @ResponseMessage('Get trending tracks successfully')
    async getTrendingTracks(@GetJwtUser('sub') userId: string | null) {
        return this.musicService.getTrendingTracks(userId);
    }

    //------------------------------------------------------------------ PLAYLIST ------------------------------------------------------------------

    @Get('playlist/:id')
    @UseGuards(OptionalAtGuard)
    @ResponseMessage('Get playlist detail successfully')
    async getPlaylistDetail(@Param('id') playlistId: string, @GetJwtUser('sub') userId: string | null) {
        return this.musicService.getPlaylistDetail(playlistId, userId);
    }

    @Post('playlist')
    @UseGuards(AtGuard)
    @UseInterceptors(FileInterceptor('imageFile'))
    @ResponseMessage('Create playlist successfully')
    async createPlaylist(
        @GetJwtUser('sub') userId: string,
        @Body() dto: CreatePlaylistDto,
        @UploadedFile() imageFile: Express.Multer.File
    ) {
        return this.musicService.createPlaylist(userId, dto, imageFile);
    }

    @Patch('playlist/:id')
    @UseGuards(AtGuard)
    @UseInterceptors(FileInterceptor('imageFile'))
    @ResponseMessage('Update playlist successfully')
    async updatePlaylist(
        @GetJwtUser('sub') userId: string,
        @Param('id') playlistId: string,
        @Body() dto: CreatePlaylistDto,
        @UploadedFile() imageFile: Express.Multer.File
    ) {
        return this.musicService.updatePlaylist(userId, playlistId, dto, imageFile);
    }

    @Delete('playlist/:id')
    @UseGuards(AtGuard)
    @ResponseMessage('Delete playlist successfully')
    async deletePlaylist(@GetJwtUser('sub') userId: string, @Param('id') playlistId: string) {
        return this.musicService.deletePlaylist(userId, playlistId);
    }

    @Post('playlist/add-track')
    @UseGuards(AtGuard)
    @ResponseMessage('Add track to playlist successfully')
    async addTrackToPlaylist(
        @GetJwtUser('sub') userId: string,
        @Body('playlistId') playlistId: string,
        @Body('trackId') trackId: string
    ) {
        return this.musicService.addTrackToPlaylist(userId, playlistId, trackId);
    }

    @Delete('playlist/remove-track')
    @UseGuards(AtGuard)
    @ResponseMessage('Remove track from playlist successfully')
    async removeTrackFromPlaylist(
        @GetJwtUser('sub') userId: string,
        @Body('playlistId') playlistId: string,
        @Body('trackId') trackId: string
    ) {
        return this.musicService.removeTrackFromPlaylist(userId, playlistId, trackId);
    }

    //------------------------------------------------------------------ ARTIST ------------------------------------------------------------------

    @Get('artist/:artistId')
    @UseGuards(OptionalAtGuard)
    @ResponseMessage('Get artist detail successfully')
    async getArtistDetail(@Param('artistId') artistId: string, @GetJwtUser('sub') userId: string | null) {
        return this.musicService.getArtistDetail(artistId, userId);
    }

    @Get('artist/:artistId/radio')
    @UseGuards(OptionalAtGuard)
    @ResponseMessage('Get artist radio successfully')
    async getArtistRadio(
        @Param('artistId') artistId: string,
        @GetJwtUser('sub') userId: string | null,
        @Query('limit') limit?: number
    ) {
        return this.musicService.getArtistRadio(artistId, userId, limit);
    }

    @Get('artist/:artistId/albums')
    @UseGuards(OptionalAtGuard)
    @ResponseMessage('Get artist albums successfully')
    async getArtistAlbums(
        @Param('artistId') artistId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.musicService.getArtistAlbums(artistId, page, limit);
    }

    @Post('cms/artist')
    @UseGuards(AtGuard, RolesGuard)
    @Roles('admin', 'superadmin', 'music_artist')
    @UseInterceptors(FileInterceptor('imageFile'))
    @ResponseMessage('Create artist successfully')
    async createArtist(@Body() dto: CreateArtistDto, @UploadedFile() imageFile: Express.Multer.File) {
        return this.musicService.createArtist(dto, imageFile);
    }

    @Patch('cms/artist/:id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles('admin', 'superadmin', 'music_artist')
    @UseInterceptors(FileInterceptor('imageFile'))
    @ResponseMessage('Update artist successfully')
    async updateArtist(
        @Param('id') id: string,
        @Body() dto: CreateArtistDto,
        @UploadedFile() imageFile: Express.Multer.File | null
    ) {
        return this.musicService.updateArtist(id, dto, imageFile);
    }

    @Delete('cms/artist/:id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles('admin', 'superadmin', 'music_artist')
    @ResponseMessage('Delete artist successfully')
    async deleteArtist(@Param('id') id: string) {
        return this.musicService.deleteArtist(id);
    }

    //------------------------------------------------------------------ ALBUM ------------------------------------------------------------------

    @Get('album/:albumId')
    @UseGuards(OptionalAtGuard)
    @ResponseMessage('Get album detail successfully')
    async getAlbumDetail(@Param('albumId') albumId: string, @GetJwtUser('sub') userId: string | null) {
        return this.musicService.getAlbumDetail(albumId, userId);
    }

    @Post('cms/album')
    @UseGuards(AtGuard, RolesGuard)
    @Roles('admin', 'superadmin', 'music_artist')
    @UseInterceptors(FileInterceptor('imageFile'))
    @ResponseMessage('Create album successfully')
    async createAlbum(
        @GetJwtUser('sub') uploaderId: string,
        @Body() dto: CreateAlbumDto,
        @UploadedFile() imageFile: Express.Multer.File
    ) {
        return this.musicService.createAlbum(uploaderId, dto, imageFile);
    }

    @Patch('cms/album/:id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles('admin', 'superadmin', 'music_artist')
    @UseInterceptors(FileInterceptor('imageFile'))
    @ResponseMessage('Update album successfully')
    async updateAlbum(
        @Param('id') id: string,
        @Body() dto: CreateAlbumDto,
        @UploadedFile() imageFile: Express.Multer.File | null
    ) {
        return this.musicService.updateAlbum(id, dto, imageFile);
    }

    @Delete('cms/album/:id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles('admin', 'superadmin', 'music_artist')
    @ResponseMessage('Delete album successfully')
    async deleteAlbum(@Param('id') id: string) {
        return this.musicService.deleteAlbum(id);
    }
    //------------------------------------------------------------------ TRACK ------------------------------------------------------------------

    @Get('track/:trackId')
    @UseGuards(OptionalAtGuard)
    @ResponseMessage('Get track detail successfully')
    async getTrackDetail(@Param('trackId') trackId: string, @GetJwtUser('sub') userId: string | null) {
        return this.musicService.getTrackDetail(trackId, userId);
    }

    @Get('track/:trackId/lyric')
    @ResponseMessage('Get track lyric successfully')
    async getTrackLyric(@Param('trackId') trackId: string) {
        return this.musicService.getTrackLyric(trackId);
    }

    @Patch('cms/track/:id')
    @UseGuards(AtGuard, RolesGuard)
    @Roles('admin', 'superadmin', 'music_artist')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'audioFile', maxCount: 1 },
        { name: 'thumbnailFile', maxCount: 1 }
    ]))
    @ResponseMessage('Update track successfully')
    async updateTrack(
        @Param('id') id: string,
        @Body() dto: CreateTrackDto,
        @UploadedFiles() files: {
            audioFile?: Express.Multer.File[],
            thumbnailFile?: Express.Multer.File[]
        }
    ) {
        return this.musicService.updateTrack(
            id,
            dto,
            files?.audioFile?.[0],
            files?.thumbnailFile?.[0]
        );
    }

    @Post('cms/track')
    @UseGuards(AtGuard, RolesGuard)
    @Roles('admin', 'superadmin', 'music_artist')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'audioFile', maxCount: 1 },
        { name: 'thumbnailFile', maxCount: 1 }
    ]))
    @ResponseMessage('Create track successfully')
    async createTrack(
        @GetJwtUser('sub') uploaderId: string,
        @Body() dto: CreateTrackDto,
        @UploadedFiles() files: {
            audioFile?: Express.Multer.File[],
            thumbnailFile?: Express.Multer.File[],
        }
    ) {
        return this.musicService.createTrack(
            uploaderId,
            dto,
            files?.audioFile?.[0] as Express.Multer.File,
            files?.thumbnailFile?.[0] as Express.Multer.File,
        );
    }

    @Delete('cms/tracks')
    @UseGuards(AtGuard, RolesGuard)
    @Roles('admin', 'superadmin', 'music_artist')
    @ResponseMessage('Delete tracks successfully')
    async deleteTracks(@Body('ids') ids: string[]) {
        return this.musicService.deleteTracks(ids);
    }
}