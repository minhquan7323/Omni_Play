'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { FilmService } from '@/services';
import Link from 'next/link';
import { imgUrl } from '../../_utils/music.util';

interface FeaturedSliderProps {
    films: any[];
}

export function FeaturedSlider({ films = [] }: FeaturedSliderProps) {
    const router = useRouter();
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollRef = useRef<HTMLDivElement>(null);
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const isDragging = useRef(false);

    const currentFilm = films[selectedIndex] || films[0];

    const { data: detailData } = useQuery({
        queryKey: ['film-slider-detail', currentFilm?.slug],
        queryFn: () => FilmService.getDetail(currentFilm.slug),
        select: (res: any) => res?.data?.movie,
        enabled: !!currentFilm?.slug,
    });

    if (!films || films.length === 0) return null;

    const bannerImage = imgUrl(currentFilm.thumb_url);

    const seasonText = currentFilm.tmdb?.season
        ? `Phần ${currentFilm.tmdb.season}`
        : 'Phần 1';

    const episodeText =
        currentFilm.episode_current ||
        (currentFilm.time ? currentFilm.time : `${currentFilm.year || ''}`);

    const rawContent = detailData?.content || currentFilm.content || '';
    const cleanContent = rawContent
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        isDown.current = true;
        isDragging.current = false;
        startX.current = e.pageX - scrollRef.current.offsetLeft;
        scrollLeft.current = scrollRef.current.scrollLeft;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current || !scrollRef.current) return;
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = x - startX.current;

        if (Math.abs(walk) > 5) {
            isDragging.current = true;
            scrollRef.current.scrollLeft = scrollLeft.current - walk;
        }
    };

    const handleMouseUp = () => {
        isDown.current = false;
    };

    const handleSelectFilm = (idx: number) => {
        if (!isDragging.current) {
            setSelectedIndex(idx);
        }
    };

    return (
        <div className="relative w-full select-none">
            <div className="relative aspect-[26/9] min-h-[240px] sm:min-h-[290px] w-full rounded-md overflow-hidden bg-neutral-950 shadow-xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentFilm.slug}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                    >
                        <Image
                            src={bannerImage}
                            alt={currentFilm.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority
                            loading="eager"
                            className="object-cover object-center pointer-events-none"
                            onError={(e: any) => {
                                e.currentTarget.src = '/placeholder-film.jpg';
                            }}
                        />
                    </motion.div>
                </AnimatePresence>

                <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-black/95 via-black/65 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                <div className="absolute inset-y-0 left-0 z-10 flex flex-col justify-center px-6 sm:px-10 pb-4 max-w-lg">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentFilm.slug}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2 sm:space-y-2.5"
                        >
                            <div>
                                <h1 className="text-lg sm:text-2xl font-extrabold text-white leading-tight drop-shadow-md">
                                    {currentFilm.name}
                                </h1>
                                {currentFilm.origin_name && (
                                    <p className="text-[11px] sm:text-xs text-white/60 font-normal mt-0.5 truncate">
                                        {currentFilm.origin_name}
                                    </p>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-white/90">
                                {currentFilm.year && (
                                    <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">
                                        {currentFilm.year}
                                    </span>
                                )}
                                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">
                                    {seasonText}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15">
                                    {episodeText}
                                </span>
                            </div>

                            {cleanContent && (
                                <p className="text-xs text-white/70 line-clamp-3 leading-relaxed font-normal drop-shadow">
                                    {cleanContent}
                                </p>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    onClick={() =>
                                        router.push(
                                            `/film/${currentFilm.slug}/watch`,
                                        )
                                    }
                                    className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/80 text-foreground font-bold text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                                >
                                    <Play className="w-3.5 h-3.5 fill-foreground" />
                                    Xem ngay
                                </button>
                                <button
                                    onClick={() =>
                                        router.push(`/film/${currentFilm.slug}`)
                                    }
                                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs flex items-center gap-1.5 transition-colors"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                    Chi tiết
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="relative -mt-14 sm:-mt-16 z-20 w-full">
                <div
                    ref={scrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="flex items-center overflow-x-auto pt-6 pb-4 px-4 cursor-grab active:cursor-grabbing no-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <div className="flex items-center gap-3 sm:gap-4 mx-auto min-w-full justify-center w-fit">
                        {films.map((film, idx) => {
                            const isSelected = idx === selectedIndex;

                            return (
                                <div
                                    key={film.slug || film._id || idx}
                                    onClick={() => handleSelectFilm(idx)}
                                    className={`relative shrink-0 w-22 sm:w-26 aspect-[2/3] rounded-md overflow-hidden cursor-pointer transition-all duration-300 ${
                                        isSelected
                                            ? 'scale-110 -translate-y-2 border-2 border-primary ring-4 ring-primary/30 z-10'
                                            : 'border border-white/15 hover:scale-105'
                                    }`}
                                >
                                    <Image
                                        src={imgUrl(film.poster_url)}
                                        alt={film.name}
                                        fill
                                        sizes="(max-width: 640px) 96px, 112px"
                                        className="object-cover pointer-events-none"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
