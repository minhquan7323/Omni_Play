'use client';

import { musicKeys } from '@/app/(client)/music/_constants/music.keys';
import { MusicService } from '@/services/music/music.service';
import { setProgress } from '@/store/slices/musicPlayer.slice';
import { useQuery } from '@tanstack/react-query';
import { Mic2, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useAudio } from '@/providers/audio.provider';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import AudioVisualizer from '@/app/(client)/music/_component/player/AudioVisualizer';

type Word = { startTime: number; endTime: number; data: string };
type Sentence = { text: string; words: Word[] };
type Tab = 'karaoke' | 'lyric';

export function useSmoothProgress(progress: number, isPlaying: boolean) {
    const [smoothProgress, setSmoothProgress] = useState(progress);
    const smoothRef = useRef(progress);
    const lastWallRef = useRef(performance.now());
    const isPlayingRef = useRef(isPlaying);

    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    useEffect(() => {
        if (Math.abs(progress - smoothRef.current) > 2) {
            smoothRef.current = progress;
            setSmoothProgress(progress);
            lastWallRef.current = performance.now();
        }
    }, [progress]);

    useEffect(() => {
        let id: number;
        const tick = (now: number) => {
            const delta = (now - lastWallRef.current) / 1000;
            lastWallRef.current = now;
            if (isPlayingRef.current) {
                smoothRef.current += delta;
                setSmoothProgress(smoothRef.current);
            }
            id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, []);

    return smoothProgress;
}

function KaraokeWord({ word, progress }: { word: Word; progress: number }) {
    const start = word.startTime / 1000;
    const end = word.endTime / 1000;
    const duration = end - start;
    let pct = 0;
    if (progress >= end) pct = 100;
    else if (progress >= start && duration > 0)
        pct = Math.min(100, ((progress - start) / duration) * 100);

    return (
        <span className="relative inline-block">
            <span>{word.data}</span>
            <span
                className="absolute left-0 top-0 text-[#FACC15]"
                style={{ clipPath: `inset(0 ${100 - pct}% 0 0)`, willChange: 'clip-path' }}
            >
                {word.data}
            </span>
        </span>
    );
}

const BEFORE = 2;
const AFTER = 4;

const pageVariants = {
    hidden: { opacity: 0, y: 36 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0, 0, 0.2, 1] as any } },
    exit: { opacity: 0, y: 36, transition: { duration: 0.32, ease: [0.4, 0, 1, 1] as any } },
};

const lineVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (opacity: number) => ({
        opacity,
        y: 0,
        transition: { duration: 0.35, ease: 'easeOut' as const },
    }),
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function LyricPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { currentTrack, progress, isPlaying } = useSelector((state: any) => state.musicPlayer);
    const { audioElement } = useAudio();

    const smoothProgress = useSmoothProgress(progress, isPlaying);
    const [activeTab, setActiveTab] = useState<Tab>('lyric');
    const karaokeMode = activeTab === 'karaoke';

    const [visible, setVisible] = useState(true);
    const handleClose = () => {
        setVisible(false);
        setTimeout(() => router.back(), 360);
    };

    useEffect(() => {
        const handler = () => handleClose();
        window.addEventListener('close-lyric-page', handler);
        return () => window.removeEventListener('close-lyric-page', handler);
    }, []);

    const [isIdle, setIsIdle] = useState(false);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resetIdle = useCallback(() => {
        setIsIdle(false);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => setIsIdle(true), 3000);
    }, []);
    useEffect(() => {
        resetIdle();
        return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
    }, [resetIdle]);

    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const userScrollingRef = useRef(false);
    const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const currentIndexRef = useRef(-1);

    const { data: lyricData, isLoading } = useQuery({
        queryKey: musicKeys.trackLyric(currentTrack?.id ?? ''),
        queryFn: () => MusicService.getTrackLyric(currentTrack!.id),
        enabled: !!currentTrack?.id,
    });

    const lyrics: Sentence[] = useMemo(() => {
        const raw = lyricData?.data?.lyrics;
        if (!Array.isArray(raw)) return [];
        return raw;
    }, [lyricData]);

    const currentIndex = useMemo(() => {
        return lyrics.findIndex((s, idx) => {
            const start = (s.words[0]?.startTime ?? 0) / 1000;
            const nextStart = lyrics[idx + 1]?.words[0]?.startTime;
            const end = nextStart !== undefined ? nextStart / 1000 : Infinity;
            return progress >= start && progress < end;
        });
    }, [progress, lyrics]);

    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    const visibleLyrics = useMemo(() => {
        if (lyrics.length === 0) return [];
        const base = Math.max(currentIndex, 0);
        const start = Math.max(0, base - BEFORE);
        const end = Math.min(lyrics.length, base + AFTER + 1);
        return lyrics.slice(start, end).map((s, i) => ({
            sentence: s,
            globalIndex: start + i,
        }));
    }, [lyrics, currentIndex]);

    useEffect(() => {
        const el = lyricsContainerRef.current?.parentElement;
        if (!el) return;
        const onScroll = () => {
            userScrollingRef.current = true;
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = setTimeout(() => {
                userScrollingRef.current = false;
            }, 3000);
        };
        el.addEventListener('wheel', onScroll, { passive: true });
        el.addEventListener('touchmove', onScroll, { passive: true });
        return () => {
            el.removeEventListener('wheel', onScroll);
            el.removeEventListener('touchmove', onScroll);
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        };
    }, []);

    const imageUrl = currentTrack?.thumbnailUrl || currentTrack?.albumCover;

    if (!currentTrack) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                <Mic2 className="w-16 h-16 opacity-30" />
                <p className="text-lg font-semibold">Chưa có bài hát nào đang phát</p>
            </div>
        );
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="lyric-page"
                    variants={pageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative w-full h-full overflow-hidden rounded-lg flex flex-col bg-[#12122a]"
                    onMouseMove={resetIdle}
                >
                    {imageUrl && (
                        <div className="absolute inset-0 z-0 scale-110 blur-3xl opacity-25 pointer-events-none">
                            <Image src={imageUrl} alt="" fill className="object-cover" />
                        </div>
                    )}
                    <div className="absolute inset-0 z-0 bg-[#12122a]/70 pointer-events-none" />
                    <motion.div
                        className="relative z-30 flex items-center px-6 pt-4 pb-3 shrink-0"
                        animate={{ opacity: isIdle ? 0 : 1, y: isIdle ? -10 : 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' as const }}
                        style={{ pointerEvents: isIdle ? 'none' : 'auto' }}
                    >
                        <div className="w-8 h-8 shrink-0" />
                        <div className="flex-1 flex justify-center">
                            <div className="flex items-center gap-1 bg-white/8 backdrop-blur-sm rounded-full px-1 py-1 border border-white/10">
                                {([
                                    { key: 'karaoke', label: 'Karaoke' },
                                    { key: 'lyric', label: 'Lời bài hát' },
                                ] as { key: Tab; label: string }[]).map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        className={
                                            'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ' +
                                            (activeTab === key
                                                ? 'bg-white text-[#12122a] shadow-sm'
                                                : 'text-white/50 hover:text-white/80')
                                        }
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </motion.div>

                    <div className="relative z-10 flex flex-1 min-h-0 items-center justify-center gap-10 px-8 pb-6">
                        <motion.div
                            className="hidden md:flex flex-col items-center justify-center shrink-0 w-[240px] lg:w-[280px]"
                            animate={{ opacity: isIdle ? 0 : 1, x: isIdle ? -16 : 0 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' as const }}
                            style={{ pointerEvents: isIdle ? 'none' : 'auto' }}
                        >
                            <div
                                className="relative w-full aspect-square rounded-2xl overflow-hidden"
                            >
                                {imageUrl ? (
                                    <div className="w-full h-full">
                                        <Image
                                            src={imageUrl}
                                            alt={currentTrack.title}
                                            width={280}
                                            height={280}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                        <Mic2 className="w-16 h-16 text-white/20" />
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 w-14 h-8 z-10">
                                    <AudioVisualizer
                                        audioElement={audioElement}
                                        barColor="rgba(255,255,255,0.6)"
                                        barCount={10}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 w-full text-center">
                                <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
                                <p className="text-xs text-white/45 truncate mt-0.5">
                                    {currentTrack.artists?.map((a: any) => a.name).join(', ')}
                                </p>
                            </div>
                        </motion.div>

                        <div className="relative flex-1 min-w-0 max-w-[520px] flex flex-col justify-center">
                            <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }}>
                                <div
                                    ref={lyricsContainerRef}
                                    className="flex flex-col gap-5 py-8"
                                >
                                    {isLoading ? (
                                        <div className="flex flex-col gap-5 animate-pulse">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-8 bg-white/10 rounded-lg"
                                                    style={{ width: `${40 + (i % 4) * 12}%` }}
                                                />
                                            ))}
                                        </div>
                                    ) : lyrics.length > 0 ? (
                                        <AnimatePresence mode="popLayout">
                                            {visibleLyrics.map(({ sentence, globalIndex }) => {
                                                const sentenceStart = (sentence.words[0]?.startTime ?? 0) / 1000;
                                                const isCurrent = globalIndex === currentIndex;
                                                const isPast = currentIndex >= 0 && globalIndex < currentIndex;
                                                const distance = Math.abs(globalIndex - currentIndex);

                                                const opacity = isCurrent
                                                    ? 1
                                                    : isPast
                                                        ? Math.max(0.3, 0.55 - distance * 0.07)
                                                        : Math.max(0.4, 0.7 - distance * 0.1);

                                                return (
                                                    <motion.p
                                                        key={globalIndex}
                                                        data-idx={globalIndex}
                                                        layout
                                                        custom={opacity}
                                                        variants={lineVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        exit="exit"
                                                        onClick={() => {
                                                            dispatch(setProgress(sentenceStart));
                                                            if (audioElement) audioElement.currentTime = sentenceStart;
                                                        }}
                                                        className="font-bold tracking-tight cursor-pointer leading-snug select-none text-2xl md:text-3xl"
                                                        style={{ color: `rgba(255,255,255,${opacity})` }}
                                                    >
                                                        {isCurrent && karaokeMode ? (
                                                            sentence.words.map((word, wIdx) => (
                                                                <span key={wIdx}>
                                                                    <KaraokeWord word={word} progress={smoothProgress} />
                                                                    {wIdx < sentence.words.length - 1 ? ' ' : ''}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            sentence.text
                                                        )}
                                                    </motion.p>
                                                );
                                            })}
                                        </AnimatePresence>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 text-white/40">
                                            <Mic2 className="w-10 h-10 mb-3 opacity-40" />
                                            <p className="text-sm font-semibold">Không tìm thấy lời bài hát</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
