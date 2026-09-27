'use client';

import { Disc, MoreHorizontal, Play } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { artistNames } from '../../_utils/music.util';

interface QueueCardProps {
    item: any;
    onPlay?: () => void;
    onContextMenuClick?: (e: React.MouseEvent) => void;
    [key: string]: any;
}

export const QueueCard = React.forwardRef<HTMLDivElement, QueueCardProps>(
    function QueueCard({ item, onPlay, onContextMenuClick, className, ...rest }, ref) {
        const trackImage = item?.thumbnailUrl || item?.albumCover;

        return (
            <div
                ref={ref}
                {...rest}
                className={`flex items-center gap-3 p-2 group cursor-grab active:cursor-grabbing transition-colors ${className || ''}`}
            >
                <div
                    className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-zinc-800 cursor-pointer"
                    onClick={onPlay}
                >
                    {trackImage ? (
                        <Image src={trackImage} alt="Cover" fill sizes="48px" className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex justify-center items-center">
                            <Disc className="w-5 h-5 text-zinc-500" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                </div>

                <div className="flex-1 min-w-0" onClick={onPlay}>
                    <p className="text-sm font-medium text-foreground truncate">{item?.title}</p>
                    <p className="text-xs text-secondary-foreground truncate">{artistNames(item?.artists)}</p>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button
                        title="More options"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onContextMenuClick) onContextMenuClick(e);
                        }}
                        className="p-1.5 rounded-full hover:bg-white/10 text-foreground/60 hover:text-foreground hover:scale-105 transition"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }
);
