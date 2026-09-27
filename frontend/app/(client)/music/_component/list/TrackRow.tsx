'use client';

import { useAudio } from '@/providers/audio.provider';
import { setTrack, togglePlay } from '@/store/slices/musicPlayer.slice';
import { MoreHorizontal, Pause, Play } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import { artistNames, formatTime, spotifyImg } from '../../_utils/music.util';
import AudioVisualizer from '../player/AudioVisualizer';
import { TrackContextMenu } from '../ui/TrackContextMenu';
import Link from 'next/link';
import { APP_ROUTES } from '@/constants/routes.constant';

interface TrackRowProps {
    track: any;
    index?: number;
    isPlaying?: boolean;
    context?: any[];
    contextName?: string;
    onPlay?: (track: any) => void;
    showAlbum?: boolean;
    showThumbnail?: boolean;
    showArtistColumn?: boolean;
}

export function TrackRow({
    track,
    index,
    isPlaying = false,
    context,
    contextName,
    showThumbnail = true,
    showArtistColumn = false,
}: TrackRowProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ track: any; x: number; y: number } | null>(null);
    const dispatch = useDispatch();
    const { audioElement } = useAudio();

    const img = spotifyImg(track?.album?.images) || track?.albumCover || track?.thumbnailUrl || '';

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ track, x: e.clientX, y: e.clientY });
    };

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlaying) {
            dispatch(togglePlay());
        } else {
            dispatch(setTrack({
                track,
                context: context ?? undefined,
                contextName: contextName ?? track?.album?.name ?? '',
            }));
        }
    };

    return (
        <div
            className={`w-full group flex items-center px-4 py-2 rounded-lg transition-colors cursor-pointer ${isPlaying ? 'bg-white/5' : 'hover:bg-white/10'}`}
            onContextMenu={handleContextMenu}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4 text-muted-foreground font-medium relative">
                {isHovered ? (
                    <button onClick={handlePlayPause} className="flex items-center justify-center w-full h-full z-10">
                        {isPlaying ? (
                            <Pause className="w-4 h-4 text-[#1ed760] fill-[#1ed760]" />
                        ) : (
                            <Play className="w-4 h-4 text-foreground fill-foreground ml-0.5" />
                        )}
                    </button>
                ) : (
                    <div className="flex items-center justify-center w-full h-full pointer-events-none">
                        {isPlaying ? (
                            <AudioVisualizer audioElement={audioElement} barCount={6} />
                        ) : (
                            <span className="text-[15px]">{index}</span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-[2] min-w-0 flex items-center gap-3 pr-2">
                {showThumbnail && img && (
                    <div className="w-10 h-10 flex-shrink-0 relative rounded overflow-hidden bg-muted">
                        <Image src={img} alt={track?.title || ''} fill sizes="40px" className="object-cover" />
                    </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className={`text-[15px] font-medium truncate ${isPlaying ? 'text-[#1ed760]' : 'text-foreground'}`}>
                        {track?.title}
                    </p>
                    {!showArtistColumn && (
                        <p className="text-[13px] text-muted-foreground truncate hover:underline cursor-pointer hover:text-foreground transition-colors">
                            {artistNames(track?.artists)}
                        </p>
                    )}
                </div>
            </div>

            {showArtistColumn && (
                <Link
                    href={APP_ROUTES.MUSIC.ARTIST(track?.artists[0]?.id)}
                    className="hidden md:flex flex-1 min-w-0 items-center pr-2">
                    <p className="text-[14px] text-muted-foreground truncate hover:underline cursor-pointer hover:text-foreground transition-colors">
                        {artistNames(track?.artists)}
                    </p>
                </Link>
            )}

            <div className="flex-shrink-0 flex items-center justify-end gap-3 text-muted-foreground pr-1">
                <span className="text-[14px] w-10 text-right tabular-nums">
                    {formatTime(track?.duration)}
                </span>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button
                        className="p-1.5 rounded-full hover:bg-white/10 text-foreground/60 hover:text-foreground hover:scale-105 transition"
                        onClick={handleContextMenu}
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {contextMenu && typeof document !== 'undefined' && createPortal(
                <TrackContextMenu contextMenu={contextMenu} onClose={() => setContextMenu(null)} />,
                document.body
            )}
        </div>
    );
}