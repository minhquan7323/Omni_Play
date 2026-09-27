'use client';

import { Heart, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { imgUrl } from '../../_utils/music.util';
import { APP_ROUTES } from '@/constants/routes.constant';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FilmService } from '@/services';
import { toast } from 'sonner';
import { filmKeys } from '../../_constants/film.keys';

interface FavoriteItem {
    id?: string;
    _id?: string;
    externalFilmId: string;
    filmSlug?: string;
    filmTitle: string;
    posterUrl?: string | null;
    releaseYear?: number | null;
}

interface FavoriteCardProps {
    item: FavoriteItem;
}

export function FavoriteCard({ item }: FavoriteCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: string) => FilmService.deleteFavorite(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: filmKeys.favorites() });
            toast.success('Đã xóa khỏi danh sách yêu thích');
        },
        onError: () => {
            toast.error('Không thể xóa khỏi danh sách yêu thích');
        },
    });

    const handleRemove = (id: string) => {
        deleteMutation.mutate(id);
    };

    return (
        <div
            ref={cardRef}
            className="flex-shrink-0 w-[148px] group/card relative select-none"
        >
            <Link
                href={APP_ROUTES.FILM.DETAIL(item.filmSlug)}
                className="block relative z-10"
            >
                <div className="aspect-[2/3] relative rounded-lg overflow-hidden transition-shadow duration-300">
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

                    <div className="absolute bottom-1.5 left-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 drop-shadow" />
                    </div>
                </div>
            </Link>

            <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove(item.externalFilmId);
                }}
                className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-primary hover:brightness-110 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg border border-white/20 active:scale-95 opacity-0 group-hover/card:opacity-100"
                title="Xóa khỏi yêu thích"
            >
                <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="mt-1.5 px-0.5 space-y-0.5">
                <Link
                    href={APP_ROUTES.FILM.DETAIL(item.filmSlug!)}
                    className="block relative z-10"
                >
                    <p className="text-[11px] font-semibold text-foreground truncate group-hover/card:text-primary transition-colors leading-tight">
                        {item.filmTitle}
                    </p>
                </Link>
                {item.releaseYear && (
                    <p className="text-[10px] text-muted-foreground">
                        {item.releaseYear}
                    </p>
                )}
            </div>
        </div>
    );
}

export function FavoriteCardSkeleton() {
    return (
        <div className="flex-shrink-0 w-[148px] animate-pulse">
            <div className="aspect-[2/3] rounded-lg bg-white/5 relative">
                <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 rounded-full bg-white/5" />
            </div>
            <div className="mt-2 px-0.5 space-y-1">
                <div className="h-3 bg-white/5 rounded w-4/5" />
                <div className="h-2.5 bg-white/5 rounded w-1/3" />
            </div>
        </div>
    );
}
