'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { fmtSeconds, imgUrl, progressPercent } from '../../_utils/music.util';
import { APP_ROUTES } from '@/constants/routes.constant';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FilmService } from '@/services';
import { filmKeys } from '../../_constants/film.keys';
import { toast } from 'sonner';

interface HistoryItem {
    id?: string;
    _id?: string;
    externalFilmId: string;
    filmSlug?: string;
    filmTitle: string;
    posterUrl?: string | null;
    episodeSlug?: string | null;
    episodeTitle?: string | null;
    playbackPosition?: number;
    duration?: number;
    isCompleted?: boolean;
}

interface HistoryCardProps {
    item: HistoryItem;
    onRemove?: (id: string) => void;
}

export function HistoryCard({ item, onRemove }: HistoryCardProps) {
    const queryClient = useQueryClient();

    const cardRef = useRef<HTMLDivElement>(null);
    const progress = progressPercent(item.playbackPosition, item.duration);
    const posStr = fmtSeconds(item.playbackPosition);
    const durStr = fmtSeconds(item.duration);

    const statusLabel = item.isCompleted ? 'Hoàn thành' : 'Xem Tiếp';
    const timeLabel = posStr && durStr ? `${posStr} / ${durStr}` : null;
    const handleClick = () => {
        console.log(item.externalFilmId)
    }

    const deleteHistoryMutation = useMutation({
        mutationFn: (id: string) => FilmService.deleteHistory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: filmKeys.history() });
        },
        onError: () => {
            toast.error('Không thể xóa lịch sử');
        },

    });

    const handleRemoveHistory = (id: string) => {
        if (!id) return;
        deleteHistoryMutation.mutate(id);
    };


    return (
        <div
            ref={cardRef}
            className="flex-shrink-0 w-[168px] group/card relative select-none"
        >
            <Link
                href={APP_ROUTES.FILM.WATCH(item.filmSlug, item.episodeSlug)}
                onClick={handleClick}
                className="block relative z-10"
            >
                <div className="aspect-[2/3] relative rounded-md overflow-hidden duration-300">
                    <Image
                        src={imgUrl(item.posterUrl)}
                        alt={item.filmTitle}
                        fill
                        sizes="148px"
                        className="object-cover transition-transform duration-500 group-hover/card:scale-110 pointer-events-none"
                        onError={(e: any) => {
                            e.target.src = '/placeholder-film.jpg';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
            </Link>

            <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveHistory(item.externalFilmId);
                }}
                className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-primary hover:brightness-110 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg border border-white/20 active:scale-95 opacity-0 group-hover/card:opacity-100"
            >
                <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="mt-1.5 space-y-1">
                <div className="flex items-center gap-1 px-0.5">
                    <span className="text-[10px] font-semibold text-foreground/80 tracking-wide shrink-0">
                        {item.episodeTitle}
                    </span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                        {timeLabel ?? statusLabel}
                    </span>
                </div>

                <div className="h-1 bg-white/10 rounded-full overflow-hidden mx-0.5">
                    <div
                        className={`h-full rounded-full transition-all ${item.isCompleted ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                        style={{ width: `${Math.max(progress, 3)}%` }}
                    />
                </div>

                <Link
                    href={APP_ROUTES.FILM.WATCH(item.filmSlug, item.episodeSlug)}
                    className="block relative z-10"
                >
                    <p className="text-[11px] font-semibold text-foreground truncate px-0.5 group-hover/card:text-primary transition-colors leading-tight">
                        {item.filmTitle}
                    </p>
                </Link>
            </div>
        </div>
    );
}

export function HistoryCardSkeleton() {
    return (
        <div className="flex-shrink-0 w-[168px] animate-pulse">
            <div className="aspect-[2/3] rounded-md bg-white/5" />
            <div className="mt-2 flex items-center gap-1.5 px-0.5">
                <div className="h-2.5 bg-white/5 rounded w-14" />
                <div className="h-2 bg-white/5 rounded w-2" />
                <div className="h-2.5 bg-white/5 rounded w-16" />
            </div>
            <div className="mt-1.5 h-1 bg-white/5 rounded-full mx-0.5" />
            <div className="mt-1 h-3 bg-white/5 rounded w-3/4 mx-0.5" />
        </div>
    );
}
