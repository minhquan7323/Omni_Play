
// ─── Role Slugs ───────────────────────────────────────────────────────────────

export const ROLES = {
    // ─── Super Admin ─────────────────────────────────────────────────────────
    SUPERADMIN: 'superadmin',   // Full access to everything

    // ─── Admin Level ─────────────────────────────────────────────────────────
    ADMIN: 'admin',             // Full admin panel access

    // ─── Music ───────────────────────────────────────────────────────────────
    MUSIC_MANAGER: 'music_manager', // CRUD all music (tracks, albums, artists, system playlists)
    MUSIC_ARTIST: 'music_artist',   // CRUD own tracks/albums only, can self-manage artist profile

    // ─── Film ────────────────────────────────────────────────────────────────
    FILM_MANAGER: 'film_manager',       // Full film CRUD
    FILM_MODERATOR: 'film_moderator',   // View + manage watch histories

    // ─── Whiteboard ──────────────────────────────────────────────────────────
    WHITEBOARD_MANAGER: 'whiteboard_manager', // View + delete boards

    // ─── Default ─────────────────────────────────────────────────────────────
    USER: 'user', // No admin access
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];

// ─── Permission Slugs ─────────────────────────────────────────────────────────

export const PERMISSIONS = {
    // Dashboard
    ADMIN_DASHBOARD: 'admin:dashboard',
    ADMIN_STATS: 'admin:stats',

    // Users
    ADMIN_USERS_VIEW: 'admin:users:view',
    ADMIN_USERS_MANAGE: 'admin:users:manage',

    // Roles & Permissions
    ADMIN_ROLES_VIEW: 'admin:roles:view',
    ADMIN_ROLES_MANAGE: 'admin:roles:manage',

    // Tracking / Logs
    ADMIN_TRACKING_VIEW: 'admin:tracking:view',

    // Music
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
    MUSIC_PLAYLIST_SYSTEM: 'music:playlist:system', // Create/manage system playlists

    // Film
    FILM_VIEW: 'film:view',
    FILM_MANAGE: 'film:manage',

    // Whiteboard
    WHITEBOARD_VIEW: 'whiteboard:view',
    WHITEBOARD_MANAGE: 'whiteboard:manage',
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Role → Permission Matrix ──────────────────────────────────────────────────
// Used in seedDefaultRolesAndPermissions()

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const ADMIN_PERMISSIONS: PermissionSlug[] = [
    PERMISSIONS.ADMIN_DASHBOARD,
    PERMISSIONS.ADMIN_STATS,
    PERMISSIONS.ADMIN_USERS_VIEW,
    PERMISSIONS.ADMIN_USERS_MANAGE,
    PERMISSIONS.ADMIN_ROLES_VIEW,
    PERMISSIONS.ADMIN_ROLES_MANAGE,
    PERMISSIONS.ADMIN_TRACKING_VIEW,
    PERMISSIONS.MUSIC_VIEW,
    PERMISSIONS.MUSIC_TRACK_CREATE,
    PERMISSIONS.MUSIC_TRACK_UPDATE,
    PERMISSIONS.MUSIC_TRACK_DELETE,
    PERMISSIONS.MUSIC_ALBUM_CREATE,
    PERMISSIONS.MUSIC_ALBUM_UPDATE,
    PERMISSIONS.MUSIC_ALBUM_DELETE,
    PERMISSIONS.MUSIC_ARTIST_CREATE,
    PERMISSIONS.MUSIC_ARTIST_UPDATE,
    PERMISSIONS.MUSIC_ARTIST_DELETE,
    PERMISSIONS.MUSIC_PLAYLIST_SYSTEM,
    PERMISSIONS.FILM_VIEW,
    PERMISSIONS.FILM_MANAGE,
    PERMISSIONS.WHITEBOARD_VIEW,
    PERMISSIONS.WHITEBOARD_MANAGE,
];

export const ROLE_PERMISSION_MATRIX: Record<RoleSlug, PermissionSlug[]> = {
    [ROLES.SUPERADMIN]: ALL_PERMISSIONS as PermissionSlug[],

    [ROLES.ADMIN]: ADMIN_PERMISSIONS,

    [ROLES.MUSIC_MANAGER]: [
        PERMISSIONS.ADMIN_DASHBOARD,
        PERMISSIONS.ADMIN_STATS,
        PERMISSIONS.MUSIC_VIEW,
        PERMISSIONS.MUSIC_TRACK_CREATE,
        PERMISSIONS.MUSIC_TRACK_UPDATE,
        PERMISSIONS.MUSIC_TRACK_DELETE,
        PERMISSIONS.MUSIC_ALBUM_CREATE,
        PERMISSIONS.MUSIC_ALBUM_UPDATE,
        PERMISSIONS.MUSIC_ALBUM_DELETE,
        PERMISSIONS.MUSIC_ARTIST_CREATE,
        PERMISSIONS.MUSIC_ARTIST_UPDATE,
        PERMISSIONS.MUSIC_ARTIST_DELETE,
        PERMISSIONS.MUSIC_PLAYLIST_SYSTEM,
    ],

    [ROLES.MUSIC_ARTIST]: [
        PERMISSIONS.MUSIC_VIEW,
        PERMISSIONS.MUSIC_TRACK_CREATE,
        PERMISSIONS.MUSIC_TRACK_UPDATE,
        PERMISSIONS.MUSIC_ALBUM_CREATE,
        PERMISSIONS.MUSIC_ALBUM_UPDATE,
        PERMISSIONS.MUSIC_ARTIST_UPDATE, // own profile only - checked in service
    ],

    [ROLES.FILM_MANAGER]: [
        PERMISSIONS.ADMIN_DASHBOARD,
        PERMISSIONS.ADMIN_STATS,
        PERMISSIONS.FILM_VIEW,
        PERMISSIONS.FILM_MANAGE,
    ],

    [ROLES.FILM_MODERATOR]: [
        PERMISSIONS.FILM_VIEW,
    ],

    [ROLES.WHITEBOARD_MANAGER]: [
        PERMISSIONS.ADMIN_DASHBOARD,
        PERMISSIONS.WHITEBOARD_VIEW,
        PERMISSIONS.WHITEBOARD_MANAGE,
    ],

    [ROLES.USER]: [],
};

// ─── Admin-accessible roles (can access /admin panel) ─────────────────────────
export const ADMIN_ROLES: RoleSlug[] = [
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.MUSIC_MANAGER,
    ROLES.FILM_MANAGER,
    ROLES.WHITEBOARD_MANAGER,
];
