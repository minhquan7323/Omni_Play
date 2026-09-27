'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface MusicSectionProps {
    title: string;
    viewAllHref?: string;
    loading?: boolean;
    children: React.ReactNode;
    skeletonCount?: number;
    renderSkeleton?: () => React.ReactNode;
}

export function MusicSection({
    title,
    viewAllHref,
    loading = false,
    children,
    skeletonCount = 6,
    renderSkeleton,
}: MusicSectionProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 0);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        updateScrollState();
        el.addEventListener('scroll', updateScrollState, { passive: true });
        const ro = new ResizeObserver(updateScrollState);
        ro.observe(el);
        return () => { el.removeEventListener('scroll', updateScrollState); ro.disconnect(); };
    }, [updateScrollState]);

    useEffect(() => {
        if (!loading) setTimeout(updateScrollState, 100);
    }, [loading, updateScrollState]);

    const scroll = (dir: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === 'right' ? 600 : -600, behavior: 'smooth' });
    };

    return (
        <section className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-0.5">
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <div className="flex items-center gap-2">
                    {/* Scroll arrows */}
                    <div className="flex gap-1">
                        <button
                            onClick={() => scroll('left')}
                            disabled={!canLeft}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            disabled={!canRight}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    {viewAllHref && (
                        <Link
                            href={viewAllHref}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
                        >
                            Xem tất cả
                        </Link>
                    )}
                </div>
            </div>

            {/* Scroll container */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2"
                style={{ scrollbarWidth: 'none' }}
            >
                {loading
                    ? Array(skeletonCount)
                          .fill(0)
                          .map((_, i) =>
                              renderSkeleton ? (
                                  renderSkeleton()
                              ) : (
                                  <CardSkeleton key={i} />
                              ),
                          )
                    : children}
            </div>
        </section>
    );
}

// Default skeleton
function CardSkeleton() {
    return (
        <div className="flex-shrink-0 w-[160px] animate-pulse">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="mt-2 space-y-1.5">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2.5 bg-muted rounded w-1/2" />
            </div>
        </div>
    );
}
