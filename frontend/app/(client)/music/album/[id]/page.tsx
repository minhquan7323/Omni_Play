'use client';

import { MusicService } from '@/services';
import { togglePlay } from '@/store/slices/musicPlayer.slice';
import { getDominantColor } from '@/utils/color.util';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, Heart, MoreHorizontal, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { TrackRow } from '../../_component/list/TrackRow';
import { PlayPauseButton } from '../../_component/ui/PlayPauseButton';
import { spotifyImg } from '../../_utils/music.util';
import { DroppableList } from '@/components/DroppableList';
import { DroppableId, DraggableItemsRegistry } from '@/constants/dnd.constant';
import { QueueCard } from '../../_component/cards/queue.card';
import { APP_ROUTES } from '../../../../../constants/routes.constant';
import { musicKeys } from '../../_constants/music.keys';
import { LIBRARY_ITEM_TYPE } from '../../_constants/types';

export default function AlbumPage() {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    const [showTopBar, setShowTopBar] = useState(false);
    const [isListHeaderStuck, setIsListHeaderStuck] = useState(false);
    const [dominantColor, setDominantColor] = useState('');

    const actionBarRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const { currentTrack, isPlaying } = useSelector((state: any) => state.musicPlayer, shallowEqual);
    const auth = useSelector((state: any) => state.auth);

    const { data: album, isLoading } = useQuery({
        queryKey: [musicKeys.albumDetail(id)],
        queryFn: () => MusicService.getAlbumDetail(id),
        select: (res: any) => res?.data,
        enabled: !!id,
    });


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
    }, [album]);

    const img = album?.image;

    useEffect(() => {
        if (img) {
            getDominantColor(img).then((color) => {
                setDominantColor(color);
            });
        }
    }, [img]);

    const { data: checkIsSavedAlbum } = useQuery({
        queryKey: musicKeys.checkLibraryItem(LIBRARY_ITEM_TYPE.ALBUM, id),
        queryFn: () => MusicService.checkLibraryItem(LIBRARY_ITEM_TYPE.ALBUM, id),
        select: (res: any) => res?.data,
        enabled: !!id && auth.isAuthenticated,
    });

    const saveAlbumMutation = useMutation({
        mutationFn: (id: string) => MusicService.toggleLibraryItem(LIBRARY_ITEM_TYPE.ALBUM, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: musicKeys.checkLibraryItem(LIBRARY_ITEM_TYPE.ALBUM, id) });
            queryClient.invalidateQueries({ queryKey: musicKeys.userPlaylists() });
        }
    })

    const handleSaveAlbum = (id: string) => {
        saveAlbumMutation.mutate(id);
    }

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-6 pb-24 px-6 pt-6">
                <div className="flex gap-6">
                    <div className="w-48 h-48 bg-muted rounded-lg flex-shrink-0" />
                    <div className="flex-1 pt-8 space-y-3">
                        <div className="h-4 bg-muted rounded w-20" />
                        <div className="h-10 bg-muted rounded w-2/3" />
                        <div className="h-4 bg-muted rounded w-1/3" />
                    </div>
                </div>
                {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2">
                        <div className="w-6 h-4 bg-muted rounded" />
                        <div className="w-10 h-10 bg-muted rounded" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-muted rounded w-2/3" />
                            <div className="h-2 bg-muted rounded w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!album) return <p className="text-muted-foreground px-6 pt-6">Không tìm thấy album.</p>;

    return (
        <div className="relative z-0 pb-8">
            <div
                className="absolute top-0 left-0 w-full h-[400px] -z-10 transition-colors duration-700 pointer-events-none"
                style={{
                    backgroundImage: dominantColor ? `linear-gradient(to bottom, ${dominantColor}, rgba(0,0,0,0))` : 'none',
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
                            isPlaying={isPlaying}
                            onClick={() => dispatch(togglePlay())}
                            className={`w-12 h-12 text-foreground bg-primary/80 hover:bg-primary hover:scale-105 shadow-lg`}
                            iconClassName="w-6 h-6"
                        />
                        <h1 className="text-2xl font-bold text-white truncate">{album.name}</h1>
                    </div>
                </div>
            </div>

            <div className="px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row gap-6 mb-8 items-end"
                >
                    <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex-shrink-0">
                        <Image src={img} alt={album.name} fill sizes="240px" className="rounded-md object-cover" />
                    </div>

                    <div className="flex flex-col justify-end">
                        <p className="text-sm font-semibold text-white/90 drop-shadow-sm">
                            {album.tracks?.length === 1 ? 'Single' : 'Album'}
                        </p>
                        <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 tracking-tighter" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            {album.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-1 text-sm text-white/90 font-medium drop-shadow-sm">
                            {album.artists?.map((a: any, i: number) => (
                                <span key={a.id} className='hover:underline hover:text-accent-foreground'>
                                    <Link href={APP_ROUTES.MUSIC.ARTIST(a.id)}>
                                        {a.name}
                                    </Link>
                                    {i < album.artists.length - 1 && ', '}
                                </span>
                            ))}
                            <span className="mx-1 opacity-70">•</span>
                            <span className="opacity-70">{album.createdAt?.slice(0, 4)}</span>
                            <span className="mx-1 opacity-70">•</span>
                            <span className="opacity-70">{album.tracks.length} songs</span>
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
                        isPlaying={isPlaying}
                        onClick={() => dispatch(togglePlay())}
                        className={`w-12 h-12 text-foreground bg-primary/80 hover:bg-primary hover:scale-105 shadow-lg`}
                        iconClassName="w-6 h-6"
                    />
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <button
                            onClick={() => handleSaveAlbum(album.id)}
                            className="hover:text-white transition-colors">
                            {/* <Plus className="w-4 h-4" /> */}
                            {checkIsSavedAlbum?.isToggled ? <Heart className="w-8 h-8 fill-red-500 text-red-500" /> : <Plus className="w-8 h-8" />}
                        </button>
                        <button className="hover:text-white transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                <div ref={sentinelRef} className="h-px w-full" />

                <div className={`w-full sticky top-16 z-30 flex items-center px-4 py-2 mb-2 text-sm text-muted-foreground transition-colors duration-300 ${isListHeaderStuck ? 'bg-[#181818] shadow-md border-b border-transparent' : 'bg-transparent border-b border-white/10'}`}>
                    <div className="w-8 text-center flex-shrink-0 mr-4">#</div>
                    <div className="flex-[2] min-w-0 font-medium">Title</div>
                    <div className="hidden md:flex flex-1 min-w-0 font-medium2">Artist</div>
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
                        items={album.tracks}
                        keepOriginal={true}
                        keyExtractor={(track: any, i: number) => `album-track-${track.id}-${i}`}
                        containerClassName="space-y-1"
                        renderClone={(track: any) => {
                            const enrichedTrack = { ...track, album, albumCover: album?.image };
                            return <QueueCard item={enrichedTrack} className="w-[300px] bg-popover rounded-md shadow-xl" />;
                        }}
                        renderItem={(track: any, i: number, isDragging: boolean) => {
                            const enrichedTrack = {
                                ...track, album, albumCover: album?.image
                            };
                            const albumContext = album.tracks.map((t: any) => ({
                                ...t,
                                album,
                                albumCover: album?.image,
                            }));
                            DraggableItemsRegistry[`album-track-${track.id}-${i}`] = enrichedTrack;
                            return (
                                <TrackRow
                                    key={`track-${track.id}-${i}`}
                                    track={enrichedTrack}
                                    context={albumContext}
                                    contextName={album.name}
                                    index={i + 1}
                                    isPlaying={currentTrack?.id === track?.id && isPlaying}
                                    showAlbum={false}
                                    showThumbnail={false}
                                    showArtistColumn={true}
                                />
                            );
                        }}
                    />
                </motion.div>

                {/* {album.copyrights?.[0] && (
                    <p className="text-[10px] text-muted-foreground/60 mt-8 px-3">
                        {album.copyrights[0].text}
                    </p>
                )} */}
            </div >
        </div >
    );
}