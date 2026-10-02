'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { imgUrl } from '../_utils/music.util';

interface HeroBannerProps {
    films: any[];
    loading?: boolean;
}

function HeroBannerSkeleton() {
    return (
        <div className="relative w-full h-[480px] sm:h-[540px] lg:h-[600px] overflow-hidden bg-black/40 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b1120]/90 via-[#0b1120]/40 to-transparent" />

            <div className="absolute inset-0 flex items-end p-6 sm:p-10 lg:p-14">
                <div className="w-full max-w-xl space-y-4">
                    <div className="space-y-2.5">
                        <div className="h-9 sm:h-11 w-4/5 rounded-xl bg-white/15" />
                        <div className="h-9 sm:h-11 w-1/2 rounded-xl bg-white/10" />
                    </div>

                    <div className="h-4 w-48 rounded-md bg-white/10" />

                    <div className="flex items-center gap-3 pt-2">
                        <div className="h-11 w-32 rounded-xl bg-primary" />
                        <div className="h-11 w-28 rounded-xl bg-white/10" />
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 right-8 flex items-center gap-1.5">
                <div className="w-6 h-1.5 rounded-full bg-primary" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            </div>
        </div>
    );
}

export function HeroBanner({ films, loading }: HeroBannerProps) {
    const [idx, setIdx] = useState(0);
    const router = useRouter();
    const timer = useRef<any>(null);
    const heroFilms = films?.slice(0, 6) || [];

    const startAuto = useCallback(() => {
        clearInterval(timer.current);
        if (!heroFilms.length) return;
        timer.current = setInterval(
            () => setIdx((i) => (i + 1) % heroFilms.length),
            5500,
        );
    }, [heroFilms.length]);

    useEffect(() => {
        startAuto();
        return () => clearInterval(timer.current);
    }, [startAuto]);

    const goTo = (i: number) => {
        setIdx(i);
        startAuto();
    };

    if (loading || !heroFilms.length) {
        return <HeroBannerSkeleton />;
    }

    const film = heroFilms[idx];

    return (
        <div className="relative w-full h-[480px] sm:h-[540px] lg:h-[600px] overflow-hidden group select-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.65 }}
                    className="absolute inset-0"
                >
                    <Image
                        src={imgUrl(film.thumb_url || film.poster_url)}
                        alt={film.name}
                        fill
                        priority
                        loading="eager"
                        className="object-cover object-center"
                        onError={(e: any) => {
                            e.target.src = '/placeholder-film.jpg';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-black/70" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/95 via-[#070b14]/40 to-transparent" />
                </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 flex items-end p-6 sm:p-10 lg:p-14">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="max-w-xl z-10"
                    >
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-2 leading-tight tracking-tight drop-shadow-md line-clamp-2">
                            {film.name}
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-300 mb-6 font-medium drop-shadow">
                            {film.origin_name}
                            {film.year ? ` · ${film.year}` : ''}
                            {film.episode_current
                                ? ` · ${film.episode_current}`
                                : ''}
                        </p>

                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() =>
                                    router.push(`/film/${film.slug}/watch`)
                                }
                                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-foreground font-bold text-xs sm:text-sm rounded-xl transition-all"
                            >
                                <Play className="w-4 h-4 fill-foreground" /> Xem
                                Ngay
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() =>
                                    router.push(`/film/${film.slug}`)
                                }
                                className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/15 transition-all"
                            >
                                <Info className="w-4 h-4" /> Chi Tiết
                            </motion.button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="absolute bottom-6 right-8 flex items-center gap-1.5 z-10">
                {heroFilms.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i)}
                        aria-label={`Slide ${i + 1}`}
                        className={`rounded-full transition-all duration-300 ${
                            i === idx
                                ? 'w-6 h-1.5 bg-primary shadow-md'
                                : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                        }`}
                    />
                ))}
            </div>

            <button
                onClick={() =>
                    goTo((idx - 1 + heroFilms.length) % heroFilms.length)
                }
                aria-label="Slide trước"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10 z-10"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={() => goTo((idx + 1) % heroFilms.length)}
                aria-label="Slide tiếp theo"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10 z-10"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    );
}
