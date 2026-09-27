import { RepeatMode } from '@/constants/music.contant';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Track {
    id: string;
    title: string;
    artists: { id: string; name: string }[];
    album?: any;
    duration: number;
    thumbnailUrl?: string;
    albumCover?: string;
    audioUrl?: string;
    lyrics?: any;
}

interface MusicPlayerState {
    currentTrack: Track | null;
    userQueue: Track[];
    contextQueue: Track[];
    originalContext: Track[];
    contextName: string;
    history: Track[];

    isPlaying: boolean;
    isBuffering: boolean;
    volume: number;
    volumeBeforeMute: number;
    isMuted: boolean;
    progress: number;
    duration: number;
    repeat: RepeatMode;
    shuffle: boolean;
    showLyrics: boolean;
    isMiniplayer: boolean;
}

const initialState: MusicPlayerState = {
    currentTrack: null,
    userQueue: [],
    contextQueue: [],
    originalContext: [],
    contextName: '',
    history: [],
    isPlaying: false,
    isBuffering: false,
    volume: 1,
    volumeBeforeMute: 1,
    isMuted: false,
    progress: 0,
    duration: 0,
    repeat: RepeatMode.NONE,
    shuffle: false,
    showLyrics: false,
    isMiniplayer: false,
};

export const musicPlayerSlice = createSlice({
    name: 'musicPlayer',
    initialState,
    reducers: {
        setTrack: (
            state,
            action: PayloadAction<{
                track: Track;
                context?: Track[];
                contextName?: string;
            }>
        ) => {
            const { track, context, contextName } = action.payload;

            if (state.currentTrack) {
                state.history.push(state.currentTrack);
            }

            state.currentTrack = track;
            state.duration = track.duration || 0;
            state.progress = 0;
            state.isPlaying = true;

            if (context !== undefined) {
                const idx = context.findIndex((t) => t.id === track.id);
                state.contextQueue = idx >= 0 ? context.slice(idx + 1) : [...context];
                state.originalContext = [...context];
                state.contextName = contextName ?? '';
            }
        },
        playFromUserQueue: (state, action: PayloadAction<number>) => {
            const index = action.payload;
            if (index < 0 || index >= state.userQueue.length) return;

            if (state.currentTrack) {
                state.history.push(state.currentTrack);
            }

            const [track] = state.userQueue.splice(index, 1);
            state.currentTrack = track;
            state.duration = track.duration || 0;
            state.progress = 0;
            state.isPlaying = true;
        },
        playFromContextQueue: (state, action: PayloadAction<number>) => {
            const index = action.payload;
            if (index < 0 || index >= state.contextQueue.length) return;

            if (state.currentTrack) {
                state.history.push(state.currentTrack);
            }

            const track = state.contextQueue[index];
            state.contextQueue = state.contextQueue.slice(index + 1);
            state.currentTrack = track;
            state.duration = track.duration || 0;
            state.progress = 0;
            state.isPlaying = true;
        },
        addToUserQueue: (
            state,
            action: PayloadAction<{ track: Track; atFront?: boolean; insertIndex?: number }>
        ) => {
            const { track, atFront, insertIndex } = action.payload;
            if (insertIndex !== undefined && insertIndex >= 0) {
                state.userQueue.splice(insertIndex, 0, track);
            } else if (atFront) {
                state.userQueue.unshift(track);
            } else {
                state.userQueue.push(track);
            }
        },
        removeFromUserQueue: (state, action: PayloadAction<number>) => {
            state.userQueue.splice(action.payload, 1);
        },
        clearUserQueue: (state) => {
            state.userQueue = [];
        },
        reorderUserQueue: (
            state,
            action: PayloadAction<{ startIndex: number; endIndex: number }>
        ) => {
            const { startIndex, endIndex } = action.payload;
            const result = Array.from(state.userQueue);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            state.userQueue = result;
        },
        reorderContextQueue: (
            state,
            action: PayloadAction<{ startIndex: number; endIndex: number }>
        ) => {
            const { startIndex, endIndex } = action.payload;
            const result = Array.from(state.contextQueue);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            state.contextQueue = result;
        },
        moveFromContextToUserQueue: (
            state,
            action: PayloadAction<{ sourceIndex: number; destIndex?: number }>
        ) => {
            const { sourceIndex, destIndex } = action.payload;
            const [track] = state.contextQueue.splice(sourceIndex, 1);
            if (track) {
                if (destIndex !== undefined) {
                    state.userQueue.splice(destIndex, 0, track);
                } else {
                    state.userQueue.push(track);
                }
            }
        },
        addMultipleToUserQueue: (
            state,
            action: PayloadAction<{ tracks: Track[]; atFront?: boolean; insertIndex?: number }>
        ) => {
            const { tracks, atFront, insertIndex } = action.payload;
            if (insertIndex !== undefined && insertIndex >= 0) {
                state.userQueue.splice(insertIndex, 0, ...tracks);
            } else if (atFront) {
                state.userQueue.unshift(...tracks);
            } else {
                state.userQueue.push(...tracks);
            }
        },
        togglePlay: (state) => {
            state.isPlaying = !state.isPlaying;
        },
        setIsPlaying: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        setBuffering: (state, action: PayloadAction<boolean>) => {
            state.isBuffering = action.payload;
        },
        setProgress: (state, action: PayloadAction<number>) => {
            state.progress = action.payload;
        },
        setDuration: (state, action: PayloadAction<number>) => {
            state.duration = action.payload;
        },
        setVolume: (state, action: PayloadAction<number>) => {
            state.volume = action.payload;
            if (action.payload > 0) {
                state.isMuted = false;
                state.volumeBeforeMute = action.payload;
            }
        },
        toggleMute: (state) => {
            if (state.isMuted) {
                state.isMuted = false;
                state.volume = state.volumeBeforeMute || 1;
            } else {
                state.volumeBeforeMute = state.volume;
                state.isMuted = true;
                state.volume = 0;
            }
        },
        nextTrack: (state, action: PayloadAction<{ isAuto?: boolean } | undefined>) => {
            const isAuto = action.payload?.isAuto ?? false;
            if (state.repeat === RepeatMode.ONE && isAuto) {
                state.progress = 0;
                state.isPlaying = true;
                return;
            }

            if (state.currentTrack) {
                state.history.push(state.currentTrack);
            }

            let next: Track | undefined;

            if (state.userQueue.length > 0) {
                next = state.userQueue.shift();
            } else if (state.contextQueue.length > 0) {
                next = state.contextQueue.shift();
            } else if (state.repeat === RepeatMode.ALL && state.originalContext.length > 0) {
                state.contextQueue = [...state.originalContext];
                next = state.contextQueue.shift();
            } else if (!isAuto && state.originalContext.length > 0) {
                state.contextQueue = [...state.originalContext];
                next = state.contextQueue.shift();
            }

            if (next) {
                state.currentTrack = next;
                state.duration = next.duration || 0;
                state.progress = 0;
                state.isPlaying = true;
            } else {
                state.isPlaying = false;
                state.progress = 0;
            }
        },
        prevTrack: (state) => {
            if (state.progress > 3) {
                state.progress = 0;
                return;
            }

            if (state.history.length > 0) {
                const prev = state.history.pop()!;
                state.currentTrack = prev;
                state.duration = prev.duration || 0;
                state.progress = 0;
                state.isPlaying = true;
            } else {
                state.progress = 0;
            }
        },
        setRepeat: (state, action: PayloadAction<RepeatMode>) => {
            state.repeat = action.payload;
        },
        toggleShuffle: (state) => {
            state.shuffle = !state.shuffle;
        },
        toggleLyrics: (state) => {
            state.showLyrics = !state.showLyrics;
        },
        toggleMiniplayer: (state) => {
            state.isMiniplayer = !state.isMiniplayer;
        },
        setIsMiniplayer: (state, action: PayloadAction<boolean>) => {
            state.isMiniplayer = action.payload;
        },
    },
});

export const {
    setTrack,
    playFromUserQueue,
    playFromContextQueue,
    addToUserQueue,
    removeFromUserQueue,
    clearUserQueue,
    reorderUserQueue,
    reorderContextQueue,
    moveFromContextToUserQueue,
    addMultipleToUserQueue,
    togglePlay,
    setIsPlaying,
    setBuffering,
    setProgress,
    setDuration,
    setVolume,
    toggleMute,
    nextTrack,
    prevTrack,
    setRepeat,
    toggleShuffle,
    toggleLyrics,
    toggleMiniplayer,
    setIsMiniplayer,
} = musicPlayerSlice.actions;

export default musicPlayerSlice.reducer;