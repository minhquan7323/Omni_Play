import { useSelector } from 'react-redux';
import { ADMIN_ROLES, PERMISSIONS, ROLES, type PermissionSlug, type RoleSlug } from '@/constants/roles.constants';

/**
 * Hook for permission-based access control in the admin panel.
 *
 * Usage:
 *   const { hasPermission, hasRole, canAccess } = useAdminPermissions();
 *   if (canAccess.musicView) { ... }
 */
export function useAdminPermissions() {
    const roles: string[] = useSelector((state: any) => state.auth.roles ?? []);
    const permissions: string[] = useSelector((state: any) => state.auth.permissions ?? []);

    const isSuperAdmin = roles.includes(ROLES.SUPERADMIN);

    /** Check if user has a specific role */
    const hasRole = (role: RoleSlug): boolean =>
        isSuperAdmin || roles.includes(role);

    /** Check if user has a specific permission */
    const hasPermission = (permission: PermissionSlug): boolean =>
        isSuperAdmin || permissions.includes(permission);

    /** Check if user has any of the given permissions */
    const hasAnyPermission = (...perms: PermissionSlug[]): boolean =>
        isSuperAdmin || perms.some((p) => permissions.includes(p));

    /** Check if user can access the /admin panel at all */
    const isAdminUser = isSuperAdmin || ADMIN_ROLES.some((r) => roles.includes(r));

    /** Shorthand checks per feature area */
    const canAccess = {
        // Dashboard
        dashboard: hasPermission(PERMISSIONS.ADMIN_DASHBOARD),
        stats: hasPermission(PERMISSIONS.ADMIN_STATS),

        // Users
        usersView: hasPermission(PERMISSIONS.ADMIN_USERS_VIEW),
        usersManage: hasPermission(PERMISSIONS.ADMIN_USERS_MANAGE),

        // Roles
        rolesView: hasPermission(PERMISSIONS.ADMIN_ROLES_VIEW),
        rolesManage: hasPermission(PERMISSIONS.ADMIN_ROLES_MANAGE),

        // Tracking
        trackingView: hasPermission(PERMISSIONS.ADMIN_TRACKING_VIEW),

        // Music
        musicView: hasPermission(PERMISSIONS.MUSIC_VIEW),
        musicTrackCreate: hasPermission(PERMISSIONS.MUSIC_TRACK_CREATE),
        musicTrackUpdate: hasPermission(PERMISSIONS.MUSIC_TRACK_UPDATE),
        musicTrackDelete: hasPermission(PERMISSIONS.MUSIC_TRACK_DELETE),
        musicAlbumCreate: hasPermission(PERMISSIONS.MUSIC_ALBUM_CREATE),
        musicAlbumUpdate: hasPermission(PERMISSIONS.MUSIC_ALBUM_UPDATE),
        musicAlbumDelete: hasPermission(PERMISSIONS.MUSIC_ALBUM_DELETE),
        musicArtistCreate: hasPermission(PERMISSIONS.MUSIC_ARTIST_CREATE),
        musicArtistUpdate: hasPermission(PERMISSIONS.MUSIC_ARTIST_UPDATE),
        musicArtistDelete: hasPermission(PERMISSIONS.MUSIC_ARTIST_DELETE),
        musicPlaylistSystem: hasPermission(PERMISSIONS.MUSIC_PLAYLIST_SYSTEM),

        // Film
        filmView: hasPermission(PERMISSIONS.FILM_VIEW),
        filmManage: hasPermission(PERMISSIONS.FILM_MANAGE),

        // Whiteboard
        whiteboardView: hasPermission(PERMISSIONS.WHITEBOARD_VIEW),
        whiteboardManage: hasPermission(PERMISSIONS.WHITEBOARD_MANAGE),
    } as const;

    return {
        roles,
        permissions,
        isSuperAdmin,
        isAdminUser,
        hasRole,
        hasPermission,
        hasAnyPermission,
        canAccess,
    };
}
