'use client';

import React, { useState } from 'react';
import { Disc, Play } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { artistNames } from '../../_utils/music.util';
import { useDispatch } from 'react-redux';
import { setTrack } from '@/store/slices/musicPlayer.slice';
import { setOpen } from '@/store/slices/sidebar.slice';
import { SidebarId } from '@/constants/sidebar.constant';

interface TrackCardProps {
    track: any;
    onPlay?: () => void;
    [key: string]: any;
}

export const TrackCard = React.forwardRef<HTMLDivElement, TrackCardProps>(
    function TrackCard({ track, onPlay, ...rest }, ref) {
        const [isHovered, setIsHovered] = useState(false);
        const dispatch = useDispatch();

        const handlePlayTrack = (track: any) => {
            if (!track) return;
            dispatch(setTrack({ track }));
            dispatch(setOpen({ id: SidebarId.MUSIC_RIGHT, isOpen: true }));
        };

        return (
            <div
                ref={ref}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => handlePlayTrack(track)}
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
                    <div className="relative aspect-square mb-4 shadow-lg bg-zinc-800/50 flex items-center justify-center rounded-md">
                        {track?.thumbnailUrl || track?.albumCover ? (
                            <Image
                                src={track?.thumbnailUrl || track?.albumCover}
                                alt={track.title}
                                fill
                                sizes="200px"
                                className="object-cover rounded pointer-events-none"
                            />
                        ) : (
                            <Disc className="w-12 h-12 text-zinc-500" strokeWidth={1} />
                        )}
                        <AnimatePresence>
                            {isHovered && (
                                <motion.button
                                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 12, scale: 0.9 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 25
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="absolute bottom-2 right-2 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl hover:brightness-110 transition-colors z-10"
                                >

                                    <Play className="w-8 h-8 text-foreground fill-foreground ml-1" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                    <p className="font-semibold line-clamp-2">{track?.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{artistNames(track?.artists)}</p>
                </div>
            </div>
        );
    }
);

export const TrackCardSkeleton = () => {
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