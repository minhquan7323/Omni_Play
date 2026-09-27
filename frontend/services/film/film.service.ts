import privateApi from '../api/private.api';
import publicApi from '../api/public.api';

export interface FilmSearchParams {
    keyword?: string;
    search?: string;
    limit?: number;
    page?: number;
    category?: string;
    country?: string;
    year?: string | number;
    sort_field?: 'modified.time' | '_id' | 'year';
    sort_type?: 'desc' | 'asc';
    sort_lang?: 'vietsub' | 'thuyet-minh' | 'long-tieng';
    [key: string]: any;
}

export const FilmService = {
    getNewMovies: (page = 1) => publicApi.get(`/film/new?page=${page}`),
    getList: (params: Record<string, any>) =>
        publicApi.get('/film/list', { params }),
    getDetail: (slug: string) => publicApi.get(`/film/detail/${slug}`),
    search: (params: FilmSearchParams) => {
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(
                ([_, v]) => v !== undefined && v !== '',
            ),
        );
        return publicApi.get('/film/search', { params: cleanParams });
    },
    getCategories: () => publicApi.get('/film/categories'),
    getCountries: () => publicApi.get('/film/countries'),
    getByCategory: (slug: string, page = 1) =>
        publicApi.get(`/film/category/${slug}`, { params: { page } }),
    getByCountry: (slug: string, page = 1) =>
        publicApi.get(`/film/country/${slug}`, { params: { page } }),

    saveHistory: (data: {
        externalFilmId: string;
        filmSlug: string;
        filmTitle: string;
        posterUrl?: string;
        thumbUrl?: string;
        episodeSlug?: string;
        playbackPosition?: number;
        duration?: number;
        isCompleted?: boolean;
        episodeTitle?: string;
    }) => privateApi.post('/film/history', data),

    getHistory: () => privateApi.get('/film/history'),
    deleteHistory: (id: string) => privateApi.delete(`/film/history/${id}`),

    checkWatchHistory: (externalFilmId: string) =>
        privateApi.get(`/film/history/check/${externalFilmId}`),

    toggleFavorite: (data: {
        externalFilmId: string;
        filmTitle: string;
        posterUrl?: string;
        releaseYear?: number;
        filmSlug: string;
    }) => privateApi.post('/film/favorites/toggle', data),

    getFavorites: () => privateApi.get('/film/favorites'),

    deleteFavorite: (externalFilmId: string) =>
        privateApi.delete(`/film/favorites/${externalFilmId}`),

    checkFavorite: (externalFilmId: string) =>
        privateApi.get(`/film/favorites/check/${externalFilmId}`),
};
