import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AtGuard } from '../auth/guards';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { PERMISSIONS, ROLES } from '@/common/constants/roles.constants';

@Controller('admin')
@UseGuards(AtGuard, RolesGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // ─── Dashboard ───────────────────────────────────────────────────────────────
    @Get('stats')
    @Permissions(PERMISSIONS.ADMIN_DASHBOARD, PERMISSIONS.ADMIN_STATS)
    @ResponseMessage('Get dashboard stats successfully')
    getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    // ─── Users ───────────────────────────────────────────────────────────────────
    @Get('users')
    @Permissions(PERMISSIONS.ADMIN_USERS_VIEW)
    @ResponseMessage('Get users list successfully')
    getUsers(
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.adminService.getUsers({
            search,
            status,
            page: page ? +page : 1,
            limit: limit ? +limit : 20,
        });
    }

    @Get('users/:id')
    @Permissions(PERMISSIONS.ADMIN_USERS_VIEW)
    @ResponseMessage('Get user detail successfully')
    getUserById(@Param('id') userId: string) {
        return this.adminService.getUserById(userId);
    }

    @Patch('users/:id/status')
    @Permissions(PERMISSIONS.ADMIN_USERS_MANAGE)
    @ResponseMessage('Update user status successfully')
    updateUserStatus(
        @Param('id') userId: string,
        @Body('status') status: 'ACTIVE' | 'SUSPENDED' | 'BANNED',
    ) {
        return this.adminService.updateUserStatus(userId, status);
    }

    @Post('users/:id/roles')
    @Permissions(PERMISSIONS.ADMIN_USERS_MANAGE)
    @ResponseMessage('Assign role successfully')
    assignRole(
        @Param('id') userId: string,
        @Body() dto: { roleId: string; scope?: string },
    ) {
        return this.adminService.assignRole(userId, dto.roleId, dto.scope);
    }

    @Delete('users/:userId/roles/:roleId')
    @Permissions(PERMISSIONS.ADMIN_USERS_MANAGE)
    @ResponseMessage('Remove role successfully')
    removeRole(
        @Param('userId') userId: string,
        @Param('roleId') roleId: string,
        @Query('scope') scope?: string,
    ) {
        return this.adminService.removeRole(userId, roleId, scope);
    }

    // ─── Roles ───────────────────────────────────────────────────────────────────
    @Get('roles')
    @Permissions(PERMISSIONS.ADMIN_ROLES_VIEW)
    @ResponseMessage('Get roles list successfully')
    getRoles() {
        return this.adminService.getRoles();
    }

    @Post('roles')
    @Permissions(PERMISSIONS.ADMIN_ROLES_MANAGE)
    @ResponseMessage('Create role successfully')
    createRole(@Body() dto: any) {
        return this.adminService.createRole(dto);
    }

    @Patch('roles/:roleId')
    @Permissions(PERMISSIONS.ADMIN_ROLES_MANAGE)
    @ResponseMessage('Update role successfully')
    updateRole(@Param('roleId') roleId: string, @Body() dto: any) {
        return this.adminService.updateRole(roleId, dto);
    }

    @Delete('roles/:roleId')
    @Permissions(PERMISSIONS.ADMIN_ROLES_MANAGE)
    @ResponseMessage('Delete role successfully')
    deleteRole(@Param('roleId') roleId: string) {
        return this.adminService.deleteRole(roleId);
    }

    // ─── Permissions ─────────────────────────────────────────────────────────────
    @Get('permissions')
    @Permissions(PERMISSIONS.ADMIN_ROLES_VIEW)
    @ResponseMessage('Get permissions list successfully')
    getPermissions() {
        return this.adminService.getPermissions();
    }

    @Post('permissions')
    @Permissions(PERMISSIONS.ADMIN_ROLES_MANAGE)
    @ResponseMessage('Create permission successfully')
    createPermission(@Body() dto: any) {
        return this.adminService.createPermission(dto);
    }

    @Post('roles/:roleId/permissions/:permissionId')
    @Permissions(PERMISSIONS.ADMIN_ROLES_MANAGE)
    @ResponseMessage('Assign permission successfully')
    assignPermission(
        @Param('roleId') roleId: string,
        @Param('permissionId') permissionId: string,
    ) {
        return this.adminService.assignPermissionToRole(roleId, permissionId);
    }

    @Delete('roles/:roleId/permissions/:permissionId')
    @Permissions(PERMISSIONS.ADMIN_ROLES_MANAGE)
    @ResponseMessage('Remove permission successfully')
    removePermission(
        @Param('roleId') roleId: string,
        @Param('permissionId') permissionId: string,
    ) {
        return this.adminService.removePermissionFromRole(roleId, permissionId);
    }

    // ─── Music Admin ─────────────────────────────────────────────────────────────
    @Get('music/stats')
    @Permissions(PERMISSIONS.MUSIC_VIEW)
    @ResponseMessage('Get music stats successfully')
    getMusicStats() {
        return this.adminService.getMusicStats();
    }

    @Get('music/tracks')
    @Permissions(PERMISSIONS.MUSIC_VIEW)
    @ResponseMessage('Get tracks successfully')
    getTracks(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.adminService.getTracks({
            search,
            page: page ? +page : 1,
            limit: limit ? +limit : 20,
        });
    }

    @Patch('music/tracks/:id')
    @Permissions(PERMISSIONS.MUSIC_TRACK_UPDATE)
    @ResponseMessage('Update track successfully')
    updateTrack(@Param('id') trackId: string, @Body() dto: any) {
        return this.adminService.updateTrack(trackId, dto);
    }

    @Delete('music/tracks/:id')
    @Permissions(PERMISSIONS.MUSIC_TRACK_DELETE)
    @ResponseMessage('Delete track successfully')
    deleteTrack(@Param('id') trackId: string) {
        return this.adminService.deleteTrack(trackId);
    }

    @Get('music/albums')
    @Permissions(PERMISSIONS.MUSIC_VIEW)
    @ResponseMessage('Get albums successfully')
    getAlbums(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.adminService.getAlbums({
            search,
            page: page ? +page : 1,
            limit: limit ? +limit : 20,
        });
    }

    @Patch('music/albums/:id')
    @Permissions(PERMISSIONS.MUSIC_ALBUM_UPDATE)
    @ResponseMessage('Update album successfully')
    updateAlbum(@Param('id') albumId: string, @Body() dto: any) {
        return this.adminService.updateAlbum(albumId, dto);
    }

    @Delete('music/albums/:id')
    @Permissions(PERMISSIONS.MUSIC_ALBUM_DELETE)
    @ResponseMessage('Delete album successfully')
    deleteAlbum(@Param('id') albumId: string) {
        return this.adminService.deleteAlbum(albumId);
    }

    @Get('music/artists')
    @Permissions(PERMISSIONS.MUSIC_VIEW)
    @ResponseMessage('Get artists successfully')
    getArtists(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.adminService.getArtists({
            search,
            page: page ? +page : 1,
            limit: limit ? +limit : 20,
        });
    }

    @Patch('music/artists/:id')
    @Permissions(PERMISSIONS.MUSIC_ARTIST_UPDATE)
    @ResponseMessage('Update artist successfully')
    updateArtist(@Param('id') artistId: string, @Body() dto: any) {
        return this.adminService.updateArtist(artistId, dto);
    }

    @Delete('music/artists/:id')
    @Permissions(PERMISSIONS.MUSIC_ARTIST_DELETE)
    @ResponseMessage('Delete artist successfully')
    deleteArtist(@Param('id') artistId: string) {
        return this.adminService.deleteArtist(artistId);
    }

    // ─── Film Admin ──────────────────────────────────────────────────────────────
    @Get('film/stats')
    @Permissions(PERMISSIONS.FILM_VIEW)
    @ResponseMessage('Get film stats successfully')
    getFilmStats() {
        return this.adminService.getFilmStats();
    }

    @Get('film/watch-histories')
    @Permissions(PERMISSIONS.FILM_VIEW)
    @ResponseMessage('Get watch histories successfully')
    getWatchHistories(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.adminService.getWatchHistories({
            search,
            page: page ? +page : 1,
            limit: limit ? +limit : 20,
        });
    }

    // ─── Tracking Admin ──────────────────────────────────────────────────────────
    @Get('tracking/logs')
    @Permissions(PERMISSIONS.ADMIN_TRACKING_VIEW)
    @ResponseMessage('Get tracking logs successfully')
    getTrackingLogs(
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('module') module?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.adminService.getTrackingLogs({
            userId,
            action,
            module,
            page: page ? +page : 1,
            limit: limit ? +limit : 50,
        });
    }

    @Get('tracking/stats')
    @Permissions(PERMISSIONS.ADMIN_TRACKING_VIEW)
    @ResponseMessage('Get tracking stats successfully')
    getTrackingStats() {
        return this.adminService.getTrackingStats();
    }

    // ─── Whiteboard Admin ────────────────────────────────────────────────────────
    @Get('whiteboards')
    @Permissions(PERMISSIONS.WHITEBOARD_VIEW)
    @ResponseMessage('Get whiteboards successfully')
    getWhiteboards(
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.adminService.getWhiteboards({
            search,
            page: page ? +page : 1,
            limit: limit ? +limit : 20,
        });
    }

    @Patch('whiteboards/:boardId')
    @Permissions(PERMISSIONS.WHITEBOARD_MANAGE)
    @ResponseMessage('Update whiteboard successfully')
    updateWhiteboard(@Param('boardId') boardId: string, @Body() dto: any) {
        return this.adminService.updateWhiteboard(boardId, dto);
    }

    @Delete('whiteboards/:boardId')
    @Permissions(PERMISSIONS.WHITEBOARD_MANAGE)
    @ResponseMessage('Delete whiteboard successfully')
    deleteWhiteboard(@Param('boardId') boardId: string) {
        return this.adminService.deleteWhiteboard(boardId);
    }

    // ─── Seed ────────────────────────────────────────────────────────────────────
    @Post('seed')
    @Roles(ROLES.SUPERADMIN) // Only superadmin can reseed
    @ResponseMessage('Seed successfully')
    seed() {
        return this.adminService.seedDefaultRolesAndPermissions();
    }
}
