'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Maximize2, Volume2, VolumeX, Music, Film, GripHorizontal } from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FilmPlayerState {
    type: 'film';
    src: string;
    title: string;
    filmSlug: string;
    posterUrl?: string;
}

interface MusicPlayerState {
    type: 'music';
    trackId: string;
    title: string;
    artist: string;
    thumbnailUrl?: string;
    streamUrl?: string;
}

type MiniPlayerState = FilmPlayerState | MusicPlayerState | null;

interface MiniPlayerContextValue {
    miniPlayer: MiniPlayerState;
    isVisible: boolean;
    openFilmPlayer: (data: Omit<FilmPlayerState, 'type'>) => void;
    openMusicPlayer: (data: Omit<MusicPlayerState, 'type'>) => void;
    closeMiniPlayer: () => void;
}

const MiniPlayerContext = createContext<MiniPlayerContextValue | null>(null);

export function MiniPlayerProvider({ children }: { children: React.ReactNode }) {
    const [miniPlayer, setMiniPlayer] = useState<MiniPlayerState>(null);
    const [isVisible, setIsVisible] = useState(false);

    const openFilmPlayer = useCallback((data: Omit<FilmPlayerState, 'type'>) => {
        setMiniPlayer({ type: 'film', ...data });
        setIsVisible(true);
    }, []);

    const openMusicPlayer = useCallback((data: Omit<MusicPlayerState, 'type'>) => {
        setMiniPlayer({ type: 'music', ...data });
        setIsVisible(true);
    }, []);

    const closeMiniPlayer = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => setMiniPlayer(null), 300);
    }, []);

    return (
        <MiniPlayerContext.Provider value={{
            miniPlayer, isVisible,
            openFilmPlayer, openMusicPlayer, closeMiniPlayer,
        }}>
            {children}
            <FloatingMiniPlayer />
        </MiniPlayerContext.Provider>
    );
}

export function useMiniPlayer() {
    const ctx = useContext(MiniPlayerContext);
    if (!ctx) throw new Error('useMiniPlayer must be inside MiniPlayerProvider');
    return ctx;
}

// ─── Floating Mini Player ──────────────────────────────────────────────────────
function FloatingMiniPlayer() {
    const { miniPlayer, isVisible, closeMiniPlayer } = useMiniPlayer();
    const dragControls = useDragControls();
    const [iframeKey, setIframeKey] = useState(0);

    // Reset iframe when src changes
    useEffect(() => {
        if (miniPlayer?.type === 'film') {
            setIframeKey(k => k + 1);
        }
    }, [(miniPlayer as FilmPlayerState)?.src]);

    if (!miniPlayer) return null;

    const isFilm = miniPlayer.type === 'film';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    drag
                    dragControls={dragControls}
                    dragMomentum={false}
                    dragElastic={0.05}
                    dragListener={false}
                    initial={{ opacity: 0, scale: 0.85, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 20 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 9999,
                        width: 300,
                        touchAction: 'none',
                    }}
                    className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-[#1a1630] backdrop-blur-xl"
                >
                    {/* Drag handle – only drag from here */}
                    <div
                        onPointerDown={e => { e.preventDefault(); dragControls.start(e); }}
                        className="flex items-center justify-center py-1.5 bg-white/5 border-b border-white/5 cursor-grab active:cursor-grabbing"
                        style={{ touchAction: 'none' }}
                    >
                        <GripHorizontal className="w-4 h-4 text-white/30" />
                    </div>

                    {/* Media Area */}
                    <div className="relative aspect-video bg-black">
                        {isFilm ? (
                            /* ── Iframe for film (link_embed is an iframe URL) ── */
                            <iframe
                                key={iframeKey}
                                src={(miniPlayer as FilmPlayerState).src}
                                title={miniPlayer.title}
                                className="w-full h-full"
                                allowFullScreen
                                allow="autoplay; fullscreen; picture-in-picture"
                                style={{ border: 'none' }}
                                onPointerDownCapture={e => e.stopPropagation()}
                            />
                        ) : (
                            /* ── Music thumbnail ── */
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-purple-600/30">
                                {(miniPlayer as MusicPlayerState).thumbnailUrl ? (
                                    <img
                                        src={(miniPlayer as MusicPlayerState).thumbnailUrl}
                                        alt={miniPlayer.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Music className="w-10 h-10 text-white/60" />
                                )}
                            </div>
                        )}

                        {/* Top control buttons – always visible */}
                        <div className="absolute top-2 right-2 flex gap-1 pointer-events-auto">
                            {isFilm && (
                                <Link
                                    href={`/film/${(miniPlayer as FilmPlayerState).filmSlug}/watch`}
                                    onPointerDownCapture={e => e.stopPropagation()}
                                    className="p-1.5 bg-black/60 hover:bg-primary/70 rounded-lg transition-colors group"
                                    title="Mở trang xem phim"
                                >
                                    <Maximize2 className="w-3 h-3 text-white group-hover:scale-110 transition-transform" />
                                </Link>
                            )}
                            <button
                                onClick={closeMiniPlayer}
                                onPointerDownCapture={e => e.stopPropagation()}
                                className="p-1.5 bg-black/60 hover:bg-red-500/80 rounded-lg transition-colors"
                                title="Đóng"
                            >
                                <X className="w-3 h-3 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Info Bar */}
                    <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                                {miniPlayer.title}
                            </p>
                            {miniPlayer.type === 'music' && (
                                <p className="text-[10px] text-white/50 truncate">
                                    {(miniPlayer as MusicPlayerState).artist}
                                </p>
                            )}
                        </div>
                        <div className={`flex-shrink-0 p-1.5 rounded-lg ${isFilm ? 'text-blue-400 bg-blue-400/10' : 'text-green-400 bg-green-400/10'}`}>
                            {isFilm
                                ? <Film className="w-3.5 h-3.5" />
                                : <Music className="w-3.5 h-3.5" />
                            }
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
