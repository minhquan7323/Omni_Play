export const filmKeys = {
    all: ['film'],

    search: (keyword: string) => [...filmKeys.all, 'search', keyword],
    categories: () => [...filmKeys.all, 'categories'],
    countries: () => [...filmKeys.all, 'countries'],

    newMovies: () => [...filmKeys.all, 'new-movies'],
    tvShows: () => [...filmKeys.all, 'tv-shows'],
    horrors: () => [...filmKeys.all, 'horrors'],
    movies: () => [...filmKeys.all, 'movies'],
    anime: () => [...filmKeys.all, 'anime'],
    school: () => [...filmKeys.all, 'school'],
    history: () => [...filmKeys.all, 'history'],
    favorites: () => [...filmKeys.all, 'favorites'],
    country: (country: string) => [...filmKeys.all, 'country', country],

    checkFavorite: (id: string) => [...filmKeys.all, 'check-favorite', id],
    checkHistory: (id: string) => [...filmKeys.all, 'check-history', id],

    detail: (slug: string) => [...filmKeys.all, 'detail', slug],

};