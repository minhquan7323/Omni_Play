export const musicKeys = {
    all: ['music'],

    albumDetail: (id: string) => [...musicKeys.all, 'album', id],
    artistDetail: (id: string) => [...musicKeys.all, 'artist', id],
    artistRadio: (id: string) => [...musicKeys.all, 'artist-radio', id],
    playlistDetail: (id: string) => [...musicKeys.all, 'playlist', id],
    artistAlbums: (id: string) => [...musicKeys.all, 'artist-albums', id],

    userPlaylists: (type?: string) => [...musicKeys.all, 'user-playlists', type || 'all'],
    favoriteTracks: () => [...musicKeys.all, 'favorite-tracks'],
    checkLibraryItem: (type: string, id: string) => [...musicKeys.all, 'check-library-item', type, id],


    trendingTracks: () => [...musicKeys.all, 'trending-tracks'],
    newReleases: () => [...musicKeys.all, 'new-releases'],
    popularArtists: () => [...musicKeys.all, 'popular-artists'],
    trackLyric: (id: string) => [...musicKeys.all, 'track-lyric', id],
};