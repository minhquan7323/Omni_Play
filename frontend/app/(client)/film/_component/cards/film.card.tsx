'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { imgUrl } from '../../_utils/music.util';

interface FilmCardProps {
    film: any;
    onEnter: (film: any, rect: DOMRect) => void;
    onLeave: () => void;
    className?: string;
}

export function FilmCard({
    film,
    onEnter,
    onLeave,
    className = 'w-full',
}: FilmCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (ref.current) {
            onEnter(film, ref.current.getBoundingClientRect());
        }
    };

    return (
        <div
            ref={ref}
            className={`group select-none ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onLeave}
        >
            <Link href={`/film/${film.slug}`} className="block">
                <div className="aspect-[2/3] w-full relative rounded-lg overflow-hidden bg-muted/20 border border-white/5 shadow-sm transition-all duration-300 group-hover:shadow-md">
                    <Image
                        src={imgUrl(film?.poster_url || film.thumb_url)}
                        alt={film.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e: any) => {
                            e.currentTarget.srcset = '';
                            e.target.src = '/placeholder-film.jpg';
                        }}
                        draggable={false}
                    />

                    {film.episode_current && (
                        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-black/75 backdrop-blur-sm text-white text-[10px] font-semibold rounded-md max-w-[80px] truncate shadow">
                            {film.episode_current}
                        </span>
                    )}
                </div>

                <div className="mt-2 px-0.5">
                    <p
                        className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate"
                        title={film.name}
                    >
                        {film.name}
                    </p>
                    <p
                        className="text-muted-foreground text-[11px] truncate mt-0.5"
                        title={film.origin_name}
                    >
                        {film.origin_name || film.year || 'Đang cập nhật'}
                    </p>
                </div>
            </Link>
        </div>
    );
}

export function FilmCardSkeleton() {
    return (
        <div className="flex-shrink-0 w-[148px] animate-pulse">
            <div className="aspect-[2/3] rounded-xl bg-white/5" />
            <div className="mt-2 h-3 bg-white/5 rounded w-3/4" />
            <div className="mt-1 h-2 bg-white/5 rounded w-1/2" />
        </div>
    );
}
