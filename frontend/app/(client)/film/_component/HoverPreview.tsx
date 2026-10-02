'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Play, Heart, Info } from 'lucide-react';
import { imgUrl, type HoverInfo } from '../_utils/music.util';
import {
    QueryClient,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { filmKeys } from '../_constants/film.keys';
import { FilmService } from '@/services';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { APP_ROUTES } from '@/constants/routes.constant';

interface HoverPreviewProps {
    info: HoverInfo | null;
    onEnter: () => void;
    onLeave: () => void;
}

export function HoverPreview({ info, onEnter, onLeave }: HoverPreviewProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isFavorited, setIsFavorited] = useState(false);

    const auth = useSelector((state: any) => state.auth);

    const handleMouseEnter = () => {
        onEnter();
    };

    const handleMouseLeave = () => {
        onLeave();
    };

    const goToDetail = () => {
        if (!info) return;
        router.push(APP_ROUTES.FILM.DETAIL(info.film.slug));
        onLeave();
    };

    const filmData = info?.film;

    const { data: favData } = useQuery({
        queryKey: filmData
            ? filmKeys.checkFavorite(filmData._id)
            : ['check-favorite', 'none'],
        queryFn: () => FilmService.checkFavorite(filmData!._id),
        enabled: !!filmData?._id && !!auth?.accessToken,
        select: (res: any) => res?.data?.favorited,
    });

    useEffect(() => {
        if (favData !== undefined) setIsFavorited(favData);
    }, [favData]);

    const toggleFavoriteMutation = useMutation({
        mutationFn: async () => {
            if (!auth?.accessToken || !filmData) return;
            await FilmService.toggleFavorite({
                externalFilmId: filmData._id,
                filmTitle: filmData.name,
                posterUrl: imgUrl(filmData.poster_url),
                filmSlug: filmData.slug,
                releaseYear: filmData.year,
            });
        },
        onSuccess: () => {
            if (filmData) {
                queryClient.invalidateQueries({
                    queryKey: filmKeys.favorites(),
                });
            }
            setIsFavorited((prev) => !prev);
        },
    });

    const handleFavorite = () => {
        toggleFavoriteMutation.mutate();
    };

    if (!info || typeof window === 'undefined') return null;

    const W = 420;
    const H = 330;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const centerX = info.rect.left + info.rect.width / 2;
    const centerY = info.rect.top + info.rect.height / 2;
    const left = Math.max(12, Math.min(centerX - W / 2, vw - W - 12));
    const top = Math.max(12, Math.min(centerY - H / 2, vh - H - 12));

    const originX = centerX - left;
    const originY = centerY - top;
    const transformOrigin = `${originX}px ${originY}px`;

    const voteScore =
        filmData?.imdb?.vote_average || filmData?.tmdb?.vote_average;

    return (
        <motion.div
            key={info.film.slug}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
                mass: 0.8,
            }}
            style={{
                position: 'fixed',
                top,
                left,
                width: W,
                height: H,
                zIndex: 9999,
                transformOrigin,
            }}
            className="group relative rounded-2xl overflow-hidden shadow-2xl shadow-black/90 bg-[#1a1e29] select-none flex flex-col justify-end"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                onClick={goToDetail}
                className="absolute inset-0 cursor-pointer z-0"
            >
                <Image
                    src={imgUrl(info.film.thumb_url || info.film.poster_url)}
                    alt={info.film.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-top pointer-events-none transition-transform duration-500"
                    onError={(e: any) => {
                        e.currentTarget.src = '/placeholder-film.jpg';
                    }}
                />
            </div>

            <div
                onClick={goToDetail}
                className="absolute inset-0 bg-gradient-to-t from-[#1a1e29] via-[#1a1e29]/95 via-35% to-transparent cursor-pointer z-[1]"
            />

            <div className="relative z-10 px-4 pb-4 pt-1 space-y-2.5 pointer-events-auto">
                <div
                    onClick={goToDetail}
                    className="cursor-pointer group/title"
                >
                    <h3 className="font-bold text-white text-[15px] leading-tight line-clamp-1 transition-colors">
                        {info.film.name}
                    </h3>
                    {info.film.origin_name && (
                        <p className="text-[12px] text-primary line-clamp-1 font-normal mt-0.5">
                            {info.film.origin_name}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                    <button
                        onClick={() => {
                            router.push(APP_ROUTES.FILM.WATCH(info.film.slug));
                            onLeave();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-primary hover:bg-primary/80 text-foreground font-bold text-[12px] rounded-lg transition-colors shadow-sm"
                    >
                        <Play className="w-3.5 h-3.5 fill-foreground" />
                        <span>Xem ngay</span>
                    </button>

                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={handleFavorite}
                        className={`flex items-center gap-1.5 py-1.5 px-3 font-semibold text-sm rounded-xl border transition-all ${
                            isFavorited
                                ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                                : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                        }`}
                    >
                        <Heart
                            className={`w-4 h-4 ${isFavorited ? 'fill-red-400' : ''}`}
                        />
                        {isFavorited ? 'Đã Thích' : 'Yêu Thích'}
                    </motion.button>

                    <button
                        onClick={goToDetail}
                        className="flex items-center gap-1.5 py-1.5 px-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-[12px] rounded-lg transition-colors"
                        title="Chi tiết"
                    >
                        <Info className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                    </button>

                    {info.film.trailer_url && (
                        <a
                            href={info.film.trailer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onLeave}
                            className="flex items-center gap-1.5 py-1.5 px-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium text-[12px] rounded-lg transition-colors shadow-sm"
                        >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Xem Trailer</span>
                        </a>
                    )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-white/70 pt-0.5">
                    {voteScore ? (
                        <div className="border border-[#f5c518] rounded px-1.5 py-0.2 flex items-center gap-1 text-[11px] text-white leading-tight">
                            <span className="text-[#f5c518] font-black">
                                IMDb
                            </span>
                            <span>{voteScore.toFixed(1)}</span>
                        </div>
                    ) : null}

                    {info.film.year && (
                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white/80">
                            {info.film.year}
                        </span>
                    )}

                    {(info.film.episode_current || info.film.time) && (
                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white/80">
                            {info.film.episode_current || info.film.time}
                        </span>
                    )}
                </div>

                {info.film.category?.length > 0 && (
                    <p className="text-sm text-white/60 line-clamp-1">
                        {info.film.category.map((c: any) => c.name).join(' • ')}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
