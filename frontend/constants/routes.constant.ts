export const APP_ROUTES = {
    HOME: '/',
    LOGIN: '/auth/login',

    MUSIC: {
        HOME: '/music',
        NEW_RELEASES: '/music/new-releases',
        LYRIC: '/music/lyric',

        ARTIST: (id) => `/music/artist/${id}`,
        ALBUM: (id) => `/music/album/${id}`,
        TRACK: (id) => `/music/track/${id}`,
        PLAYLIST: (id) => `/music/playlist/${id}`,
    },

    FILM: {
        HOME: '/film',
        SEARCH: '/film/search',
        HISTORY: '/film/history',
        PLAYED: '/film/played',
        FAVORITES: '/film/favorites',

        DETAIL: (slug) => `/film/${slug}`,
        WATCH: (slug: string, ep: string | number = 1, server: number = 0) => `/film/${slug}/watch?ep=${ep}&server=${server}`,
    }

};