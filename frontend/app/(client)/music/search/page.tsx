'use client';

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MusicService } from '@/services';
import { setTrack } from '@/store/slices/musicPlayer.slice';
import { Search, Music, Play, Clock, X } from 'lucide-react';

export default function MusicSearchPage() {
    const dispatch = useDispatch();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(timer);
    }, [query]);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['music-search', debouncedQuery],
        queryFn: () => MusicService.searchTracks({ keyword: debouncedQuery }),
        select: (res: any) => res?.data || [],
        enabled: debouncedQuery.length >= 1,
    });

    const handlePlay = (track: any, queue: any[]) => {
        dispatch(
            setTrack({
                track: {
                    id: track.id,
                    title: track.title,
                    artists: track.artists || [
                        {
                            id: 'unknown',
                            name: track.artist || track.user?.name || 'Unknown',
                        },
                    ],
                    duration: track.duration,
                    thumbnailUrl:
                        track.thumbnailUrl || track.artwork?.['480x480'],
                    audioUrl: track.streamUrl || null,
                    lyrics: track.lyrics,
                },
                context: queue.map((t) => ({
                    id: t.id,
                    title: t.title,
                    artists: t.artists || [
                        {
                            id: 'unknown',
                            name: t.artist || t.user?.name || 'Unknown',
                        },
                    ],
                    duration: t.duration,
                    thumbnailUrl: t.thumbnailUrl || t.artwork?.['480x480'],
                    audioUrl: t.streamUrl || null,
                    lyrics: t.lyrics,
                })),
                contextName: 'Search results',
            }),
        );
    };

    const formatDuration = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen pb-24">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Search className="w-6 h-6 text-primary" />
                    Tìm Kiếm Nhạc
                </h1>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm kiếm bài hát, nghệ sĩ..."
                        autoFocus
                        className="w-full pl-12 pr-12 py-3 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {!debouncedQuery ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <Music className="w-16 h-16 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">
                            Nhập tên bài hát hoặc nghệ sĩ để tìm kiếm
                        </p>
                    </motion.div>
                ) : isLoading || isFetching ? (
                    <motion.div key="loading" className="space-y-2">
                        {Array(8)
                            .fill(0)
                            .map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 animate-pulse"
                                >
                                    <div className="w-12 h-12 bg-white/5 rounded-xl" />
                                    <div className="flex-1">
                                        <div className="h-3 bg-white/5 rounded w-2/3 mb-2" />
                                        <div className="h-2 bg-white/5 rounded w-1/3" />
                                    </div>
                                </div>
                            ))}
                    </motion.div>
                ) : data?.length === 0 ? (
                    <motion.div
                        key="no-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <p className="text-muted-foreground">
                            Không tìm thấy kết quả cho &ldquo;{debouncedQuery}
                            &rdquo;
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-card border border-border rounded-2xl overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-border">
                            <p className="text-xs text-muted-foreground">
                                {data?.length} kết quả cho &ldquo;
                                {debouncedQuery}&rdquo;
                            </p>
                        </div>
                        {data?.map((track: any, i: number) => (
                            <motion.div
                                key={track.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => handlePlay(track, data)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors group border-b border-border/30 last:border-b-0"
                            >
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-border/40 flex-shrink-0">
                                    {track.thumbnailUrl ||
                                    track.artwork?.['150x150'] ? (
                                        <Image
                                            src={
                                                track.thumbnailUrl ||
                                                track.artwork?.['150x150']
                                            }
                                            alt={track.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                            <Music className="w-5 h-5 text-primary" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-5 h-5 text-white fill-white" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                        {track.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {track.artist || track.user?.name}
                                        {track.album && ` · ${track.album}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(track.duration)}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
