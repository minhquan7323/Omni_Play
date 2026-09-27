'use client';

import { APP_ROUTES } from '@/constants/routes.constant';
import { FilmService } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clapperboard, Clock, Eye, Film, Globe, Heart, List, Play, Radio, Star, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { fmtViews, imgUrl } from '../_utils/music.util';
import { filmKeys } from '../_constants/film.keys';
import { HEADER_HEIGHT } from '@/constants/layout.constant';

type Tab = 'episodes' | 'cast' | 'trailer';

export default function FilmDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;

    const [activeTab, setActiveTab] = useState<Tab>('episodes');
    const [isFavorited, setIsFavorited] = useState(false);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [isCompact, setIsCompact] = useState(true);
    const [serverIdx, setServerIdx] = useState(0);
    const [epChunk, setEpChunk] = useState(0);

    const auth = useSelector((state: any) => state.auth);

    const { data: apiData, isLoading } = useQuery({
        queryKey: filmKeys.detail(slug),
        queryFn: () => FilmService.getDetail(slug),
        select: (res: any) => res?.data,
        enabled: !!slug,
    });
    const filmData = apiData?.movie;

    const currentServer = apiData?.episodes[serverIdx] || apiData?.episodes[0];
    const episodes: any[] = Array.from(
        new Map((currentServer?.server_data || []).map((ep: any) => [ep.slug, ep])).values()
    );
    const validEpisodes = episodes.filter((ep: any) => ep.slug && ep.name);
    const hasValidEpisodes = validEpisodes.length > 0;
    const firstEp = validEpisodes[0];

    const { data: favData } = useQuery({
        queryKey: filmKeys.checkFavorite(filmData?._id),
        queryFn: () => FilmService.checkFavorite(filmData._id),
        enabled: !!filmData?._id && !!auth?.accessToken,
        select: (res: any) => res?.data?.favorited,
    });

    useEffect(() => {
        if (favData !== undefined) setIsFavorited(favData);
    }, [favData]);

    const handleFavorite = async () => {
        if (!auth?.accessToken || !filmData) return;
        try {
            const res: any = await FilmService.toggleFavorite({
                externalFilmId: filmData._id,
                filmTitle: filmData.name,
                posterUrl: imgUrl(filmData.poster_url),
                filmSlug: filmData.slug,
                releaseYear: filmData.year,
            });
            setIsFavorited(res?.data?.favorited ?? !isFavorited);
        } catch { }
    };


    const handleEpSelect = (ep: any) => {
        router.push(APP_ROUTES.FILM.WATCH(slug, ep.slug, serverIdx));
    };

    const handleServerChange = (i: number) => {
        setServerIdx(i);
        setEpChunk(0);
    };

    const CHUNK_SIZE = 100;
    const epChunks: any[][] = [];
    for (let i = 0; i < episodes.length; i += CHUNK_SIZE) {
        epChunks.push(episodes.slice(i, i + CHUNK_SIZE));
    }
    const visibleEpisodes = epChunks[epChunk] || episodes;

    if (isLoading)
        return (
            <div
                className="max-w-screen-2xl mx-auto"
                style={{ marginTop: `-${HEADER_HEIGHT + 8}px` }}
            >
                <div className="h-[400px] bg-white/5 rounded-none sm:rounded-2xl" />
                <div className="px-6 space-y-3">
                    <div className="h-8 bg-white/5 rounded w-1/3" />
                    <div className="h-4 bg-white/5 rounded w-2/3" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
            </div>
        );

    if (!filmData)
        return (
            <div className="text-center py-20">
                <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Không tìm thấy phim</p>
                <Link href="/film" className="text-primary text-sm hover:underline mt-2 inline-block">
                    Quay về trang phim
                </Link>
            </div>
        );

    const description = filmData.content?.replace(/<[^>]*>/g, '') || '';

    const thumbSrc = imgUrl(filmData.thumb_url || filmData.poster_url);
    const posterSrc = imgUrl(filmData.poster_url || filmData.thumb_url);

    const imdbScore = filmData.imdb?.vote_average;
    const tmdbScore = filmData.tmdb?.vote_average;

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'episodes', label: 'Tập phim', icon: <List className="w-3.5 h-3.5" /> },
        { key: 'cast', label: 'Diễn viên', icon: <Users className="w-3.5 h-3.5" /> },
        ...(filmData.trailer_url ? [{ key: 'trailer' as Tab, label: 'Trailer', icon: <Play className="w-3.5 h-3.5" /> }] : []),
    ];



    return (
        <div
            className="max-w-screen-2xl mx-auto"
            style={{ marginTop: `-${HEADER_HEIGHT + 8}px` }}
        >
            <div className="relative h-[380px] sm:h-[480px] overflow-hidden">
                <Image
                    src={thumbSrc}
                    alt={filmData.name}
                    fill
                    priority
                    className="object-cover scale-105"
                    style={{ filter: 'blur(1.5px)' }}
                    onError={(e: any) => { e.target.src = '/placeholder-film.jpg'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/5" />
                <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8 flex items-end gap-5">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-shrink-0 w-26 sm:w-38 aspect-[2/3] relative rounded-xl overflow-hidden shadow-2xl shadow-black/80 hidden sm:block"
                    >
                        <Image src={posterSrc} alt={filmData.name} fill className="object-cover"
                            onError={(e: any) => { e.target.src = '/placeholder-film.jpg'; }} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                        className="flex-1 min-w-0 pb-2"
                    >
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                            {filmData.category?.slice(0, 3).map((c: any) => (
                                <Link
                                    key={c.id}
                                    href={APP_ROUTES.FILM.SEARCH + '?category=' + c.slug}
                                    className="bg-white/10 hover:bg-white/25 transition-colors px-2 py-0.5 rounded-md text-[10px] font-medium text-white/75"
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight line-clamp-2 drop-shadow-2xl">
                            {filmData.name}
                        </h1>
                        <p className="text-sm text-primary mt-1 font-medium">{filmData.origin_name}</p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
                            {filmData.year && (
                                <span className="text-sm text-white/65 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-white/40" />{filmData.year}
                                </span>
                            )}
                            {filmData.time && (
                                <span className="text-sm text-white/65 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-white/40" />{filmData.time}
                                </span>
                            )}
                            {filmData.country?.[0]?.name && (
                                <span className="text-sm text-white/65 flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-white/40" />{filmData.country[0].name}
                                </span>
                            )}
                            {filmData.episode_current && (
                                <span className="text-sm text-white/65 flex items-center gap-1.5">
                                    <List className="w-3.5 h-3.5 text-white/40" />{filmData.episode_current}
                                </span>
                            )}
                            {imdbScore > 0 && (
                                <div className="border border-[#f5c518] rounded px-1.5 py-0.5 flex items-center gap-1 text-[11px] text-white leading-tight">
                                    <span className="text-[#f5c518] font-black">IMDb</span>
                                    <span>{imdbScore.toFixed(1)}</span>
                                </div>
                            )}
                            {!imdbScore && tmdbScore > 0 && (
                                <div className="border border-[#f5c518] rounded px-1.5 py-0.5 flex items-center gap-1 text-[11px] text-white leading-tight">
                                    <span className="text-[#f5c518] font-black">TMDB</span>
                                    <span>{tmdbScore.toFixed(1)}</span>
                                </div>
                            )}
                            {filmData.view > 0 && (
                                <span className="text-sm text-white/55 flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5 text-white/40" />
                                    {fmtViews(filmData.view)}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5 mt-4 flex-wrap">
                            {hasValidEpisodes ? (
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => router.push(`/film/${slug}/watch`)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
                                >
                                    <Play className="w-4 h-4 fill-white" />
                                    Xem Ngay
                                    {firstEp && <span className="text-white/60 text-xs">- {firstEp.name}</span>}
                                </motion.button>
                            ) : (
                                <div className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 text-zinc-400 font-bold text-sm rounded-xl border border-white/5 cursor-not-allowed">
                                    <Clock className="w-4 h-4" />
                                    Sắp chiếu
                                </div>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={handleFavorite}
                                className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl border transition-all ${isFavorited
                                    ? 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                                    : 'bg-white/10 text-white border-white/15 hover:bg-white/20'}`}
                            >
                                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-400' : ''}`} />
                                {isFavorited ? 'Đã Thích' : 'Yêu Thích'}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 xl:gap-8 p-4">
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4"
                >
                    <div className="bg-card rounded-md p-5 space-y-7">
                        <div>
                            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                Giới thiệu
                            </h2>
                            {description ? (
                                <>
                                    <p className={`text-sm text-foreground/70 leading-relaxed ${!showFullDesc ? 'line-clamp-4' : ''}`}>
                                        {description}
                                    </p>
                                    {description.length > 200 && (
                                        <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-xs text-primary hover:underline font-medium">
                                            {showFullDesc ? 'Thu gọn' : 'Xem thêm'}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Chưa có mô tả</p>
                            )}
                        </div>
                        <div className="border-t border-border/50" />
                        <div className="space-y-2.5">
                            {[
                                { label: 'Năm', value: filmData.year },
                                { label: 'Quốc gia', value: filmData.country?.[0]?.name },
                                { label: 'Thời lượng', value: filmData.time },
                                { label: 'Số tập', value: filmData.episode_current },
                            ].filter(x => x.value).map(({ label, value }) => (
                                <div key={label} className="flex items-center gap-2.5">
                                    <span className="text-foreground/80 text-xs w-25 shrink-0">{label}:</span>
                                    <span className="text-muted-foreground font-medium text-xs truncate">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-border/50" />
                        {filmData.category?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                <h2 className="px-2.5 py-1 text-xs font-bold text-muted-foreground">Thể loại: </h2>
                                {filmData.category.map((c: any) => (
                                    <Link key={c.id} href={APP_ROUTES.FILM.SEARCH + '?category=' + c.slug}
                                        className="px-2.5 py-1 bg-primary/10 text-primary text-[11px] font-semibold rounded-lg border border-primary/20 hover:bg-primary/25 transition-colors">
                                        {c.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>


                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-2xl w-fit">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${activeTab === t.key
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'episodes' && (
                            <motion.div key="episodes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                                {!hasValidEpisodes ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white/5 rounded-2xl border border-white/5 text-zinc-400">
                                        <Clock className="w-10 h-10 mb-3 opacity-20" />
                                        <p className="text-sm font-medium">Phim chưa có tập chính thức</p>
                                    </div>
                                ) : (
                                    <>

                                        <div className="flex items-center justify-between flex-wrap gap-4 py-2 border-b border-white/5">
                                            <div className="flex items-center gap-3">
                                                {/* <button className="flex items-center gap-2 text-sm font-bold text-white hover:text-amber-400 transition-colors">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="w-4 h-0.5 bg-amber-400 rounded-full" />
                                                    <span className="w-4 h-0.5 bg-amber-400 rounded-full" />
                                                    <span className="w-4 h-0.5 bg-amber-400 rounded-full" />
                                                </div>
                                                <span>Phần 2</span>
                                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                                            </button>

                                            <span className="text-zinc-700">|</span> */}

                                                <div className="flex items-center gap-2">
                                                    {apiData?.episodes.map((s: any, idx: number) => {
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
                                                    {epChunks.map((chunk, i) => {
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
                                                                    : 'bg-primary/20 text-foreground/50 hover:bg-primary/20'
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
                                                        const active = false;
                                                        return (
                                                            <button
                                                                key={ep.slug}
                                                                onClick={() => handleEpSelect(ep)}
                                                                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${active
                                                                    ? 'bg-primary text-zinc-950 shadow-md font-bold'
                                                                    : 'bg-[#1c2130] text-zinc-300 hover:bg-primary/20 border border-white/5'
                                                                    }`}
                                                            >
                                                                <Play
                                                                    className={`w-2.5 h-2.5 ${active ? 'fill-zinc-950' : 'fill-zinc-300'}`}
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
                                                        const active = false;
                                                        return (
                                                            <div
                                                                key={ep.slug}
                                                                onClick={() => handleEpSelect(ep)}
                                                                className="group cursor-pointer space-y-1.5"
                                                            >
                                                                <div
                                                                    className='relative w-full aspect-video rounded-xl overflow-hidden transition-all'
                                                                >
                                                                    <Image
                                                                        src={posterSrc}
                                                                        alt={ep.name}
                                                                        fill
                                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                                    />
                                                                    {active ? (
                                                                        <div className="absolute left-2 bottom-2 z-10 px-2 py-0.5 rounded bg-amber-400 text-zinc-950 text-[10px] font-bold shadow">
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
                                                                        ? 'text-amber-400'
                                                                        : 'text-zinc-300 group-hover:text-white'
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
                            </motion.div>
                        )}

                        {activeTab === 'cast' && (
                            <motion.div key="cast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
                                {filmData.actor?.length > 0 && (
                                    <div className="p-5 space-y-3">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            Diễn viên
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {filmData.actor.slice(0, 16).map((a: string) => (
                                                <div key={a} className="flex items-center gap-2 p-2 bg-muted/40 rounded-xl border border-border/50">
                                                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                        <Users className="w-3 h-3 text-primary" />
                                                    </div>
                                                    <span className="text-xs text-foreground/80 font-medium truncate">{a}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {filmData.director?.length > 0 && filmData.director[0] !== 'Đang cập nhật' && (
                                    <div className="bg-card border border-border rounded-2xl p-5 space-y-2">
                                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <Clapperboard className="w-4 h-4 text-primary" /> Đạo diễn
                                        </h3>
                                        <p className="text-sm text-foreground/80">{filmData.director.join(', ')}</p>
                                    </div>
                                )}
                                {!filmData.actor?.length && (
                                    <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">Chưa có thông tin diễn viên</div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'trailer' && (
                            <motion.div key="trailer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                                    <iframe
                                        src={filmData.trailer_url.replace('watch?v=', 'embed/')}
                                        title="Trailer"
                                        className="w-full h-full"
                                        allowFullScreen
                                        allow="autoplay; fullscreen"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

            </div>
        </div>
    );
}
