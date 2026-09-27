'use client';

import { DroppableId } from '@/constants/dnd.constant';
import { MusicService } from '@/services/music/music.service';
import { useQuery } from '@tanstack/react-query';
import { AlbumCard, AlbumCardSkeleton } from './_component/cards/album.card';
import { ArtistCard, ArtistCardSkeleton } from './_component/cards/artist.card';
import { TrackCard, TrackCardSkeleton } from './_component/cards/track.card';
import { Carousel } from './_component/common/carousel';
import { musicKeys } from './_constants/music.keys';


export default function MusicHomePage() {
    const { data: newReleases, isLoading: isNewReleasesLoading } = useQuery({
        queryKey: [musicKeys.newReleases()],
        queryFn: MusicService.getNewReleases,
    });

    const { data: popularArtists, isLoading: isPopularArtistsLoading } = useQuery({
        queryKey: [musicKeys.popularArtists()],
        queryFn: MusicService.getPopularArtists,
    });

    const { data: trendingTracks, isLoading: isTrendingTracksLoading } = useQuery({
        queryKey: [musicKeys.trendingTracks()],
        queryFn: MusicService.getTrendingTracks,
    });

    const { data: artistRadio, isLoading: isArtistRadioLoading } = useQuery({
        queryKey: musicKeys.artistRadio(popularArtists?.data?.[0]?.id ?? ''),
        queryFn: () => MusicService.getArtistRadio(popularArtists!.data[0].id),
        enabled: !!popularArtists?.data?.[0]?.id,
    });

    return (
        <div className="py-2 pl-2 pr-1 space-y-8">
            <main className="flex-1 w-full h-full bg-popover rounded-lg overflow-y-auto relative pb-10 custom-scrollbar">
                <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"></div>
                <div className="py-2 pl-2 pr-1 space-y-8">
                    <Carousel
                        title={popularArtists?.data?.[0]?.name}
                        label="More like"
                        avatarUrl={popularArtists?.data?.[0]?.image}
                        isLoading={isArtistRadioLoading || isPopularArtistsLoading}
                        renderSkeleton={() => <TrackCardSkeleton />}
                    >
                        {artistRadio?.data?.tracks?.map((track: any) => (
                            <TrackCard key={track.id} track={track} queue={artistRadio.data.tracks} />
                        ))}
                        {artistRadio?.data?.artists?.map((artist: any) => (
                            <ArtistCard key={artist.id} artist={artist} />
                        ))}
                    </Carousel>
                    <Carousel
                        title="Popular tracks"
                        // showAllHref="#"
                        items={trendingTracks?.data}
                        isLoading={isTrendingTracksLoading}
                        renderSkeleton={() => <TrackCardSkeleton />}
                        droppableId={DroppableId.MAIN_CONTENT_TRACKS}
                        renderClone={(track: any) => (
                            <TrackCard
                                track={track}
                                queue={trendingTracks?.data}
                            />
                        )}
                        renderItem={(track, index) => (
                            <TrackCard key={track.id} track={track} queue={trendingTracks?.data} />
                        )}
                    />
                    <Carousel
                        title="Popular albums and singles"
                        // showAllHref="#"
                        items={newReleases?.data}
                        isLoading={isNewReleasesLoading}
                        renderSkeleton={() => <AlbumCardSkeleton />}
                        droppableId={DroppableId.MAIN_CONTENT_ALBUMS}
                        renderClone={(album: any) => (
                            <AlbumCard album={album} />
                        )}
                        renderItem={(album, index) => (
                            <AlbumCard key={album.id} album={album} />
                        )}
                    />
                    <Carousel
                        title="Popular artists"
                        // showAllHref="#"
                        items={popularArtists?.data}
                        isLoading={isPopularArtistsLoading}
                        renderSkeleton={() => <ArtistCardSkeleton />}
                        renderItem={(artist, index) => (
                            <ArtistCard key={artist.id} artist={artist} />
                        )}
                    />
                </div>
            </main>
        </div>
    );
}