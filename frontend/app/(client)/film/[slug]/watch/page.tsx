'use client';

import { useMiniPlayer } from '@/contexts/MiniPlayerContext';
import { FilmService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import Hls from 'hls.js';
import { Calendar, CheckCircle2, ChevronRight, Clock, Film, Play, Radio, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { imgUrl, fmtSeconds } from '../../_utils/music.util';
import { filmKeys } from '../../_constants/film.keys';
import { APP_ROUTES } from '@/constants/routes.constant';

function CustomVideoPlayer({
    src,
    title,
    initialTime = 0,
    onTimeUpdate,
    onEnded,
}: {
    src: string;
    title: string;
    initialTime?: number;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    onEnded?: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        setLoaded(false);
        let hls: Hls | null = null;

        if (Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setLoaded(true);
                if (initialTime > 0) video.currentTime = initialTime;
                video.play().catch(e => console.log('Autoplay prevented:', e));
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            video.addEventListener('loadedmetadata', () => {
                setLoaded(true);
                if (initialTime > 0) video.currentTime = initialTime;
                video.play().catch(e => console.log('Autoplay prevented:', e));
            });
        }

        return () => {
            if (hls) hls.destroy();
        };
    }, [src, initialTime]);

    if (!src) return null;

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 mb-6">
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <video
                ref={videoRef}
                controls
                playsInline
                autoPlay
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => {
                    const video = e.currentTarget;
                    if (onTimeUpdate) {
                        onTimeUpdate(video.currentTime, video.duration || 0);
                    }
                }}
                onEnded={onEnded}
            />
        </div>
    );
}

