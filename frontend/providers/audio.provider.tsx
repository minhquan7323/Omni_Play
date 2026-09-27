'use client';

import { nextTrack, setDuration, setIsPlaying, setProgress } from '@/store/slices/musicPlayer.slice';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface AudioContextType {
    audioElement: HTMLAudioElement | null;
}

const AudioContext = createContext<AudioContextType>({ audioElement: null });

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();
    const { currentTrack, isPlaying, volume, isMuted, repeat, progress } = useSelector((state: any) => state.musicPlayer);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    const audioUrl = currentTrack?.audioUrl?.replace(
        'https://www.soundhelix.com/examples/mp3/',
        '/proxy-audio/'
    );

    useEffect(() => {
        if (audioRef.current) {
            setAudioElement(audioRef.current);
        }
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        if (isPlaying) {
            if (audio.ended || audio.currentTime >= audio.duration - 0.1) {
                audio.currentTime = 0;
            }
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    // console.log("Trình duyệt chặn autoplay khi F5:", err);
                    dispatch(setIsPlaying(false));
                });
            }
        } else {
            audio.pause();
        }
    }, [isPlaying, audioUrl, currentTrack, dispatch]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (audio) {
            dispatch(setProgress(audio.currentTime));
        }
    };

    const handleLoadedMetadata = () => {
        const audio = audioRef.current;
        if (audio) {
            dispatch(setDuration(audio.duration));
        }
    };

    const handleEnded = () => {
        dispatch(nextTrack({ isAuto: true }));
    };

    return (
        <AudioContext.Provider value={{ audioElement }}>
            <audio
                ref={audioRef}
                src={audioUrl}
                crossOrigin="anonymous"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                className="hidden"
            />
            {children}
        </AudioContext.Provider>
    );
}

export const useAudio = () => useContext(AudioContext);