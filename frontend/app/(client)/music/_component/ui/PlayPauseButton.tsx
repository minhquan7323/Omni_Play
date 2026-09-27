import { Pause, Play } from 'lucide-react';
import React from 'react';

interface PlayPauseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isPlaying: boolean;
    iconClassName?: string;
}

export const PlayPauseButton = ({
    isPlaying,
    className = "",
    iconClassName = "w-4 h-4",
    ...props
}: PlayPauseButtonProps) => {
    return (
        <button
            className={`rounded-full flex items-center justify-center shrink-0 transition-all ${className}`}
            {...props}
        >
            {isPlaying ? (
                <Pause className={`fill-current text-current shrink-0 ${iconClassName}`} />
            ) : (
                <Play className={`fill-current text-current shrink-0 ml-0.5 ${iconClassName}`} />
            )}
        </button>
    );
};