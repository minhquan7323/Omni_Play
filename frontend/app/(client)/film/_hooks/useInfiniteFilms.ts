import { useInfiniteQuery } from '@tanstack/react-query';
import { FilmService } from '@/services';
import type { FilmSearchParams } from '@/services/film/film.service';
export type FilmFetchMode = { 
    mode: 'search'
    filters: FilmSearchParams 
};

interface FilmPage {
    items: any[];
    totalPages: number;
    totalItems: number;
    title?: string;
    currentPage: number;
}

function parseResponse(res: any, page: number): FilmPage {
    const dataObj = res?.data?.data || res?.data || {};
    const pagination = dataObj?.params?.pagination || dataObj?.pagination;
    return {
        items: dataObj?.items || [],
        totalPages: pagination?.totalPages ?? 1,
        totalItems: pagination?.totalItems ?? (dataObj?.items?.length || 0),
        title: dataObj?.titlePage || dataObj?.seoOnPage?.titleHead || '',
        currentPage: page,
    };
}

export function useInfiniteFilms(fetchMode: FilmFetchMode) {
    const queryKey = ['infinite-films', fetchMode];

    return useInfiniteQuery<FilmPage>({
        queryKey,
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1 }) => {
            const page = pageParam as number;
            let res: any;

            if (fetchMode.mode === 'search') {
                const {
                    q,
                    keyword,
                    search,
                    sortField,
                    sortType,
                    limit = 24,
                    ...restFilters
                } = fetchMode.filters;

                const searchParams: FilmSearchParams = {
                    ...restFilters,
                    keyword: keyword || search || q || '',
                    sort_field: (sortField || restFilters.sort_field) as FilmSearchParams['sort_field'],
                    sort_type: (sortType || restFilters.sort_type) as FilmSearchParams['sort_type'],
                    sort_lang: restFilters.sort_lang as FilmSearchParams['sort_lang'],
                    limit,
                    page,
                };

                res = await FilmService.search(searchParams);
            }

            return parseResponse(res, page);
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.currentPage < lastPage.totalPages) {
                return lastPage.currentPage + 1;
            }
            return undefined;
        },
    });
}