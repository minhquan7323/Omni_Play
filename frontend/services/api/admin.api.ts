import privateApi from './private.api';

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const adminApi = {
    getDashboardStats: () => privateApi.get('/admin/stats'),

    // ─── Users ────────────────────────────────────────────────────────────────
    getUsers: (params?: { search?: string; status?: string; page?: number; limit?: number }) =>
        privateApi.get('/admin/users', { params }),
    getUserById: (id: string) => privateApi.get(`/admin/users/${id}`),
    updateUserStatus: (id: string, status: string) =>
        privateApi.patch(`/admin/users/${id}/status`, { status }),
    assignRole: (userId: string, roleId: string, scope?: string) =>
        privateApi.post(`/admin/users/${userId}/roles`, { roleId, scope }),
    removeRole: (userId: string, roleId: string, scope?: string) =>
        privateApi.delete(`/admin/users/${userId}/roles/${roleId}`, { params: { scope } }),

    // ─── Roles & Permissions ──────────────────────────────────────────────────
    getRoles: () => privateApi.get('/admin/roles'),
    createRole: (data: { slug: string; name: string; description?: string; scope?: string }) =>
        privateApi.post('/admin/roles', data),
    updateRole: (roleId: string, data: { name?: string; description?: string }) =>
        privateApi.patch(`/admin/roles/${roleId}`, data),
    deleteRole: (roleId: string) => privateApi.delete(`/admin/roles/${roleId}`),
    getPermissions: () => privateApi.get('/admin/permissions'),
    createPermission: (data: { slug: string; name: string; scope: string; description?: string }) =>
        privateApi.post('/admin/permissions', data),
    assignPermission: (roleId: string, permissionId: string) =>
        privateApi.post(`/admin/roles/${roleId}/permissions/${permissionId}`, {}),
    removePermission: (roleId: string, permissionId: string) =>
        privateApi.delete(`/admin/roles/${roleId}/permissions/${permissionId}`),

    // ─── Music ────────────────────────────────────────────────────────────────
    getMusicStats: () => privateApi.get('/admin/music/stats'),
    getTracks: (params?: { search?: string; page?: number; limit?: number }) =>
        privateApi.get('/admin/music/tracks', { params }),
    updateTrack: (id: string, data: { title?: string; duration?: number; genre?: string; thumbnailUrl?: string }) =>
        privateApi.patch(`/admin/music/tracks/${id}`, data),
    deleteTrack: (id: string) => privateApi.delete(`/admin/music/tracks/${id}`),
    getAlbums: (params?: { search?: string; page?: number; limit?: number }) =>
        privateApi.get('/admin/music/albums', { params }),
    updateAlbum: (id: string, data: { name?: string; description?: string; image?: string; releaseYear?: number }) =>
        privateApi.patch(`/admin/music/albums/${id}`, data),
    deleteAlbum: (id: string) => privateApi.delete(`/admin/music/albums/${id}`),
    getArtists: (params?: { search?: string; page?: number; limit?: number }) =>
        privateApi.get('/admin/music/artists', { params }),
    updateArtist: (id: string, data: { name?: string; bio?: string; image?: string }) =>
        privateApi.patch(`/admin/music/artists/${id}`, data),
    deleteArtist: (id: string) => privateApi.delete(`/admin/music/artists/${id}`),

    // ─── Film ─────────────────────────────────────────────────────────────────
    getFilmStats: () => privateApi.get('/admin/film/stats'),
    getWatchHistories: (params?: { search?: string; page?: number; limit?: number }) =>
        privateApi.get('/admin/film/watch-histories', { params }),

    // ─── Tracking ─────────────────────────────────────────────────────────────
    getTrackingLogs: (params?: { userId?: string; action?: string; module?: string; page?: number; limit?: number }) =>
        privateApi.get('/admin/tracking/logs', { params }),
    getTrackingStats: () => privateApi.get('/admin/tracking/stats'),

    // ─── Whiteboard ───────────────────────────────────────────────────────────
    getWhiteboards: (params?: { search?: string; page?: number; limit?: number }) =>
        privateApi.get('/admin/whiteboards', { params }),
    updateWhiteboard: (boardId: string, data: { name?: string; isPrivate?: boolean }) =>
        privateApi.patch(`/admin/whiteboards/${boardId}`, data),
    deleteWhiteboard: (boardId: string) => privateApi.delete(`/admin/whiteboards/${boardId}`),

    // ─── Seed ─────────────────────────────────────────────────────────────────
    seed: () => privateApi.post('/admin/seed', {}),
};

export default adminApi;
