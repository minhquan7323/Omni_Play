'use client';

import { RepeatMode } from '@/constants/music.contant';
import { useAudio } from '@/providers/audio.provider';
import {
    nextTrack,
    prevTrack,
    setProgress,
    setRepeat,
    togglePlay,
    toggleShuffle,
    setIsMiniplayer
} from '@/store/slices/musicPlayer.slice';
import {
    Repeat,
    Repeat1,
    Shuffle,
    SkipBack,
    SkipForward,
    Mic2
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { artistNames, formatTime } from '../../_utils/music.util';
import { CustomSlider } from '../ui/CustomSlider';
import MarqueeText from '../ui/MarqueeText';
import AudioVisualizer from './AudioVisualizer';
import { PlayPauseButton } from '../ui/PlayPauseButton';
import { musicKeys } from '@/app/(client)/music/_constants/music.keys';
import { MusicService } from '@/services/music/music.service';
import { useQuery } from '@tanstack/react-query';

export function MiniPlayer() {
    const dispatch = useDispatch();
    const { currentTrack, userQueue, contextQueue, history, isPlaying, progress, duration, shuffle, repeat } = useSelector((state: any) => state.musicPlayer, shallowEqual);
    const hasTrack = !!currentTrack;
    const { audioElement } = useAudio();

    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [dragProgress, setDragProgress] = useState<number | null>(null);
    const [showLyric, setShowLyric] = useState(false);
    const lyricContainerRef = useRef<HTMLDivElement>(null);
    const prevLyricIdxRef = useRef(-1);

    const { data: lyricData } = useQuery({
        queryKey: musicKeys.trackLyric(currentTrack?.id ?? ''),
        queryFn: () => MusicService.getTrackLyric(currentTrack!.id),
        enabled: !!currentTrack?.id && showLyric,
    });

    const parsedLyrics = useMemo(() => {
        const raw: { text: string; words: { startTime: number; endTime: number; data: string }[] }[] | undefined
            = lyricData?.data?.lyrics;
        if (!Array.isArray(raw)) return [];
        return raw;
    }, [lyricData]);

    const miniCurrentIndex = useMemo(() => {
        if (!showLyric || parsedLyrics.length === 0) return -1;
        return parsedLyrics.findIndex((s: any, i: number) => {
            const start = (s.words[0]?.startTime ?? 0) / 1000;
            const nextStart = parsedLyrics[i + 1]?.words[0]?.startTime;
            const end = nextStart !== undefined ? nextStart / 1000 : Infinity;
            return progress >= start && progress < end;
        });
    }, [progress, parsedLyrics, showLyric]);

    useEffect(() => {
        if (miniCurrentIndex < 0) return;
        if (miniCurrentIndex === prevLyricIdxRef.current) return;
        prevLyricIdxRef.current = miniCurrentIndex;

        const container = lyricContainerRef.current;
        if (!container) return;
        const el = container.children[miniCurrentIndex] as HTMLElement;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [miniCurrentIndex]);

    const handleCycleRepeat = () => {
        const nextMode = repeat === RepeatMode.NONE ? RepeatMode.ALL : repeat === RepeatMode.ALL ? RepeatMode.ONE : RepeatMode.NONE;
        dispatch(setRepeat(nextMode));
    };

    const handleProgressCommit = (newTime: number) => {
        if (audioElement) audioElement.currentTime = newTime;
        dispatch(setProgress(newTime));
        setDragProgress(null);
    };

    useEffect(() => {
        let pWindow: Window | null = null;

        const openPip = async () => {
            if (!('documentPictureInPicture' in window)) return;
            try {
                // @ts-ignore
                pWindow = await window.documentPictureInPicture.requestWindow({ width: 220, height: 300 });
                setPipWindow(pWindow);
                pWindow.document.body.style.margin = '0';
                pWindow.document.body.style.overflow = 'hidden';
                pWindow.document.body.style.backgroundColor = '#121212';
                Array.from(document.styleSheets).forEach((styleSheet) => {
                    try {
                        const cssRules = Array.from(styleSheet.cssRules).map((rule) => rule.cssText).join('');
                        const style = pWindow.document.createElement('style');
                        style.textContent = cssRules;
                        pWindow.document.head.appendChild(style);
                    } catch (e) {
                        const link = pWindow.document.createElement('link');
                        if (styleSheet.href) {
                            link.rel = 'stylesheet';
                            link.href = styleSheet.href;
                            pWindow.document.head.appendChild(link);
                        }
                    }
                });
                pWindow.addEventListener('pagehide', () => {
                    setPipWindow(null);
                    dispatch(setIsMiniplayer(false));
                });
            } catch (error) {
                console.log('Cho user activation de bat PiP:', error);
            }
        };

        openPip();
        return () => { if (pWindow) pWindow.close(); };
    }, [dispatch]);

    if (!currentTrack) return null;

    const img = currentTrack?.thumbnailUrl || currentTrack?.albumCover;
    const totalDuration = duration || currentTrack?.duration || 0;
    const displayProgress = dragProgress !== null ? dragProgress : progress;
    const hasNext = userQueue?.length > 0 || contextQueue?.length > 0;
    const hasPrev = history?.length > 0;

    const playerContent = (
        <div
            className="w-screen h-screen bg-popover text-white flex flex-col justify-between select-none group overflow-hidden box-border"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative w-full aspect-square bg-popover overflow-hidden flex-1 flex items-center justify-center">
                {showLyric ? (
                    <div className="absolute inset-0 bg-[#0f0f2a] flex flex-col overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-[#0f0f2a] to-transparent z-10 pointer-events-none" />
                        <div
                            className="flex-1 overflow-y-auto px-3 py-8 flex flex-col gap-2 no-scrollbar"
                            ref={lyricContainerRef}
                            style={{ scrollbarWidth: 'none' }}
                        >
                            {parsedLyrics.length > 0 ? parsedLyrics.map((sentence: any, idx: number) => {
                                const start = (sentence.words[0]?.startTime ?? 0) / 1000;
                                const isCurrent = idx === miniCurrentIndex;
                                const isPast = miniCurrentIndex >= 0 && idx < miniCurrentIndex;
                                return (
                                    <p
                                        key={idx}
                                        onClick={() => {
                                            dispatch(setProgress(start));
                                            if (audioElement) {
                                                audioElement.currentTime = start;
                                            }
                                        }}
                                        className={
                                            'text-sm font-bold cursor-pointer transition-all duration-300 leading-snug ' +
                                            (isCurrent
                                                ? 'text-white scale-[1.03] origin-left'
                                                : isPast
                                                    ? 'text-white/20'
                                                    : 'text-white/30')
                                        }
                                    >
                                        {sentence.text}
                                    </p>
                                );
                            }) : (
                                <div className="flex items-center justify-center h-full text-white/30 text-xs text-center px-2">
                                    <span>Chưa có lời bài hát</span>
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#0f0f2a] to-transparent z-10 pointer-events-none" />
                    </div>
                ) : (
                    <>
                        {img ? (
                            <Image src={img} alt={currentTrack.title} fill className="object-cover" />
                        ) : (
                            <div className="text-zinc-500 text-xs">No Image</div>
                        )}

                        <div className={`absolute inset-0 text-muted-foreground bg-black/50 backdrop-blur-[2px] flex items-center justify-center gap-3 sm:gap-4 transition-opacity duration-200 px-3 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                            <button onClick={() => hasTrack && dispatch(toggleShuffle())} className={`${shuffle ? 'text-primary' : 'hover:text-foreground transition-colors'}`}>
                                <Shuffle className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                            <button onClick={() => dispatch(prevTrack())} disabled={!hasPrev} className="disabled:opacity-30 hover:text-foreground transition-colors">
                                <SkipBack className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                            <PlayPauseButton
                                isPlaying={isPlaying}
                                disabled={!hasTrack}
                                onClick={() => dispatch(togglePlay())}
                                className={`w-8 h-8 sm:w-9 sm:h-9 text-foreground ${hasTrack ? 'bg-primary/80 hover:bg-primary hover:scale-105 shadow-lg' : 'text-muted-foreground bg-secondary/50 cursor-not-allowed'}`}
                                iconClassName="w-4 h-4"
                            />
                            <button onClick={() => dispatch(nextTrack(undefined))} disabled={!hasNext && repeat === RepeatMode.NONE} className="disabled:opacity-30 hover:text-foreground transition-colors">
                                <SkipForward className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                            <button onClick={handleCycleRepeat} className={`relative ${repeat !== RepeatMode.NONE ? 'text-primary' : 'hover:text-foreground transition-colors'}`}>
                                {repeat === RepeatMode.ONE ? <Repeat1 className="w-4 h-4" strokeWidth={2.5} /> : <Repeat className="w-4 h-4" strokeWidth={2.5} />}
                                {repeat === RepeatMode.ALL && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className={`w-full flex items-center gap-2 text-sm text-muted-foreground font-medium transition-opacity duration-300 ${!hasTrack ? 'opacity-30 pointer-events-none' : ''}`}>
                <div className={`top-0 left-0 w-full transition-opacity duration-300 ${!hasTrack ? 'opacity-30 pointer-events-none' : ''}`}>
                    <CustomSlider
                        value={displayProgress} max={totalDuration} disabled={!hasTrack}
                        onChange={setDragProgress} onCommit={handleProgressCommit}
                        showTooltip={true} rounded={false} formatTooltip={formatTime}
                    />
                </div>
            </div>

            <div className="bg-popover px-2 pb-2 flex items-center justify-between relative">
                <div className="absolute inset-0 z-0 pointer-events-none opacity-10 flex items-end">
                    <AudioVisualizer audioElement={audioElement} />
                </div>
                <div className="min-w-0 flex-1 pr-2 relative z-10">
                    <MarqueeText text={currentTrack.title} isPlaying={isPlaying} textClassName="text-xs sm:text-sm font-semibold text-foreground cursor-pointer" />
                    <MarqueeText text={artistNames(currentTrack?.artists)} isPlaying={isPlaying} textClassName="text-[11px] sm:text-xs text-muted-foreground cursor-pointer" />
                </div>
                <button
                    onClick={() => setShowLyric(v => !v)}
                    className={"w-7 h-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 relative z-10 " + (showLyric ? "text-primary" : "text-muted-foreground hover:text-primary")}
                    title="Show Lyrics"
                >
                    <Mic2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    if (pipWindow) {
        return createPortal(playerContent, pipWindow.document.body);
    }

    return null;
}
