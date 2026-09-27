import { addToUserQueue } from '@/store/slices/musicPlayer.slice';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit2, ListPlus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { LIBRARY_ITEM_TYPE } from '../../_constants/types';

export interface PlaylistContextMenuState {
    playlist: any;
    x: number;
    y: number;
    type?: LIBRARY_ITEM_TYPE;
}

interface PlaylistContextMenuProps {
    contextMenu: PlaylistContextMenuState | null;
    onClose: () => void;
    onEdit: (playlist: any) => void;
    onDelete: (playlist: any) => void;
}

export function PlaylistContextMenu({ contextMenu, onClose, onEdit, onDelete }: PlaylistContextMenuProps) {
    const dispatch = useDispatch();

    useEffect(() => {
        const handleClick = () => onClose();
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            document.addEventListener('contextmenu', handleClick);
        }
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('contextmenu', handleClick);
        };
    }, [contextMenu, onClose]);

    if (!contextMenu) return null;

    const img = contextMenu.playlist.image || contextMenu.playlist.thumbnailUrl;

    return (
        <AnimatePresence>
            <motion.div
                key="playlist-context-menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="fixed z-[99999] min-w-[200px] bg-popover rounded-lg shadow-2xl border border-white/10 py-1 overflow-hidden"
                style={{
                    top: Math.min(contextMenu.y, window.innerHeight - 200),
                    left: Math.min(contextMenu.x, window.innerWidth - 200),
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
            >
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 mb-1">
                    <div className="relative w-10 h-10 rounded-sm shrink-0 bg-secondary overflow-hidden">
                        {img && (
                            <Image
                                src={img}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                            />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{contextMenu.playlist.name}</p>
                    </div>
                </div>

                <ContextMenuItem
                    icon={<ListPlus className="w-4 h-4" />}
                    label={"Add to queue"}
                    onClick={() => {
                        // dispatch(addToUserQueue({ track: contextMenu.playlist.tracks, atFront: true }));
                        onClose();
                    }}
                />

                <>
                    {(contextMenu.type != LIBRARY_ITEM_TYPE.ARTIST && contextMenu.type != LIBRARY_ITEM_TYPE.ALBUM) && (
                        <ContextMenuItem
                            icon={<Edit2 className="w-4 h-4" />}
                            label="Edit details"
                            onClick={() => {
                                onEdit(contextMenu.playlist);
                                onClose();
                            }}
                        />

                    )}
                    <div className="my-1 border-t border-white/10" />

                    <ContextMenuItem
                        icon={<Trash2 className="w-4 h-4" />}
                        label="Delete"
                        danger
                        onClick={() => {
                            onDelete(contextMenu.playlist);
                            onClose();
                        }}
                    />
                </>
            </motion.div>
        </AnimatePresence>
    );
}

function ContextMenuItem({
    icon, label, onClick, danger = false
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition hover:bg-white/10 ${danger ? 'text-red-400 hover:text-red-300' : 'text-foreground/80 hover:text-foreground'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
