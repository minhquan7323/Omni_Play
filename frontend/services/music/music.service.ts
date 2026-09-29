import privateApi from '../api/private.api';

export const MusicService = {
    //------------------------------------------------------------------ SEARCH ------------------------------------------------------------------

    searchTracks: async (options?: {
        page?: number;
        limit?: number;
        keyword?: string;
    }) => {
        const params = new URLSearchParams();
        if (options?.page) params.set('page', options.page.toString());
        if (options?.limit) params.set('limit', options.limit.toString());
        if (options?.keyword) params.set('keyword', options.keyword.toString());
        return privateApi.get(
            `/music/search` +
                (params.toString() ? `?${params.toString()}` : ''),
        );
    },

    //------------------------------------------------------------------ CONTENT ------------------------------------------------------------------

    getNewReleases: async () => {
        return privateApi.get('/music/albums/new-releases');
    },

    getPopularArtists: async () => {
        return privateApi.get('/music/artists/popular');
    },

    getTrendingTracks: async () => {
        return privateApi.get('/music/tracks/trending');
    },

    //------------------------------------------------------------------ LIBRARY ------------------------------------------------------------------

    toggleLibraryItem: async (type: string, itemId: string) => {
        return privateApi.post('/music/library/toggle', { type, itemId });
    },

    checkLibraryItem: async (type: string, itemId: string) => {
        return privateApi.get(
            `/music/library/check?type=${type}&itemId=${itemId}`,
        );
    },

    //------------------------------------------------------------------ PLAYLIST ------------------------------------------------------------------

    createPlaylist: async (data: any) => {
        return privateApi.post('/music/playlist', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    updatePlaylist: async (id: string, data: any) => {
        return privateApi.patch(`/music/playlist/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    deletePlaylist: async (id: string) => {
        return privateApi.delete(`/music/playlist/${id}`);
    },

    getUserPlaylists: async (type?: string) => {
        return privateApi.get(
            '/music/library/playlists' + (type ? `?type=${type}` : ''),
        );
    },

    getPlaylistDetail: async (id: string) => {
        return privateApi.get(`/music/playlist/${id}`);
    },

    //------------------------------------------------------------------ ARTIST ------------------------------------------------------------------

    getArtistDetail: async (id: string) => {
        return privateApi.get(`/music/artist/${id}`);
    },

    getArtistRadio: async (artistId: string, limit?: number) => {
        return privateApi.get(
            `/music/artist/${artistId}/radio` +
                (limit ? `?limit=${limit}` : ''),
        );
    },

    getArtistAlbums: async (
        artistId: string,
        query?: { page?: number; limit?: number },
    ) => {
        const params = new URLSearchParams();
        if (query?.page) params.set('page', query.page.toString());
        if (query?.limit) params.set('limit', query.limit.toString());
        return privateApi.get(
            `/music/artist/${artistId}/albums` +
                (params.toString() ? `?${params.toString()}` : ''),
        );
    },

    createArtist: async (data: any) => {
        return privateApi.post('/music/cms/artist', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    deleteArtist: async (id: string) => {
        return privateApi.delete(`/music/cms/artist/${id}`);
    },

    updateArtist: async (id: string, data: any) => {
        return privateApi.patch(`/music/cms/artist/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    //------------------------------------------------------------------ ALBUM ------------------------------------------------------------------

    getAlbumDetail: async (id: string) => {
        return privateApi.get(`/music/album/${id}`);
    },

    deleteAlbum: async (id: string) => {
        return privateApi.delete(`/music/cms/album/${id}`);
    },

    updateAlbum: async (id: string, data: any) => {
        return privateApi.patch(`/music/cms/album/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    createAlbum: async (data: any) => {
        return privateApi.post('/music/cms/album', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    //------------------------------------------------------------------ TRACK ------------------------------------------------------------------

    getTrackDetail: async (id: string) => {
        return privateApi.get(`/music/track/${id}`);
    },

    getTrackLyric: async (trackId: string) => {
        return privateApi.get(`/music/track/${trackId}/lyric`);
    },

    createTrack: async (data: any) => {
        return privateApi.post('/music/cms/track', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    deleteTracks: async (ids: string[]) => {
        return privateApi.delete(`/music/cms/tracks`, { data: { ids } });
    },

    updateTrack: async (id: string, data: any) => {
        return privateApi.patch(`/music/cms/track/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};
