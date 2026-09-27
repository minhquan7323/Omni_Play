'use client';

import { DroppableList } from '@/components/DroppableList';
import { DraggableItemsRegistry, DroppableId } from '@/constants/dnd.constant';
import { SidebarId } from '@/constants/sidebar.constant';
import { MusicService } from '@/services';
import { setTrack, togglePlay } from '@/store/slices/musicPlayer.slice';
import { setOpen } from '@/store/slices/sidebar.slice';
import { getDominantColor } from '@/utils/color.util';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { AlbumCard } from '../../_component/cards/album.card';
import { QueueCard } from '../../_component/cards/queue.card';
import { MusicSection } from '../../_component/list/MusicSection';
import { TrackRow } from '../../_component/list/TrackRow';
import { PlayPauseButton } from '../../_component/ui/PlayPauseButton';
import { fmtNumber, spotifyImg } from '../../_utils/music.util';
import { musicKeys } from '../../_constants/music.keys';

export default function ArtistPage() {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    const [showTopBar, setShowTopBar] = useState(false);
    const [dominantColor, setDominantColor] = useState('');

    const actionBarRef = useRef<HTMLDivElement>(null);

    const { currentTrack, isPlaying } = useSelector((state: any) => state.musicPlayer, shallowEqual);

    const { data: artist, isLoading: artistLoading } = useQuery({
        queryKey: musicKeys.artistDetail(id),
        queryFn: () => MusicService.getArtistDetail(id),
        select: (res: any) => res?.data,
        enabled: !!id,
    });

    const { data: albums, isLoading: albumsLoading } = useQuery({
        queryKey: musicKeys.artistAlbums(id),
        queryFn: () => MusicService.getArtistAlbums(id),
        select: (res: any) => res?.data?.items ?? [],
        enabled: !!id,
    });

    const { data: singles, isLoading: singlesLoading } = useQuery({
        queryKey: musicKeys.artistAlbums(id),
        queryFn: () => MusicService.getArtistAlbums(id),
        select: (res: any) => res?.data?.items ?? [],
        enabled: !!id,
    });

    const { data: checkIsFollowingArtist } = useQuery({
        queryKey: musicKeys.checkLibraryItem('FAVORITE_ARTIST', id),
        queryFn: () => MusicService.checkLibraryItem('FAVORITE_ARTIST', id),
        select: (res: any) => res?.data,
        enabled: !!id,
    });

    const followMutation = useMutation({
        mutationFn: () => MusicService.toggleLibraryItem('FAVORITE_ARTIST', id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: musicKeys.checkLibraryItem('FAVORITE_ARTIST', id) });
            queryClient.invalidateQueries({ queryKey: musicKeys.userPlaylists() });
        }
    })

    const handleFollow = (id) => {
        followMutation.mutate(id);
    }

    const img = artist?.image;

    useEffect(() => {
        if (img) {
            getDominantColor(img).then((color) => {
                setDominantColor(color);
            });
        }
    }, [img]);

    useEffect(() => {
        const actionSentinel = actionBarRef.current;
        if (!actionSentinel) return;

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
            });
        }, observerOptions);

        observer.observe(actionSentinel);

        return () => observer.disconnect();
    }, [artist]);

    const topTracks = artist?.tracks;

    const handlePlayAll = () => {
        if (!topTracks?.length) return;
        const enriched = topTracks.map((t: any) => ({
            ...t,
            albumCover: t.album?.images?.[0]?.url ?? t.albumCover,
        }));
        dispatch(setTrack({ track: enriched[0], context: enriched, contextName: artist?.name ?? '' }));
        dispatch(setOpen({ id: SidebarId.MUSIC_RIGHT, isOpen: true }));
    };

    if (artistLoading) {
        return (
            <div className="animate-pulse space-y-6 pb-24 px-6 pt-6">
                <div className="h-64 bg-muted rounded-xl" />
                <div className="space-y-2">
                    <div className="h-8 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/5" />
                </div>
            </div>
        );
    }

    if (!artist) return <p className="text-muted-foreground px-6 pt-6">Không tìm thấy nghệ sĩ.</p>;

    const artistIsPlaying = topTracks?.some((t: any) => t?.id === currentTrack?.id) && isPlaying;

    return (
        <div className="relative z-0 pb-8">
            <div className="sticky top-0 z-40 w-full h-16 flex items-center">
                <div
                    className={`absolute inset-0 transition-opacity duration-300 ${showTopBar ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundColor: dominantColor }}
                />
                <div className="relative z-10 flex items-center gap-4 w-full mx-6">
                    <div className={`flex items-center gap-4 transition-all duration-300 min-w-0 ${showTopBar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                        <PlayPauseButton
                            isPlaying={artistIsPlaying}
                            onClick={() => {
                                if (artistIsPlaying) dispatch(togglePlay());
                                else handlePlayAll();
                            }}
                            className={`w-12 h-12 text-foreground bg-primary/80 hover:bg-primary hover:scale-105 shadow-lg`}
                            iconClassName="w-6 h-6"
                        />
                        <h1 className="text-2xl font-bold text-white truncate">{artist.name}</h1>
                    </div>
                </div>
            </div>

            <div className="absolute top-0 left-0 w-full h-[536px] -z-10">
                <div className="absolute inset-0">
                    <Image src={img} alt={artist.name} fill className="object-cover object-top" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-popover via-popover/40 to-transparent" />
                </div>
            </div>

            <div className="px-6 relative z-10 h-[536px] flex flex-col justify-end pb-6 mt-[-64px]">

                <h1 className="text-5xl sm:text-8xl font-black text-white mb-6 tracking-tighter" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {artist.name}
                </h1>
                {artist.followers?.total != null && (
                    <p className="text-white/80 font-medium drop-shadow-sm">
                        {fmtNumber(artist.followers.total)} người nghe hàng tháng
                    </p>
                )}
            </div>

            <div className={`bg-gradient-to-b from-${dominantColor} via-popover to-popover mx-6 py-6 h-full flex-1 relative z-10`}>
                <div ref={actionBarRef} className="h-px w-full absolute top-[-64px]" />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="flex items-center gap-6 mb-8 mt-2"
                >
                    <PlayPauseButton
                        isPlaying={artistIsPlaying}
                        onClick={() => {
                            if (artistIsPlaying) dispatch(togglePlay());
                            else handlePlayAll();
                        }}
                        className={`w-12 h-12 text-foreground bg-primary/80 hover:bg-primary hover:scale-105 shadow-lg`}
                        iconClassName="w-6 h-6"
                    />
                    <button
                        onClick={() => handleFollow(id)}
                        className="px-4 py-1.5 rounded-full border border-white/50 text-white font-bold text-sm hover:border-white hover:scale-105 transition-all">
                        {checkIsFollowingArtist?.isToggled ? 'Following' : 'Follow'}
                    </button>
                    <button className="text-muted-foreground hover:text-white transition-colors">
                        <MoreHorizontal className="w-8 h-8" />
                    </button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">Phổ biến</h2>
                        {artistLoading ? (
                            <div className="space-y-2">
                                {Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                                        <div className="w-10 h-10 bg-muted rounded" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 bg-muted rounded w-1/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : topTracks && topTracks.length > 0 ? (
                            <DroppableList
                                droppableId={DroppableId.TRACK_LIST}
                                isDropDisabled={true}
                                items={topTracks.slice(0, 5)}
                                keepOriginal={true}
                                keyExtractor={(track: any, i: number) => `artist-track-${track.id}-${i}`}
                                containerClassName="space-y-1"
                                renderClone={(track: any) => {
                                    if (!track) return <div />;
                                    const enrichedTrack = { ...track, albumCover: track.album?.images?.[0]?.url ?? track.albumCover };
                                    return <QueueCard item={enrichedTrack} className="w-[300px] bg-popover rounded-md shadow-xl" />;
                                }}
                                renderItem={(track: any, i: number) => {
                                    if (!track) return null;
                                    const enrichedTrack = {
                                        ...track,
                                        albumCover: track.album?.images?.[0]?.url ?? track.albumCover,
                                    };
                                    DraggableItemsRegistry[`artist-track-${track.id}-${i}`] = enrichedTrack;
                                    return (
                                        <TrackRow
                                            key={`${track.id}-${i}`}
                                            track={enrichedTrack}
                                            context={topTracks}
                                            contextName={artist?.name ?? ''}
                                            index={i + 1}
                                            isPlaying={currentTrack?.id === track.id && isPlaying}
                                            showThumbnail={true}
                                            showAlbum={false}
                                            showArtistColumn={false}
                                        />
                                    );
                                }}
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">Không có bài hát nào.</p>
                        )}
                    </div>

                    <div className="hidden lg:block">
                        <h2 className="text-2xl font-bold mb-4">Lựa chọn của nghệ sĩ</h2>
                        <div className="relative overflow-hidden rounded-lg cursor-pointer group bg-popover">
                            <div className="absolute inset-0 z-0 ">
                                {img && <Image src={img} alt={artist.name} fill className="object-cover object-center transition-transform duration-500 " priority />}
                                <div className="absolute inset-0 bg-gradient-to-t from-popover via-popover/50 to-transparent"></div>
                            </div>
                            {!albumsLoading && albums && albums.length > 0 && (
                                <div
                                    className="relative z-10 p-4 h-[250px] flex flex-col justify-end"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (albums[0].tracks?.length) {
                                            dispatch(setTrack({ track: albums[0].tracks[0], context: albums[0].tracks, contextName: albums[0].name }));
                                            dispatch(setOpen({ id: SidebarId.MUSIC_RIGHT, isOpen: true }));
                                        }
                                    }}
                                >

                                    <div className="flex items-center gap-3">
                                        <div className={`w-24 h-24 bg-gradient-to-t from-${dominantColor} via-popover to-popover relative rounded overflow-hidden shadow-lg flex-shrink-0`}>
                                            <Image src={albums[0].image} alt={albums[0].name} fill className="object-cover" />
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-white font-bold text-lg line-clamp-2">{albums[0].name}</span>
                                            <span className="text-white/70 text-sm capitalize">{albums[0].type}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-12 space-y-12">
                    {(albumsLoading || (albums && albums.length > 0)) && (
                        <MusicSection title="Albums" loading={albumsLoading} skeletonCount={5}>
                            {albums?.map((a: any) => <AlbumCard key={a.id} album={a} />)}
                        </MusicSection>
                    )}

                    {/* Singles */}
                    {(singlesLoading || (singles && singles.length > 0)) && (
                        <MusicSection title="Singles & EPs" loading={singlesLoading} skeletonCount={5}>
                            {singles?.map((a: any) => <AlbumCard key={a.id} album={a} />)}
                        </MusicSection>
                    )}
                </div>
            </div>
        </div >
    );
}
