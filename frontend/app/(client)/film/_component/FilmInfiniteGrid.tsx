'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Film, Loader2, PackageOpen } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HoverPreview } from './HoverPreview';
import type { HoverInfo } from '../_utils/music.util';
import { FilmFetchMode, useInfiniteFilms } from '../_hooks/useInfiniteFilms';
import { FilmCard, FilmCardSkeleton } from './cards/film.card';

function LoadMoreSentinel({ onVisible }: { onVisible: () => void }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) onVisible();
            },
            { rootMargin: '300px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [onVisible]);

    return <div ref={ref} className="h-1 w-full" aria-hidden="true" />;
}

interface FilmInfiniteGridProps {
    fetchMode: FilmFetchMode;
    filterFn?: (film: any) => boolean;
    emptyMessage?: string;
    emptyAction?: React.ReactNode;
    showCount?: boolean;
    hoverDelay?: number;
    onTitleLoaded?: (title: string) => void;
}

export default function FilmInfiniteGrid({
    fetchMode,
    filterFn,
    emptyMessage = 'Không tìm thấy phim nào',
    emptyAction,
    showCount = true,
    hoverDelay = 500,
    onTitleLoaded,
}: FilmInfiniteGridProps) {
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        isError,
    } = useInfiniteFilms(fetchMode);

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

    useEffect(() => {
        const pageTitle = data?.pages?.[0]?.title;
        if (pageTitle && onTitleLoaded) {
            onTitleLoaded(pageTitle);
        }
    }, [data?.pages, onTitleLoaded]);

    const handleCardLeave = useCallback(() => {
        if (showT.current) clearTimeout(showT.current);
        hideT.current = setTimeout(() => setHoverInfo(null), 400);
    }, []);

    const handlePopupEnter = useCallback(() => cancelAll(), [cancelAll]);
    const handlePopupLeave = useCallback(() => {
        hideT.current = setTimeout(() => setHoverInfo(null), 300);
    }, []);

    useEffect(() => () => cancelAll(), [cancelAll]);

    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const uniqueFilms = useMemo(() => {
        const seen = new Set<string>();
        const list: any[] = [];

        for (const page of data?.pages ?? []) {
            for (const item of page.items ?? []) {
                const key = item._id || item.slug;
                if (key && !seen.has(key)) {
                    seen.add(key);
                    list.push(item);
                } else if (!key) {
                    list.push(item);
                }
            }
        }
        return list;
    }, [data?.pages]);

    const filteredFilms = useMemo(() => {
        return filterFn ? uniqueFilms.filter(filterFn) : uniqueFilms;
    }, [uniqueFilms, filterFn]);

    const totalItems = data?.pages?.[0]?.totalItems ?? filteredFilms.length;

    if (isLoading) {
        return (
            <div className="space-y-6">
                {showCount && (
                    <div className="h-4 w-32 bg-muted/40 rounded animate-pulse" />
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                    {Array.from({ length: 18 }).map((_, i) => (
                        <FilmCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-24 bg-card/20 rounded-2xl border border-border/40">
                <Film className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm font-medium">
                    Có lỗi xảy ra khi tải danh sách phim. Vui lòng thử lại sau.
                </p>
            </div>
        );
    }

    if (filteredFilms.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 space-y-3 bg-card/20 rounded-2xl border border-border/40"
            >
                <PackageOpen className="w-14 h-14 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground text-sm font-medium">
                    {emptyMessage}
                </p>
                {emptyAction}
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            {showCount && totalItems > 0 && (
                <p className="text-sm text-muted-foreground">
                    Tìm thấy{' '}
                    <span className="text-foreground font-semibold">
                        {totalItems.toLocaleString()}
                    </span>{' '}
                    phim
                </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredFilms.map((film: any, i: number) => (
                        <FilmCard
                            key={`${film._id || film.slug || 'film'}-${i}`}
                            film={film}
                            onEnter={handleCardEnter}
                            onLeave={handleCardLeave}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {hasNextPage && <LoadMoreSentinel onVisible={loadMore} />}

            <AnimatePresence>
                {isFetchingNextPage && (
                    <motion.div
                        key="loading-more"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-2 py-8"
                    >
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <p className="text-xs text-muted-foreground">
                            Đang tải thêm phim…
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {!hasNextPage && filteredFilms.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-3 py-10"
                >
                    <div className="h-px flex-1 bg-border/40" />
                    <p className="text-xs text-muted-foreground/60 px-3 font-medium">
                        Đã hiển thị tất cả{' '}
                        {filteredFilms.length.toLocaleString()} phim
                    </p>
                    <div className="h-px flex-1 bg-border/40" />
                </motion.div>
            )}

            <HoverPreview
                info={hoverInfo}
                onEnter={handlePopupEnter}
                onLeave={handlePopupLeave}
            />
        </div>
    );
}
