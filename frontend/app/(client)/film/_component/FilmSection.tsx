'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FavoriteCard, FavoriteCardSkeleton } from './cards/favorite.card';
import { FilmCard, FilmCardSkeleton } from './cards/film.card';
import { SeriesThumbCard, SeriesThumbCardSkeleton } from './cards/seriesThumb.card';
import { TopFilmCard, TopFilmCardSkeleton } from './cards/topFilm.card';
import { HistoryCard, HistoryCardSkeleton } from './cards/userFilm.card';
import { FilmCard as ClipPathCard, FilmCardSkeleton as ClipPathCardSkeleton } from './cards/clipPath.card';
import { SECTION_GRADIENTS, type HoverInfo } from '../_utils/music.util';
import { HoverPreview } from './HoverPreview';
import { FeaturedSlider } from './cards/featuredSlider.card';

interface FilmSectionProps {
    title: string;
    gradientKey: keyof typeof SECTION_GRADIENTS;
    films: any[];
    loading: boolean;
    viewAllHref?: string;
    cardType?:
    'normal' | 'top' | 'series' | 'history' | 'favorite' | 'featured' | 'clipPath';
    limit?: number;
    hoverDelay?: number;
    onItemRemove?: (id: string) => void;
}

export function FilmSection({
    title,
    gradientKey,
    films,
    loading,
    viewAllHref,
    cardType = 'normal',
    limit,
    hoverDelay = 500,
    onItemRemove,
}: FilmSectionProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const isDragging = useRef(false);
    const hasDragged = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, sl: 0 });
    const capturedPointerId = useRef<number | null>(null);

    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const showT = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideT = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelAll = useCallback(() => {
        if (showT.current) clearTimeout(showT.current);
        if (hideT.current) clearTimeout(hideT.current);
    }, []);

    const handleCardEnter = useCallback(
        (film: any, rect: DOMRect) => {
            cancelAll();
            showT.current = setTimeout(
                () => setHoverInfo({ film, rect }),
                hoverDelay,
            );
        },
        [cancelAll, hoverDelay],
    );

    const handleCardLeave = useCallback(() => {
        if (showT.current) clearTimeout(showT.current);
        hideT.current = setTimeout(() => setHoverInfo(null), 450);
    }, []);

    const handlePopupEnter = useCallback(() => cancelAll(), [cancelAll]);

    const handlePopupLeave = useCallback(() => {
        hideT.current = setTimeout(() => setHoverInfo(null), 300);
    }, []);

    useEffect(() => () => cancelAll(), [cancelAll]);

    const updateScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 8);
        setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateScroll, { passive: true });
        updateScroll();
        const ro = new ResizeObserver(() => updateScroll());
        ro.observe(el);

        return () => {
            el.removeEventListener('scroll', updateScroll);
            ro.disconnect();
        };
    }, [updateScroll, films]);

    const scroll = (dir: -1 | 1) =>
        scrollRef.current?.scrollBy({
            left:
                dir * (cardType === 'top' || cardType === 'series' ? 720 : 560),
            behavior: 'smooth',
        });

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return; // chỉ chuột trái
        isDragging.current = true;
        hasDragged.current = false;
        capturedPointerId.current = e.pointerId;
        dragStart.current = { x: e.clientX, y: e.clientY, sl: scrollRef.current?.scrollLeft ?? 0 };
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current || !scrollRef.current) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        if (!hasDragged.current) {
            if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
            hasDragged.current = true;
            if (capturedPointerId.current !== null) {
                try { scrollRef.current.setPointerCapture(capturedPointerId.current); } catch { }
            }
        }
        e.preventDefault();
        scrollRef.current.scrollLeft = dragStart.current.sl - dx;
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        if (hasDragged.current) {
            e.currentTarget.addEventListener(
                'click',
                (ev) => { ev.stopPropagation(); ev.preventDefault(); },
                { capture: true, once: true },
            );
        }
        hasDragged.current = false;
        capturedPointerId.current = null;
    };

    const grad = SECTION_GRADIENTS[gradientKey] ?? SECTION_GRADIENTS.new;
    const displayedFilms = limit ? films?.slice(0, limit) : films;

    const renderSkeletons = () => {
        const count = limit ?? 8;
        switch (cardType) {
            case 'history':
                return Array(count).fill(0).map((_, i) => <HistoryCardSkeleton key={i} />);
            case 'favorite':
                return Array(count).fill(0).map((_, i) => <FavoriteCardSkeleton key={i} />);
            case 'top':
                return Array(count).fill(0).map((_, i) => <TopFilmCardSkeleton key={i} />);
            case 'series':
                return Array(count).fill(0).map((_, i) => <SeriesThumbCardSkeleton key={i} />);
            case 'clipPath':
                return Array(count).fill(0).map((_, i) => <ClipPathCardSkeleton key={i} index={i} />);
            default:
                return Array(count).fill(0).map((_, i) => <FilmCardSkeleton key={i} />);
        }
    };

    const renderContent = () => {
        if (loading) {
            return renderSkeletons();
        }

        switch (cardType) {
            case 'top':
                return displayedFilms?.map((f, i) => (
                    <TopFilmCard
                        key={f._id || f.slug}
                        film={f}
                        rank={i + 1}
                        onEnter={handleCardEnter}
                        onLeave={handleCardLeave}
                    />
                ));

            case 'series':
                return displayedFilms?.map((f) => (
                    <SeriesThumbCard
                        key={f._id || f.slug}
                        film={f}
                        onEnter={handleCardEnter}
                        onLeave={handleCardLeave}
                    />
                ));

            case 'history':
                return displayedFilms?.map((item) => (
                    <HistoryCard
                        key={item.externalFilmId}
                        item={item}
                        onRemove={onItemRemove}
                    />
                ));

            case 'favorite':
                return displayedFilms?.map((item) => (
                    <FavoriteCard
                        key={item.id || item.externalFilmId}
                        item={item}
                    />
                ));

            case 'clipPath':
                return displayedFilms?.map((f, i) => (
                    <div
                        key={f._id || f.slug}
                        className="w-[200px] min-w-[200px] max-w-[200px] shrink-0"
                    >
                        <ClipPathCard
                            film={f}
                            index={i}
                            onEnter={handleCardEnter}
                            onLeave={handleCardLeave}
                        />
                    </div>
                ));

            case 'normal':
            default:
                return displayedFilms?.map((f) => (
                    <div
                        key={f._id || f.slug}
                        className="w-[150px] min-w-[150px] max-w-[150px] shrink-0"
                    >
                        <FilmCard
                            film={f}
                            onEnter={handleCardEnter}
                            onLeave={handleCardLeave}
                        />
                    </div>
                ));
        }
    };

    return (
        <section>
            <div className="flex items-center gap-2.5 mb-4 px-0.5">
                <h2
                    className={`text-[17px] font-extrabold bg-gradient-to-r ${grad} bg-clip-text`}
                    style={{
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent',
                    }}
                >
                    {title}
                </h2>

                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="mt-1 group relative flex items-center justify-end h-8 w-8 hover:w-[96px] overflow-hidden rounded-full bg-white/5 hover:bg-primary/20 border border-primary/40 hover:border-primary/40 text-white/50 hover:text-primary transition-all duration-300 shadow-sm"
                        title="Xem tất cả"
                    >
                        <span className="text-[11px] font-semibold whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 absolute left-2.5 ">
                            Xem tất cả
                        </span>

                        <div className="w-8 h-8 shrink-0 flex items-center justify-center text-primary pl-1">
                            <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                    </Link>
                )}
            </div>

            {cardType === 'featured' ? (
                loading ? (
                    <div className="w-full aspect-[26/9] min-h-[240px] sm:min-h-[290px] rounded-md bg-white/5 animate-pulse" />
                ) : (
                    <FeaturedSlider films={displayedFilms} />
                )
            ) : (
                <div className="relative">
                    <AnimatePresence>
                        {canLeft && !loading && (
                            <motion.button
                                key="arrow-left"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => scroll(-1)}
                                className="absolute left-0 top-1/2 z-20 -translate-y-[calc(50%+14px)] w-9 h-16 bg-primary/80 hover:bg-primary text-white rounded-r-xl border-r border-t border-b border-white/10 flex items-center justify-center transition-colors"
                                style={{ marginLeft: '-1px' }}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </motion.button>
                        )}
                        {canRight && !loading && (
                            <motion.button
                                key="arrow-right"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => scroll(1)}
                                className="absolute right-0 top-1/2 z-20 -translate-y-[calc(50%+14px)] w-9 h-16 bg-primary/80 hover:bg-primary text-white rounded-l-xl border-l border-t border-b border-white/10 flex items-center justify-center transition-colors"
                                style={{ marginRight: '-1px' }}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div
                        ref={scrollRef}
                        className="flex gap-2.5 overflow-x-auto pb-3 pt-1 cursor-grab active:cursor-grabbing select-none"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                        onDragStart={(e) => e.preventDefault()}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                    >
                        {renderContent()}
                    </div>
                </div>
            )}

            {cardType !== 'featured' && (
                <HoverPreview
                    info={hoverInfo}
                    onEnter={handlePopupEnter}
                    onLeave={handlePopupLeave}
                />
            )}
        </section>
    );
}
