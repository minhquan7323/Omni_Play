import { SidebarId } from '@/constants/sidebar.constant';
import {
    nextTrack,
    prevTrack,
    setProgress,
    setRepeat,
    setVolume,
    toggleMiniplayer,
    toggleMute,
    togglePlay,
    toggleShuffle
} from '@/store/slices/musicPlayer.slice';
import { toggleOpen } from '@/store/slices/sidebar.slice';
import { Disc, ListMusic, Mic2, PictureInPicture2, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import AudioVisualizer from '../player/AudioVisualizer';
import { formatTime, artistNames } from '../../_utils/music.util';
import { RepeatMode } from '@/constants/music.contant';
import { CustomSlider } from '../ui/CustomSlider';
import MarqueeText from '../ui/MarqueeText';
import { useAudio } from '@/providers/audio.provider';
import { PlayPauseButton } from '../ui/PlayPauseButton';
import { APP_ROUTES } from '@/constants/routes.constant';

export function BottomPlayer() {
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const isLyricPage = pathname === APP_ROUTES.MUSIC.LYRIC;
    const { currentTrack, shuffle, isMiniplayer, isPlaying, repeat, volume, isMuted, duration, progress } = useSelector((state: any) => state.musicPlayer, shallowEqual);
    const sidebar = useSelector((state: any) => state.sidebar?.[SidebarId.MUSIC_RIGHT], shallowEqual);

    const { audioElement } = useAudio();
    const hasTrack = !!currentTrack;

    const [dragProgress, setDragProgress] = useState<number | null>(null);

    const handleProgressCommit = (newTime: number) => {
        if (audioElement) audioElement.currentTime = newTime;
        dispatch(setProgress(newTime));
        setDragProgress(null);
    };

    const handleVolumeChange = (newVolume: number) => {
        dispatch(setVolume(newVolume));
        if (isMuted && newVolume > 0) dispatch(toggleMute());
    };

    const handleCycleRepeat = () => {
        if (!hasTrack) return;
        const nextMode = repeat === RepeatMode.NONE ? RepeatMode.ALL : repeat === RepeatMode.ALL ? RepeatMode.ONE : RepeatMode.NONE;
        dispatch(setRepeat(nextMode));
    };

    const handleTogglePiP = () => {
        // @ts-ignore
        const pipWindow = window.documentPictureInPicture?.window;
        if (isMiniplayer) {
            if (pipWindow) { pipWindow.close(); } else { dispatch(toggleMiniplayer()); }
        } else {
            dispatch(toggleMiniplayer());
        }
    };

    const imageUrl = currentTrack?.thumbnailUrl || currentTrack?.albumCover;
    const displayVolume = isMuted ? 0 : volume;
    const VolumeIcon = displayVolume === 0 ? VolumeX : displayVolume < 0.5 ? Volume1 : Volume2;

    const currentDuration = Number.isFinite(duration) && duration > 0 ? duration : currentTrack?.duration ?? 1;

    return (
        <footer className="relative h-20 bg-background shrink-0 select-none z-30">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-15 overflow-hidden flex items-end">
                <AudioVisualizer audioElement={audioElement} barCount={256} />
            </div>

            <div className={`absolute top-0 left-0 w-full z-50 -translate-y-1/2 transition-opacity duration-300 ${!hasTrack ? 'opacity-30 pointer-events-none' : ''}`}>
                <CustomSlider
                    value={dragProgress !== null ? dragProgress : progress}
                    max={currentDuration}
                    disabled={!hasTrack}
                    onChange={setDragProgress}
                    onCommit={handleProgressCommit}
                    showTooltip={true}
                    formatTooltip={formatTime}
                    rounded={false}
                />
            </div>

            <div className="relative z-10 h-full flex items-center justify-between pt-2 px-2 sm:px-4">
                <div className="flex items-center gap-2 sm:gap-3 w-[30%] sm:w-1/3 max-w-[180px] sm:max-w-[250px] shrink-0">
                    <div className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center transition-all duration-500
                        ${hasTrack ? 'bg-secondary/50 shadow-md' : 'bg-transparent border border-dashed border-border/60'}
                        ${isPlaying && hasTrack ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                        {hasTrack && imageUrl ? (
                            <Image src={imageUrl} alt={currentTrack.title} fill sizes="56px" className="object-cover" />
                        ) : (
                            <Disc className={`w-5 h-5 sm:w-6 sm:h-6 ${hasTrack ? 'text-muted-foreground/50' : 'text-muted-foreground/30'}`} strokeWidth={2} />
                        )}
                        {hasTrack && <div className="absolute inset-0 m-auto w-3 h-3 bg-background rounded-full z-10 border border-zinc-700/30 pointer-events-none" />}
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
                        {hasTrack ? (
                            <>
                                <MarqueeText text={currentTrack.title} isPlaying={isPlaying} textClassName="text-xs sm:text-sm font-semibold text-foreground hover:underline cursor-pointer" />
                                <MarqueeText text={artistNames(currentTrack.artists) || 'Unknown Artist'} isPlaying={isPlaying} textClassName="text-[11px] sm:text-xs text-muted-foreground hover:underline cursor-pointer" />
                            </>
                        ) : (
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground/70 truncate">Chưa phát nhạc</span>
                                <span className="text-[10px] sm:text-[11px] text-muted-foreground/40 truncate">Hãy chọn một bài hát...</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1 flex-1 px-2 min-w-0">
                    <div className={`flex items-center gap-4 sm:gap-6 text-muted-foreground shrink-0 transition-opacity duration-300 ${!hasTrack ? 'opacity-30 pointer-events-none' : ''}`}>
                        <button onClick={() => hasTrack && dispatch(toggleShuffle())} className={`hidden sm:block ${shuffle ? 'text-primary' : 'hover:text-foreground transition-colors'}`}>
                            <Shuffle className="w-6 h-6" strokeWidth={2.5} />
                        </button>
                        <SkipBack onClick={() => dispatch(prevTrack())} className="w-6 h-6 hover:text-foreground cursor-pointer shrink-0 transition-colors" strokeWidth={2.5} />
                        <PlayPauseButton
                            isPlaying={isPlaying}
                            onClick={() => dispatch(togglePlay())}
                            disabled={!hasTrack}
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-foreground shrink-0 transition-all
                                ${hasTrack ? 'bg-primary/80 hover:bg-primary hover:scale-105 shadow-lg' : 'text-muted-foreground bg-secondary/50 cursor-not-allowed'}`}
                            iconClassName="w-7 h-7"
                        />
                        <SkipForward onClick={() => dispatch(nextTrack(undefined))} className="w-6 h-6 hover:text-foreground cursor-pointer shrink-0 transition-colors" strokeWidth={2.5} />
                        <button onClick={handleCycleRepeat} className={`hidden sm:block relative ${repeat !== RepeatMode.NONE ? 'text-primary' : 'hover:text-foreground transition-colors'}`}>
                            {repeat === RepeatMode.ONE ? <Repeat1 className="w-6 h-6" strokeWidth={2.5} /> : <Repeat className="w-6 h-6" strokeWidth={2.5} />}
                            {repeat === RepeatMode.ALL && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
                        </button>
                    </div>
                </div>

                <div className={`hidden md:flex items-center justify-end gap-3 sm:gap-4 w-[30%] sm:w-1/3 max-w-[180px] sm:max-w-[250px] shrink-0 z-10 text-muted-foreground transition-opacity duration-300 ${!hasTrack ? 'opacity-30 pointer-events-none' : ''}`}>
                    <button
                        onClick={() => {
                            if (isLyricPage) {
                                window.dispatchEvent(new CustomEvent('close-lyric-page'));
                            } else {
                                router.push(APP_ROUTES.MUSIC.LYRIC);
                            }
                        }}
                        disabled={!hasTrack}
                        className={`shrink-0 transition-colors disabled:opacity-30 ${isLyricPage ? 'text-primary' : 'hover:text-foreground'}`}
                    >
                        <Mic2 className="w-6 h-6 hidden lg:block" strokeWidth={2.5} />
                    </button>
                    <button onClick={() => dispatch(toggleOpen({ id: SidebarId.MUSIC_RIGHT }))} disabled={!hasTrack} className={`${sidebar.isOpen ? 'text-primary' : 'hover:text-foreground'} shrink-0 transition-colors`}>
                        <ListMusic className="w-6.5 h-6.5" strokeWidth={2.5} />
                    </button>
                    <div className="hidden lg:flex items-center gap-1.5 ml-1 shrink-0">
                        <VolumeIcon onClick={() => dispatch(toggleMute())} className="w-6 h-6 hover:text-foreground cursor-pointer shrink-0 transition-colors" strokeWidth={2.5} />
                        <CustomSlider
                            value={displayVolume}
                            max={1}
                            disabled={!hasTrack}
                            onChange={handleVolumeChange}
                            onCommit={handleVolumeChange}
                            containerClass="w-20"
                            thumbClass="w-2.5 h-2.5"
                        />
                    </div>
                    <button onClick={handleTogglePiP} className={`shrink-0 transition-colors ml-1 ${isMiniplayer ? 'text-primary' : 'hover:text-foreground'}`}>
                        <PictureInPicture2 className="w-6 h-6" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </footer>
    );
}