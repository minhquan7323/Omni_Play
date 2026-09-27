import { motion, MotionValue } from 'framer-motion';
import { Disc } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { artistNames } from '../../_utils/music.util';

interface RightSidebarDetailsProps {
    coverOpacity: MotionValue<number>;
    coverScale: MotionValue<number>;
    coverY: MotionValue<number>;
    setViewMode: (mode: 'queue' | 'details') => void;
}

export function RightSidebarDetails({
    coverOpacity,
    coverScale,
    coverY,
    setViewMode,
}: RightSidebarDetailsProps) {
    const { currentTrack, userQueue, contextQueue } = useSelector(
        (state: any) => state.musicPlayer,
        shallowEqual
    );

    const imageUrl = currentTrack?.thumbnailUrl || currentTrack?.albumCover;
    const nextPreview = userQueue[0] ?? contextQueue[0] ?? null;

    return (
        <motion.div
            key="details-view"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full flex flex-col"
        >
            <div className="sticky top-2 z-0 pt-2 pb-6 flex flex-col items-center">
                <motion.div
                    style={{ opacity: coverOpacity, scale: coverScale, y: coverY }}
                    className="relative aspect-square w-full max-w-[340px] rounded-lg overflow-hidden bg-zinc-800/80 flex items-center justify-center shadow-2xl"
                >
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={currentTrack?.title}
                            fill
                            priority
                            sizes="340px"
                            className="object-cover"
                        />
                    ) : (
                        <Disc className="w-24 h-24 text-zinc-500" strokeWidth={1} />
                    )}
                </motion.div>

                <motion.div
                    style={{ opacity: coverOpacity }}
                    className="w-full mt-4 flex items-center justify-between"
                >
                    <div className="min-w-0 pr-2">
                        <h3 className="text-xl font-extrabold text-foreground truncate hover:underline cursor-pointer">
                            {currentTrack?.title}
                        </h3>
                        <p className="text-sm font-medium text-zinc-400 truncate hover:underline cursor-pointer">
                            {artistNames(currentTrack?.artists)}
                        </p>
                    </div>
                </motion.div>
            </div>

            <div className="relative z-10 space-y-4 py-4 mt-2">
                {/* <div className="bg-popover rounded-2xl overflow-hidden shadow-2xl">
                    <div className="relative h-48 w-full bg-zinc-800 flex items-center justify-center">
                        <Image
                            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800"
                            alt="Artist cover"
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-cover"
                        />
                        <span className="absolute top-4 left-4 font-bold text-sm text-white drop-shadow-md">
                            About the artist
                        </span>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-base text-foreground hover:underline cursor-pointer">
                                    {currentTrack?.artists?.[0]?.name || 'Artist'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    1,901,668 monthly listeners
                                </p>
                            </div>
                            <button className="px-4 py-1.5 border border-border hover:border-foreground rounded-full text-xs font-bold text-foreground transition hover:scale-105 active:scale-95">
                                Follow
                            </button>
                        </div>
                        <p className="text-xs text-secondary-foreground leading-relaxed line-clamp-3">
                            {currentTrack?.artists?.[0]?.name} is a prominent artist representing the contemporary music scene.
                        </p>
                    </div>
                </div> */}

                <div className="bg-popover rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">
                            Next in queue
                        </span>
                        <span
                            onClick={() => setViewMode('queue')}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition"
                        >
                            Open queue
                        </span>
                    </div>

                    {nextPreview ? (
                        <div className="flex items-center gap-3 pt-1">
                            <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                                {(nextPreview.thumbnailUrl || nextPreview.albumCover) ? (
                                    <Image
                                        src={nextPreview.thumbnailUrl || nextPreview.albumCover || ''}
                                        alt="Queue track"
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <Disc className="w-6 h-6 text-zinc-500" strokeWidth={1.5} />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground truncate">{nextPreview.title}</p>
                                <p className="text-xs text-secondary-foreground truncate">{artistNames(nextPreview.artists)}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-500">No tracks in queue.</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
