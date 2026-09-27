'use client';

import { FilmService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { HeartCrack } from 'lucide-react';
import Link from 'next/link';
import { FavoriteCard, FavoriteCardSkeleton } from '../_component/cards/favorite.card';
import { filmKeys } from '../_constants/film.keys';

export default function FavoritesPage() {

    const { data: favorites, isLoading } = useQuery({
        queryKey: filmKeys.favorites(),
        queryFn: () => FilmService.getFavorites(),
        select: (res: any) => res?.data,
    });

    return (
        <div className="max-w-screen-2xl mx-auto px-4 pb-12 pt-6 min-h-[60vh]">
            <h1 className="text-2xl font-bold text-white mb-6">Phim Yêu Thích</h1>

            {isLoading ? (
                <div className="flex flex-wrap gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <FavoriteCardSkeleton key={i} />
                    ))}
                </div>
            ) : favorites?.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                    {favorites.map((item: any) => (
                        <FavoriteCard
                            key={item._id || item.id || item.externalFilmId}
                            item={item}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-4">
                    <HeartCrack className="w-16 h-16 opacity-20" />
                    <p className="text-sm font-medium text-white/60">Bạn chưa có phim yêu thích nào.</p>
                    <Link
                        href="/film"
                        className="px-6 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors"
                    >
                        Khám phá phim ngay
                    </Link>
                </div>
            )}
        </div>
    );
}
