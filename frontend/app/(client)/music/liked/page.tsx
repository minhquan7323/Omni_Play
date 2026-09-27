'use client';

import { DroppableList } from '@/components/DroppableList';
import { DraggableItemsRegistry, DroppableId } from '@/constants/dnd.constant';
import { togglePlay } from '@/store/slices/musicPlayer.slice';
import { motion } from 'framer-motion';
import { Clock, Heart, MoreHorizontal, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { QueueCard } from '../_component/cards/queue.card';
import { TrackRow } from '../_component/list/TrackRow';
import { PlayPauseButton } from '../_component/ui/PlayPauseButton';

export default function LikedSongsPage() {
    const dispatch = useDispatch();

    const [showTopBar, setShowTopBar] = useState(false);
    const [isListHeaderStuck, setIsListHeaderStuck] = useState(false);
    const dominantColor = '#4c0082';

    const actionBarRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const { currentTrack, isPlaying } = useSelector((state: any) => state.musicPlayer, shallowEqual);

    useEffect(() => {
        const actionSentinel = actionBarRef.current;
        const listSentinel = sentinelRef.current;
        if (!actionSentinel || !listSentinel) return;

        const observerOptions = {
            root: null,
            rootMargin: '-64px 0px 0px 0px',
            threshold: 0,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.target === actionSentinel) {
                    setShowTopBar(!entry.isIntersecting);
                }
                if (entry.target === listSentinel) {
                    setIsListHeaderStuck(!entry.isIntersecting);
                }
            });
        }, observerOptions);

        observer.observe(actionSentinel);
        observer.observe(listSentinel);

        return () => observer.disconnect();
    }, []);

    const handlePlayAll = () => {
        // if (!LIKED_TRACKS.length) return;
        // dispatch(setTrack({ track: LIKED_TRACKS[0], context: LIKED_TRACKS, contextName: 'Liked Songs' }));
        // dispatch(setOpen({ id: SidebarId.MUSIC_RIGHT, isOpen: true }));
    };

    const likedIsPlaying = false;

    return (
        <div className="relative z-0 pb-8">
            <div
                className="absolute top-0 left-0 w-full h-[400px] -z-10 transition-colors duration-700 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(to bottom, ${dominantColor}, rgba(0,0,0,0))`,
                    opacity: 0.6
                }}
            />
            <div className="sticky top-0 z-40 w-full h-16 flex items-center px-6">
                <div
                    className={`absolute inset-0 transition-opacity duration-300 ${showTopBar ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundColor: dominantColor }}
                />
                <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${showTopBar ? 'opacity-100' : 'opacity-0'}`} />
                <div className="relative z-10 flex items-center gap-4 w-full">
                    <div className={`flex items-center gap-4 transition-all duration-300 min-w-0 ${showTopBar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                        <PlayPauseButton
                            isPlaying={likedIsPlaying}
                            onClick={() => {
                                if (likedIsPlaying) dispatch(togglePlay());
                                else handlePlayAll();
                            }}
                            className={`w-12 h-12 text-foreground bg-primary/80 hover:bg-primary hover:scale-105 shadow-lg`}
                            iconClassName="w-6 h-6"
                        />
                        <h1 className="text-2xl font-bold text-white truncate">Liked Songs</h1>
                    </div>
                </div>
            </div>

            <div className="px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row gap-6 mb-8 items-end"
                >
                    <div className="w-48 h-48 sm:w-60 sm:h-60 flex-shrink-0 rounded-md bg-gradient-to-br from-indigo-700 to-purple-400 flex items-center justify-center shadow-2xl">
                        <Heart className="w-24 h-24 text-white fill-white" />
                    </div>
                    <div className="flex flex-col justify-end">
                        <p className="text-sm font-semibold text-white/90 drop-shadow-sm">Playlist</p>
                        <h1 className="text-4xl sm:text-7xl font-black text-white mb-6 tracking-tighter" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            Liked Songs
                        </h1>
                        <div className="flex flex-wrap items-center gap-1 text-sm text-white/90 font-medium drop-shadow-sm">
                            <span className="font-bold text-white hover:underline cursor-pointer">Bạn</span>
                            <span className="mx-1 opacity-70">•</span>
                            <span className="opacity-70">{1} bài hát</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className={`bg-gradient-to-b from-${dominantColor} via-popover to-popover px-6 py-6 h-full flex-1 relative z-10`}>
                <div ref={actionBarRef} className="h-px w-full" />

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex items-center gap-6 mb-8 mt-2"
                >
                    <PlayPauseButton
                        isPlaying={likedIsPlaying}
                        onClick={() => {
                            if (likedIsPlaying) dispatch(togglePlay());
                            else handlePlayAll();
                        }}
                        className={`w-14 h-14 text-foreground bg-primary/80 hover:bg-primary hover:scale-105 shadow-lg`}
                        iconClassName="w-6 h-6"
                    />
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <button className="hover:text-white transition-colors">
                            <Plus className="w-8 h-8" />
                        </button>
                        <button className="hover:text-white transition-colors">
                            <MoreHorizontal className="w-8 h-8" />
                        </button>
                    </div>
                </motion.div>

                <div ref={sentinelRef} className="h-px w-full" />

                <div className={`w-full sticky top-16 z-30 flex items-center px-4 py-2 mb-2 text-sm text-muted-foreground transition-colors duration-300 ${isListHeaderStuck ? 'bg-[#181818] shadow-md border-b border-transparent' : 'bg-transparent border-b border-white/10'}`}>
                    <div className="w-8 text-center flex-shrink-0 mr-4">#</div>
                    <div className="flex-[2] min-w-0 font-medium">Title</div>
                    <div className="hidden md:flex flex-1 min-w-0 font-medium">Album</div>
                    <div className="flex-shrink-0 flex items-center justify-end gap-3 pr-2">
                        <div className="w-10 flex justify-center">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div className="w-5" />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <DroppableList
                        droppableId={DroppableId.TRACK_LIST}
                        isDropDisabled={true}
                        items={[]}
                        keepOriginal={true}
                        keyExtractor={(track: any, i: number) => `liked-track-${track.id}-${i}`}
                        containerClassName="space-y-1"
                        renderClone={(track: any) => {
                            return <QueueCard item={track} className="w-[300px] bg-popover rounded-md shadow-xl" />;
                        }}
                        renderItem={(track: any, i: number, isDragging: boolean) => {
                            DraggableItemsRegistry[`liked-track-${track.id}-${i}`] = track;
                            return (
                                <TrackRow
                                    key={`track-${track.id}-${i}`}
                                    track={track}
                                    context={[]}
                                    contextName="Liked Songs"
                                    index={i + 1}
                                    isPlaying={currentTrack?.id === track.id && isPlaying}
                                    showThumbnail={true}
                                    showArtistColumn={true}
                                />
                            );
                        }}
                    />
                </motion.div>
            </div>
        </div>
    );
}