export default function WatchPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const slug = params?.slug as string;
    const initialEpSlug = searchParams?.get('ep');
    const initialServerIdx = parseInt(searchParams?.get('server') || '0', 10);

    const [serverIdx, setServerIdx] = useState(initialServerIdx);
    const [currentEp, setCurrentEp] = useState<any>(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isCompact, setIsCompact] = useState(true);
    const [epChunk, setEpChunk] = useState(0);

    const auth = useSelector((state: any) => state.auth);
    const { openFilmPlayer } = useMiniPlayer();

    const lastSavedPosition = useRef<number>(0);
    const lastThrottleTime = useRef<number>(0);

    const { data: apiData, isLoading } = useQuery({
        queryKey: filmKeys.detail(slug),
        queryFn: () => FilmService.getDetail(slug),
        select: (res: any) => res?.data,
        enabled: !!slug,
    });
    const filmData = apiData?.movie;

    const allServers: any[] = apiData?.episodes || [];
    const currentServer = allServers[serverIdx] || allServers[0];
    const episodes: any[] = Array.from(
        new Map((currentServer?.server_data || []).map((ep: any) => [ep.slug, ep])).values()
    );
    const validEpisodes = episodes.filter((ep: any) => ep.slug && ep.name);
    const hasValidEpisodes = validEpisodes.length > 0;

    const { data: historyData, isFetching: historyFetching } = useQuery({
        queryKey: filmKeys.checkHistory(filmData?._id),
        queryFn: () => FilmService.checkWatchHistory(filmData?._id),
        enabled: !!filmData?._id && !!auth?.accessToken,
        select: (res: any) => res?.data,
    });

    const { data: favData } = useQuery({
        queryKey: filmKeys.checkFavorite(filmData?._id),
        queryFn: () => FilmService.checkFavorite(filmData?._id),
        enabled: !!filmData?._id && !!auth?.accessToken,
        select: (res: any) => res?.data?.favorited,
    });

    useEffect(() => {
        if (favData !== undefined) setIsFavorited(favData);
    }, [favData]);

    const [isEpInitialized, setIsEpInitialized] = useState(false);
    const [answeredEpSlug, setAnsweredEpSlug] = useState<string | null>(null);
    const [playbackStartTime, setPlaybackStartTime] = useState(0);

    useEffect(() => {
        if (!episodes.length) return;
        if (isEpInitialized) return;
        
        if (auth?.accessToken && historyFetching) return;

        let epToSet = episodes[0];

        if (initialEpSlug) {
            const ep = episodes.find((e: any) => e.slug === initialEpSlug);
            if (ep) epToSet = ep;
        } else if (historyData?.episodeSlug) {
            const ep = episodes.find((e: any) => e.slug === historyData.episodeSlug);
            if (ep) epToSet = ep;
        }

        setCurrentEp(epToSet);
        const idx = episodes.indexOf(epToSet);
        if (idx !== -1) setEpChunk(Math.floor(idx / 100));
        
        setIsEpInitialized(true);
    }, [episodes, initialEpSlug, historyData, historyFetching, isEpInitialized, auth?.accessToken]);

    const hasAnsweredPrompt = answeredEpSlug === currentEp?.slug;

    useEffect(() => {
        if (!currentEp) return;
        if (hasAnsweredPrompt) return;
        if (historyFetching) return;

        if (
            historyData &&
            historyData.playbackPosition > 5 &&
            !historyData.isCompleted &&
            currentEp.slug === historyData.episodeSlug
        ) {
            // Needs prompt, wait for user
        } else {
            // No prompt needed
            setPlaybackStartTime(0);
            setAnsweredEpSlug(currentEp.slug);
        }
    }, [currentEp, historyData, historyFetching, hasAnsweredPrompt]);

    const handleServerChange = (i: number) => {
        setServerIdx(i);
        setCurrentEp(null);
        setEpChunk(0);
    };

    const CHUNK_SIZE = 100;
    const epChunks: any[][] = [];
    for (let i = 0; i < validEpisodes.length; i += CHUNK_SIZE) {
        epChunks.push(validEpisodes.slice(i, i + CHUNK_SIZE));
    }
    const visibleEpisodes = epChunks[epChunk] || validEpisodes;

    const saveWatchHistory = useCallback(
        async (
            currentTime: number,
            duration: number,
            isCompleted: boolean = false,
        ) => {
            if (!auth?.accessToken || !filmData || !currentEp) return;
            try {
                await FilmService.saveHistory({
                    externalFilmId: filmData._id,
                    filmSlug: slug,
                    filmTitle: filmData.name,
                    posterUrl: imgUrl(filmData.poster_url),
                    thumbUrl: imgUrl(filmData.thumb_url),
                    episodeSlug: currentEp.slug,
                    episodeTitle: currentEp.name,
                    playbackPosition: Math.floor(currentTime),
                    duration: Math.floor(duration),
                    isCompleted:
                        isCompleted ||
                        (duration > 0 && currentTime >= duration * 0.9),
                });
            } catch (err) {
                console.error('Lỗi lưu lịch sử:', err);
            }
        },
        [auth?.accessToken, filmData, currentEp, slug],
    );

    const handleTimeUpdate = useCallback(
        (currentTime: number, duration: number) => {
            lastSavedPosition.current = currentTime;
            const now = Date.now();
            if (now - lastThrottleTime.current > 5000) {
                lastThrottleTime.current = now;
                saveWatchHistory(currentTime, duration, false);
            }
        },
        [saveWatchHistory],
    );

    const handleEpSelect = useCallback(
        (ep: any) => {
            router.push(APP_ROUTES.FILM.WATCH(slug, ep.slug, serverIdx),
                { scroll: true });
        },
        [router, slug, serverIdx],
    );

    const handleMiniPlayer = () => {
        if (!currentEp || !filmData) return;
        openFilmPlayer({
            src: currentEp.link_embed || currentEp.link_m3u8,
            title: `${filmData.name} - ${currentEp.name}`,
            filmSlug: slug,
            posterUrl: imgUrl(filmData.poster_url),
        });
    };

    if (isLoading) {
        return (
            <div className="w-full min-h-screen p-6 animate-pulse text-zinc-400">
                <div className="h-44 bg-white/5 rounded-xl mb-6" />
                <div className="h-96 bg-white/5 rounded-xl" />
            </div>
        );
    }

    if (!filmData) {
        return (
            <div className="w-full text-center py-32 min-h-screen text-zinc-400">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Không tìm thấy phim</p>
                <Link
                    href="/film"
                    className="text-amber-400 text-xs hover:underline mt-2 inline-block"
                >
                    Quay về trang chủ
                </Link>
            </div>
        );
    }

    const posterSrc = imgUrl(filmData.poster_url || filmData.thumb_url);
    const videoStreamUrl = currentEp?.link_m3u8 || currentEp?.link_embed || '';
    const cleanContent = filmData.content
        ? filmData.content.replace(/<[^>]*>?/gm, '')
        : '';
    const imdbScore = filmData.imdb?.vote_average;
    const tmdbScore = filmData.tmdb?.vote_average;

    return (
        <div className="max-w-screen-2xl mx-auto px-4 pb-4">
            {/* <div className="w-full grid grid-cols-1 xl:grid-cols-[1fr_320px] 2xl:grid-cols-[1fr_360px] gap-8"> */}
            < div className="w-full gap-8" >
                <div className="w-full space-y-6 min-w-0">
                    {videoStreamUrl ? (
                        <div className="pt-2 relative">
                            {(!hasAnsweredPrompt && !historyFetching && historyData && historyData.playbackPosition > 5 && currentEp?.slug === historyData.episodeSlug) ? (
                                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 mb-6 flex flex-col items-center justify-center">
                                    <Image
                                        src={posterSrc}
                                        alt={filmData.name}
                                        fill
                                        className="object-cover opacity-30 blur-sm"
                                    />
                                    <div className="absolute inset-0 bg-black/60" />
                                    
                                    <div className="relative z-10 flex flex-col items-center text-center px-4">
                                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                                            <Play className="w-8 h-8 text-primary ml-1" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Bạn muốn xem tiếp từ đâu?</h3>
                                        <p className="text-zinc-300 text-sm mb-8">
                                            Lần trước bạn đang xem tới đoạn <span className="text-primary font-bold">{fmtSeconds(historyData.playbackPosition)}</span>
                                        </p>
                                        
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => {
                                                    setPlaybackStartTime(historyData.playbackPosition);
                                                    setAnsweredEpSlug(currentEp.slug);
                                                }}
                                                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <Play className="w-4 h-4 fill-current" />
                                                Xem tiếp
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPlaybackStartTime(0);
                                                    setAnsweredEpSlug(currentEp.slug);
                                                }}
                                                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
                                            >
                                                Xem từ đầu
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : hasAnsweredPrompt ? (
                                <CustomVideoPlayer
                                    src={videoStreamUrl}
                                    title={filmData.name}
                                    initialTime={playbackStartTime}
                                    onTimeUpdate={handleTimeUpdate}
                                    onEnded={() => { }}
                                />
                            ) : (
                                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 mb-6 flex items-center justify-center">
                                     <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="pt-2">
                            <div className="relative w-full aspect-video bg-white/5 rounded-xl overflow-hidden shadow-2xl border border-white/10 mb-6 flex flex-col items-center justify-center text-zinc-500">
                                <Clock className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm font-medium text-white/60">Phim chưa có tập chính thức</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                        <div className="flex gap-4 sm:gap-5 items-start">
                            <div className="relative w-24 h-36 sm:w-28 sm:h-40 rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/10">
                                <Image
                                    src={posterSrc}
                                    alt={filmData.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="space-y-2.5">
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                                        {filmData.name}
                                    </h1>
                                    <p className="text-primary text-xs sm:text-sm font-medium mt-0.5">
                                        {filmData.origin_name}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    {imdbScore > 0 && (
                                        <div className="border border-[#f5c518] rounded px-1.5 py-0.5 flex items-center gap-1 text-[11px] text-white leading-tight">
                                            <span className="text-[#f5c518] font-black">IMDb</span>
                                            <span>{imdbScore.toFixed(1)}</span>
                                        </div>
                                    )}
                                    {!imdbScore && tmdbScore > 0 && (
                                        <span className="text-sm text-amber-400 flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                                            {tmdbScore.toFixed(1)}
                                            <span className="text-white/40 text-xs">TMDB</span>
                                        </span>
                                    )}
                                    {filmData.year && (
                                        <span className="text-sm text-white/65 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-white/40" />{filmData.year}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {filmData.category?.map((c: any) => (
                                        <Link
                                            key={c.name}
                                            href={APP_ROUTES.FILM.SEARCH + '?category=' + c.slug}
                                            className="bg-white/10 hover:bg-white/25 transition-colors px-2 py-0.5 rounded-md text-[10px] font-medium text-white/75"
                                        >
                                            {c.name}
                                        </Link>
                                    ))}
                                </div>

                                <div>
                                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>
                                            Đã hoàn thành: Tập {episodes.length}{' '}
                                            /{' '}
                                            {filmData.episode_total ||
                                                episodes.length}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:max-w-md text-xs text-zinc-400 leading-relaxed space-y-2">
                            <p className="line-clamp-3">
                                {cleanContent}
                            </p>
                            <button
                                onClick={() => router.push(APP_ROUTES.FILM.DETAIL(slug))}
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium transition-colors"
                            >
                                <span>Xem thêm</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {hasValidEpisodes && (
                        <>
                            <div className="flex items-center justify-between flex-wrap gap-4 py-2 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        {allServers.map((s: any, idx: number) => {
                                            const active = idx === serverIdx;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() =>
                                                        handleServerChange(idx)
                                                    }
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${active
                                                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-sm'
                                                        : 'border-white/5 bg-white/5 text-zinc-400 hover:text-white'
                                                        }`}
                                                >
                                                    <Radio className="w-3 h-3" />
                                                    <span>
                                                        {s.server_name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-foreground font-medium">
                                        Rút gọn
                                    </span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={isCompact}
                                        onClick={() => setIsCompact(!isCompact)}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isCompact ? 'bg-primary' : 'bg-primary/10'
                                            }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow-lg ring-0 transition duration-200 ease-in-out ${isCompact
                                                ? 'translate-x-4'
                                                : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="w-full pt-2 space-y-3">
                                {epChunks.length > 1 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {epChunks.map((chunk: any, i: number) => {
                                            let from = chunk[0]?.name || '';
                                            let to = chunk[chunk.length - 1]?.name || '';

                                            from = from.startsWith('Tập') ? from.replace('Tập', '').trim() : from;
                                            to = to.startsWith('Tập') ? to.replace('Tập', '').trim() : to;

                                            const label = chunk.length === 1 ? `Tập ${from}` : `Tập ${from} - ${to}`;

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setEpChunk(i)}
                                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${epChunk === i
                                                        ? 'bg-primary text-foreground shadow-md'
                                                        : 'bg-primary/20 text-foreground/50 hover:bg-primary/40'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {isCompact ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                                        {visibleEpisodes.map((ep: any) => {
                                            const active = currentEp?.slug === ep.slug;
                                            return (
                                                <button
                                                    key={ep.slug}
                                                    onClick={() => handleEpSelect(ep)}
                                                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${active
                                                        ? 'bg-primary text-foreground shadow-md font-bold'
                                                        : 'bg-[#1c2130] text-zinc-300 hover:bg-primary/20 border border-white/5'
                                                        }`}
                                                >
                                                    <Play
                                                        className={`w-2.5 h-2.5 ${active ? 'fill-foreground' : 'fill-zinc-300'}`}
                                                    />
                                                    <span>
                                                        {ep.name.startsWith('Tập')
                                                            ? ep.name
                                                            : `Tập ${ep.name}`}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {visibleEpisodes.map((ep: any) => {
                                            const active = currentEp?.slug === ep.slug;
                                            return (
                                                <div
                                                    key={ep.slug}
                                                    onClick={() => handleEpSelect(ep)}
                                                    className="group cursor-pointer space-y-1.5"
                                                >
                                                    <div
                                                        className={`relative w-full aspect-video rounded-xl overflow-hidden transition-all ${active
                                                            ? 'border-primary ring-2 ring-primary/80 shadow-lg'
                                                            : 'border-white/5 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <Image
                                                            src={posterSrc}
                                                            alt={ep.name}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        {active ? (
                                                            <div className="absolute left-2 bottom-2 z-10 px-2 py-0.5 rounded bg-primary text-foreground text-[10px] font-bold shadow">
                                                                Đang chiếu
                                                            </div>
                                                        ) : (
                                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                                                    <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p
                                                        className={`text-xs font-semibold truncate transition-colors ${active
                                                            ? 'text-primary'
                                                            : 'text-zinc-300 group-hover:text-primary'
                                                            }`}
                                                    >
                                                        {ep.name.startsWith('Tập')
                                                            ? ep.name
                                                            : `Tập ${ep.name}.`}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                </div>
                <div className="w-full space-y-6">

                </div>
            </div >
        </div >
    );
}
