export const ROLES = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    MUSIC_MANAGER: 'music_manager',
    MUSIC_ARTIST: 'music_artist',
    FILM_MANAGER: 'film_manager',
    FILM_MODERATOR: 'film_moderator',
    WHITEBOARD_MANAGER: 'whiteboard_manager',
    USER: 'user',
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
    ADMIN_DASHBOARD: 'admin:dashboard',
    ADMIN_STATS: 'admin:stats',
    ADMIN_USERS_VIEW: 'admin:users:view',
    ADMIN_USERS_MANAGE: 'admin:users:manage',
    ADMIN_ROLES_VIEW: 'admin:roles:view',
    ADMIN_ROLES_MANAGE: 'admin:roles:manage',
    ADMIN_TRACKING_VIEW: 'admin:tracking:view',
    MUSIC_VIEW: 'music:view',
    MUSIC_TRACK_CREATE: 'music:track:create',
    MUSIC_TRACK_UPDATE: 'music:track:update',
    MUSIC_TRACK_DELETE: 'music:track:delete',
    MUSIC_ALBUM_CREATE: 'music:album:create',
    MUSIC_ALBUM_UPDATE: 'music:album:update',
    MUSIC_ALBUM_DELETE: 'music:album:delete',
    MUSIC_ARTIST_CREATE: 'music:artist:create',
    MUSIC_ARTIST_UPDATE: 'music:artist:update',
    MUSIC_ARTIST_DELETE: 'music:artist:delete',
    MUSIC_PLAYLIST_SYSTEM: 'music:playlist:system',
    FILM_VIEW: 'film:view',
    FILM_MANAGE: 'film:manage',
    WHITEBOARD_VIEW: 'whiteboard:view',
    WHITEBOARD_MANAGE: 'whiteboard:manage',
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];


export const ADMIN_ROLES: RoleSlug[] = [
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.MUSIC_MANAGER,
    ROLES.FILM_MANAGER,
    ROLES.WHITEBOARD_MANAGER,
];


export const NAV_PERMISSIONS = {
    dashboard: [PERMISSIONS.ADMIN_DASHBOARD, PERMISSIONS.ADMIN_STATS],
    users: [PERMISSIONS.ADMIN_USERS_VIEW],
    roles: [PERMISSIONS.ADMIN_ROLES_VIEW],
    music: [PERMISSIONS.MUSIC_VIEW],
    film: [PERMISSIONS.FILM_VIEW],
    whiteboard: [PERMISSIONS.WHITEBOARD_VIEW],
    tracking: [PERMISSIONS.ADMIN_TRACKING_VIEW],
} as const;
