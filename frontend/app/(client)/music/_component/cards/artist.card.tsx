'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Mic2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ArtistCardProps {
    artist: any;
}

export function ArtistCard({ artist }: ArtistCardProps) {
    const href = `/music/artist/${artist?.id}`;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Link href={href}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative w-60 group shrink-0 p-4 text-card-foreground hover:text-accent-foreground cursor-pointer transition-colors">
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute inset-0 bg-accent rounded-md"
                    />
                )}
            </AnimatePresence>
            <div className="relative z-10">
                <div className="relative aspect-square mb-4 shadow-lg rounded-full overflow-hidden">
                    {artist?.image ? (
                        <Image
                            src={artist.image}
                            alt={artist.name}
                            fill
                            sizes="200px"
                            className="object-cover"
                            draggable={false}
                        />
                    ) : (
                        <Mic2 className="w-12 h-12 text-zinc-500" strokeWidth={1} />
                    )}
                </div>
                <p className="font-semibold line-clamp-2">{artist?.name}</p>
                <p className="text-sm text-muted-foreground truncate">{artist?.type || "Artist"}</p>
            </div>
        </Link>
    );
}

export const ArtistCardSkeleton = () => {
    return (
        <div className="relative w-60 shrink-0 p-4">
            <div className="relative z-10 flex flex-col items-center">
                <div className="relative aspect-square mb-4 bg-zinc-800/50 w-full rounded-full animate-pulse" />
                <div className="h-5 w-3/4 bg-zinc-800/50 rounded mb-1.5 animate-pulse" />
                <div className="h-4 w-1/2 bg-zinc-800/50 rounded animate-pulse" />
            </div>
        </div>
    );
};
