'use client';

import { HEADER_HEIGHT } from '@/constants/layout.constant';
import { APP_ROUTES } from '@/constants/routes.constant';
import { FilmService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { FilmSection } from './_component/FilmSection';
import { HeroBanner } from './_component/HeroBanner';
import { filmKeys } from './_constants/film.keys';

export default function FilmPage() {
    const auth = useSelector((state: any) => state.auth)

    const { data: newMovies, isLoading: newLoading } = useQuery({
        queryKey: filmKeys.newMovies(),
        queryFn: () => FilmService.getNewMovies(1),
        select: (res: any) => res?.data?.items,
    });

    const { data: tvShows, isLoading: tvLoading } = useQuery({
        queryKey: filmKeys.tvShows(),
        queryFn: () => FilmService.getList({ type: 'phim-bo', page: 1 }),
        select: (res: any) => res?.data?.data?.items,
    });

    const { data: horrors, isLoading: horrorsLoading } = useQuery({
        queryKey: filmKeys.horrors(),
        queryFn: () => FilmService.getByCategory('kinh-di', 1),
        select: (res: any) => res?.data?.data?.items,
    });

    const { data: movies, isLoading: moviesLoading } = useQuery({
        queryKey: filmKeys.movies(),
        queryFn: () => FilmService.getList({ type: 'phim-le', page: 1 }),
        select: (res: any) => res?.data?.data?.items,
    });

    const { data: anime, isLoading: animeLoading } = useQuery({
        queryKey: filmKeys.anime(),
        queryFn: () => FilmService.search({ category: 'hoat-hinh', page: 1, limit: 10 }),
        select: (res: any) => res?.data?.data?.items,
    });

    const { data: countryVN, isLoading: countryVNLoading } = useQuery({
        queryKey: filmKeys.country('vn'),
        queryFn: () => FilmService.search({ country: 'viet-nam', page: 1 }),
        select: (res: any) => res?.data?.data?.items,
    });

    const { data: countryUS, isLoading: countryUSLoading } = useQuery({
        queryKey: filmKeys.country('us'),
        queryFn: () => FilmService.search({ country: 'au-my', page: 1 }),
        select: (res: any) => res?.data?.data?.items,
    });

    const { data: school, isLoading: schoolLoading } = useQuery({
        queryKey: filmKeys.school(),
        queryFn: () => FilmService.search({ category: 'hoc-duong', page: 1, limit: 10 }),
        select: (res: any) => res?.data?.data?.items,
    });

    const { data: history, isLoading: historyLoading } = useQuery({
        queryKey: filmKeys.history(),
        queryFn: FilmService.getHistory,
        select: (res: any) => res?.data,
        enabled: auth.isAuthenticated,
    });

    const { data: favorites, isLoading: favoritesLoading } = useQuery({
        queryKey: filmKeys.favorites(),
        queryFn: FilmService.getFavorites,
        select: (res: any) => res?.data,
        enabled: auth.isAuthenticated,
    });

    const hasHistory = auth.isAuthenticated && (historyLoading || (history && history.length > 0));
    const hasFavorites = auth.isAuthenticated && (favoritesLoading || (favorites && favorites.length > 0));

    return (
        <div className="max-w-screen-2xl mx-auto">
            <div
                className="w-full pb-8"
                style={{ marginTop: `-${HEADER_HEIGHT + 8}px` }}
            >
                <HeroBanner films={newMovies} loading={newLoading} />

                <div className="px-4 space-y-9 mt-4">
                    <FilmSection
                        title="🔥 Top Phim Nổi Bật"
                        gradientKey="top"
                        films={newMovies?.slice(0, 10)}
                        loading={newLoading}
                        viewAllHref={APP_ROUTES.FILM.SEARCH + '?sort=modified.time'}
                        cardType="top"
                    />

                    {hasHistory && (
                        <FilmSection
                            title="Xem Tiếp"
                            gradientKey="tv"
                            films={history}
                            loading={historyLoading}
                            cardType="history"
                        />
                    )}

                    {hasFavorites && (
                        <FilmSection
                            title="Yêu thích"
                            gradientKey="favorite"
                            films={favorites}
                            loading={favoritesLoading}
                            viewAllHref={APP_ROUTES.FILM.FAVORITES}
                            cardType="favorite"
                        />
                    )}

                    <FilmSection
                        title="Phim Kinh Dị"
                        gradientKey="new"
                        films={horrors}
                        loading={horrorsLoading}
                        viewAllHref={APP_ROUTES.FILM.SEARCH + '?category=kinh-di'}
                    />

                    <FilmSection
                        title="Hoạt Hình Anime Hay"
                        gradientKey="anime"
                        films={anime}
                        loading={animeLoading}
                        viewAllHref={APP_ROUTES.FILM.SEARCH + '?category=hoat-hinh'}
                        cardType="featured"
                    />

                    <FilmSection
                        title="Phim Việt Nam"
                        gradientKey="vn"
                        films={countryVN}
                        loading={countryVNLoading}
                        viewAllHref={APP_ROUTES.FILM.SEARCH + '?country=viet-nam'}
                        cardType="clipPath"
                    />

                    <FilmSection
                        title="Phim US - UK"
                        gradientKey="us"
                        films={countryUS}
                        loading={countryUSLoading}
                        viewAllHref={APP_ROUTES.FILM.SEARCH + '?country=au-my'}
                        cardType="clipPath"
                    />

                    <FilmSection
                        title="Phim Học Đường"
                        gradientKey="school"
                        films={school}
                        loading={schoolLoading}
                        viewAllHref={APP_ROUTES.FILM.SEARCH + '?category=hoc-duong'}
                        cardType="featured"
                    />

                    <FilmSection
                        title="Phim Chiếu Rạp"
                        gradientKey="movie"
                        films={movies}
                        loading={moviesLoading}
                        viewAllHref={APP_ROUTES.FILM.SEARCH + '?type=phim-le'}
                    />

                    <FilmSection
                        title="Phim Bộ"
                        gradientKey="tv"
                        films={tvShows}
                        loading={tvLoading}
                        viewAllHref={APP_ROUTES.FILM.SEARCH + '?type=phim-bo'}
                        cardType="series"
                    />
                </div>
            </div>
        </div>
    );
}
