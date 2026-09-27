'use client';

import React, { useState } from 'react';
import { Disc } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { artistNames } from '../../_utils/music.util';
import { setTrack } from '@/store/slices/musicPlayer.slice';
import { useDispatch } from 'react-redux';
import { setOpen } from '@/store/slices/sidebar.slice';
import { SidebarId } from '@/constants/sidebar.constant';
import Link from 'next/link';
import { APP_ROUTES } from '../../../../../constants/routes.constant';

interface AlbumCardProps {
    album: any;
    onPlay?: () => void;
    [key: string]: any;
}

export const AlbumCard = React.forwardRef<HTMLDivElement, AlbumCardProps>(
    function AlbumCard({ album, onPlay, ...rest }, ref) {
        const [isHovered, setIsHovered] = useState(false);
        const dispatch = useDispatch();

        const handlePlayTrack = (track: any, contextTracks: any[], contextName: string) => {
            if (!track) return;
            dispatch(setTrack({ track, context: contextTracks, contextName }));
            dispatch(setOpen({ id: SidebarId.MUSIC_RIGHT, isOpen: true }));
        };

        return (
            <Link href={APP_ROUTES.MUSIC.ALBUM(album?.id)}>
                <div
                    ref={ref}
                    // onClick={() => handlePlayTrack(album.tracks[0], album.tracks, album.name)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="relative w-60 shrink-0 p-4 text-card-foreground hover:text-accent-foreground cursor-pointer transition-colors"
                    {...rest}
                >
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute inset-0 bg-accent rounded-md"
                            />
                        )}
                    </AnimatePresence>

                    <div className="relative z-10">
                        <div className="relative flex items-center justify-center aspect-square mb-4 shadow-lg rounded-md bg-zinc-800/30">
                            {album?.image ? (
                                <Image
                                    src={album.image}
                                    alt={album.name}
                                    fill
                                    sizes="200px"
                                    className="object-cover rounded pointer-events-none"
                                />
                            ) : (
                                <Disc className="w-12 h-12 text-zinc-500" strokeWidth={1} />
                            )}
                        </div>
                        <p className="font-semibold line-clamp-2">{album?.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{artistNames(album?.artists)}</p>
                    </div>
                </div>
            </Link>
        );
    }
);

export const AlbumCardSkeleton = () => {
    return (
        <div className="relative w-60 shrink-0 p-4">
            <div className="relative z-10">
                <div className="relative aspect-square mb-4 bg-zinc-800/50 rounded-md animate-pulse" />
                <div className="h-5 w-3/4 bg-zinc-800/50 rounded mb-1.5 animate-pulse" />
                <div className="h-4 w-1/2 bg-zinc-800/50 rounded animate-pulse" />
            </div>
        </div>
    );
};