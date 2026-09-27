export const adminKeys = {
    all: ['admin'],

    adminTracks: ({ search, page }: { search?: string; page?: number }) => [...adminKeys.all, 'admin-tracks', search, page],
    adminAlbums: ({ search, page }: { search?: string; page?: number }) => [...adminKeys.all, 'admin-albums', search, page],
    adminArtists: ({ search, page }: { search?: string; page?: number }) => [...adminKeys.all, 'admin-artists', search, page],
    adminGenres: ({ search, page }: { search?: string; page?: number }) => [...adminKeys.all, 'admin-genres', search, page],
    adminPlaylists: ({ search, page }: { search?: string; page?: number }) => [...adminKeys.all, 'admin-playlists', search, page],
    adminRadios: ({ search, page }: { search?: string; page?: number }) => [...adminKeys.all, 'admin-radios', search, page],
    adminSongs: ({ search, page }: { search?: string; page?: number }) => [...adminKeys.all, 'admin-songs', search, page],
    adminUsers: ({ search, page }: { search?: string; page?: number }) => [...adminKeys.all, 'admin-users', search, page],

    searchSelect: ({ label, page }: { label?: string; page?: number }) => [...adminKeys.all, 'admin-search-select', label, page],

};