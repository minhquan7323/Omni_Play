'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { APP_ROUTES } from '../../../../../constants/routes.constant';
import { LIBRARY_ITEM_TYPE } from '../../_constants/types';

interface PlaylistCardProps {
    item: any;
    isCollapsed: boolean;
    onContextMenu?: (e: React.MouseEvent, item: any) => void;
    onMoreClick?: (e: React.MouseEvent, item: any) => void;
}

export function PlaylistCard({ item, isCollapsed, onContextMenu, onMoreClick }: PlaylistCardProps) {

    const href = (() => {
        const id = item.targetId || item.id;
        switch (item.type) {
            case LIBRARY_ITEM_TYPE.CUSTOM:
            case LIBRARY_ITEM_TYPE.TRACK:
                return APP_ROUTES.MUSIC.PLAYLIST(id);
            case LIBRARY_ITEM_TYPE.ALBUM:
                return APP_ROUTES.MUSIC.ALBUM(id);
            case LIBRARY_ITEM_TYPE.ARTIST:
                return APP_ROUTES.MUSIC.ARTIST(id);
            default:
                return '#';
        }
    })()

    return (
        <Link
            href={href}
            className="block"
            onContextMenu={(e) => {
                if (onContextMenu) {
                    e.preventDefault();
                    onContextMenu(e, item);
                }
            }}
        >
            <div className={`group flex items-center justify-between p-1 rounded-md cursor-pointer overflow-hidden transition-all hover:bg-accent`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-sm overflow-hidden shrink-0 bg-secondary transition-all flex items-center justify-center">
                        {item.image ? (
                            <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                {item.name?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex-1 min-w-0 overflow-hidden whitespace-nowrap"
                            >
                                <p className={`text-sm font-semibold truncate text-foreground`}>{item.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                {!isCollapsed && (
                    <div
                        onClick={(e) => {
                            if (onMoreClick) {
                                e.preventDefault();
                                e.stopPropagation();
                                onMoreClick(e, item);
                            }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 mr-1 hover:bg-white/10 rounded-full transition-all shrink-0 text-foreground"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </div>
                )}
            </div>
        </Link>
    );
}
