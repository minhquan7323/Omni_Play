'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { imgUrl } from '../../_utils/music.util';

interface SeriesThumbCardProps {
    film: any;
    onClick?: () => void;
    onEnter?: (film: any, rect: DOMRect) => void;
    onLeave?: () => void;
}

export function SeriesThumbCard({
    film,
    onClick,
    onEnter,
    onLeave,
}: SeriesThumbCardProps) {
    const router = useRouter();
    const cardRef = useRef<HTMLDivElement>(null);

    const seasonText = film.tmdb?.season
        ? `Phần ${film.tmdb.season}`
        : 'Phần 1';
    const episodeCurrent =
        film.episode_current || (film.time ? film.time : 'Tập 1');

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            router.push(`/film/${film.slug}`);
        }
    };

    const handleMouseEnter = () => {
        if (!onEnter || !cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        onEnter(film, rect);
    };

    return (
        <div
            ref={cardRef}
            className="flex-shrink-0 w-[240px] sm:w-[270px] group cursor-pointer select-none"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onLeave}
        >
            <div className="relative aspect-[18/9] w-full rounded-md overflow-hidden bg-neutral-900 shadow-lg group-hover:border-white/30 transition-all duration-300">
                <Image
                    src={imgUrl(film.thumb_url || film.poster_url)}
                    alt={film.name}
                    fill
                    sizes="(max-width: 640px) 240px, 270px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e: any) => {
                        e.currentTarget.srcset = '';
                        e.target.src = '/placeholder-film.jpg';
                    }}
                    draggable={false}
                />
            </div>

            <div className="relative flex items-start gap-2.5 pt-1.5 px-1 pl-2">
                <div className="relative -mt-8 z-20 w-18 h-26 rounded-sm overflow-hidden shrink-0 bg-neutral-800">
                    <Image
                        src={imgUrl(film.poster_url)}
                        alt={film.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                        onError={(e: any) => {
                            e.currentTarget.srcset = '';
                            e.target.src = '/placeholder-film.jpg';
                        }}
                        draggable={false}
                    />
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                    <h3 className="text-xs text-foreground leading-snug truncate group-hover:text-primary transition-colors font-semibold">
                        {film.name}
                    </h3>

                    {film.origin_name && (
                        <p className="text-[10px] text-muted-foreground truncate font-normal">
                            {film.origin_name}
                        </p>
                    )}

                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-0.5 truncate">
                        {film.year && <span>{film.year}</span>}
                        <span>•</span>
                        <span>{seasonText}</span>
                        <span>•</span>
                        <span>{episodeCurrent}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SeriesThumbCardSkeleton() {
    return (
        <div className="flex-shrink-0 w-[240px] sm:w-[270px] animate-pulse">
            <div className="relative aspect-[18/9] w-full rounded-md bg-white/5" />
            <div className="relative flex items-start gap-2.5 pt-1.5 px-1 pl-2">
                <div className="relative -mt-8 z-20 w-[44px] h-[62px] rounded-sm bg-white/5 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-2.5 bg-white/5 rounded w-3/4" />
                    <div className="h-2 bg-white/5 rounded w-2/3" />
                </div>
            </div>
        </div>
    );
}
