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
    index?: number;
}

export function FilmCard({
    film,
    onEnter,
    onLeave,
    className = 'w-full',
    index = 0,
}: FilmCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (ref.current) {
            onEnter(film, ref.current.getBoundingClientRect());
        }
    };

    const isEven = index % 2 === 0;
    const maskId = `mask-card-${film?.slug || index}`;

    const polyPoints = isEven
        ? "0.03,0.03 0.97,0.12 0.97,0.97 0.03,0.97"
        : "0.03,0.12 0.97,0.03 0.97,0.97 0.03,0.97";

    return (
        <div
            ref={ref}
            className={`group select-none ${className}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onLeave}
        >
            <svg width="0" height="0" className="absolute pointer-events-none">
                <defs>
                    <mask id={maskId} maskContentUnits="objectBoundingBox">
                        <polygon
                            points={polyPoints}
                            fill="white"
                            stroke="white"
                            strokeWidth="0.06"
                            strokeLinejoin="round"
                        />
                    </mask>
                </defs>
            </svg>

            <Link href={`/film/${film.slug}`} className="block">
                <div
                    className="aspect-[2/3] w-full relative overflow-hidden bg-muted/20 border border-white/5 shadow-sm transition-all duration-300 group-hover:shadow-md"
                    style={{
                        WebkitMask: `url(#${maskId})`,
                        mask: `url(#${maskId})`
                    }}
                >
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

export function FilmCardSkeleton({ index = 0 }: { index?: number }) {
    const isEven = index % 2 === 0;
    const maskId = `mask-skel-${index}`;

    const polyPoints = isEven
        ? "0.03,0.03 0.97,0.12 0.97,0.97 0.03,0.97"
        : "0.03,0.12 0.97,0.03 0.97,0.97 0.03,0.97";

    return (
        <div className="flex-shrink-0 w-[196px] animate-pulse relative">
            <svg width="0" height="0" className="absolute pointer-events-none">
                <defs>
                    <mask id={maskId} maskContentUnits="objectBoundingBox">
                        <polygon
                            points={polyPoints}
                            fill="white"
                            stroke="white"
                            strokeWidth="0.06"
                            strokeLinejoin="round"
                        />
                    </mask>
                </defs>
            </svg>
            <div
                className="aspect-[2/3] bg-white/5"
                style={{
                    WebkitMask: `url(#${maskId})`,
                    mask: `url(#${maskId})`
                }}
            />
            <div className="mt-2 h-3 bg-white/5 rounded w-3/4" />
            <div className="mt-1 h-2 bg-white/5 rounded w-1/2" />
        </div>
    );
}
