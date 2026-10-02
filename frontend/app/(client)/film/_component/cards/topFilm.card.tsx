'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { imgUrl } from '../../_utils/music.util';

interface TopFilmCardProps {
    film: any;
    rank: number;
    onEnter?: (film: any, rect: DOMRect) => void;
    onLeave?: () => void;
}

const RANK_GRADIENTS: Record<number, string> = {
    1: 'from-amber-300 to-orange-500',
    2: 'from-slate-200 to-slate-400',
    3: 'from-amber-500 to-amber-700',
};

export function TopFilmCard({
    film,
    rank,
    onEnter,
    onLeave,
}: TopFilmCardProps) {
    const router = useRouter();
    const cardRef = useRef<HTMLDivElement>(null);
    const thumb = imgUrl(film.thumb_url || film.poster_url);
    const rankGrad = RANK_GRADIENTS[rank] ?? 'from-primary/80 to-violet-600';

    const handleMouseEnter = () => {
        if (!onEnter || !cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        onEnter(film, rect);
    };

    return (
        <div
            ref={cardRef}
            className="flex-shrink-0 w-[220px] sm:w-[250px] group cursor-pointer"
            onClick={() => router.push(`/film/${film.slug}`)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onLeave}
        >
            <div className="relative w-full aspect-video rounded-xl overflow-hidden duration-300">
                <Image
                    src={thumb}
                    alt={film.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e: any) => {
                        e.target.src = '/placeholder-film.jpg';
                    }}
                    draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <div className="absolute bottom-2 left-2">
                    <span
                        className={`text-[54px] italic font-black leading-none bg-gradient-to-b ${rankGrad} bg-clip-text text-transparent select-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]`}
                        style={{
                            WebkitTextStroke:
                                rank <= 3
                                    ? '1.5px rgba(0,0,0,0.5)'
                                    : '1px rgba(0,0,0,0.3)',
                        }}
                    >
                        {rank}
                    </span>
                </div>

                <div className="absolute bottom-2.5 right-2 left-16 sm:left-[68px]">
                    <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight drop-shadow-lg truncate">
                        {film.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                        {film.origin_name}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function TopFilmCardSkeleton() {
    return (
        <div className="flex-shrink-0 w-[220px] sm:w-[250px] animate-pulse">
            <div className="relative w-full aspect-video rounded-xl bg-white/5">
                <div className="absolute bottom-2 left-2 w-9 h-12 bg-white/5 rounded" />
                <div className="absolute bottom-2.5 right-2 left-16 space-y-1">
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-2.5 bg-white/5 rounded w-2/3" />
                </div>
            </div>
        </div>
    );
}
