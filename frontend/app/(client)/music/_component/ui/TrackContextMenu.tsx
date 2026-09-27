import { addToUserQueue, removeFromUserQueue, setTrack, Track } from '@/store/slices/musicPlayer.slice';
import { AnimatePresence, motion } from 'framer-motion';
import { Disc, ListPlus, ListStart, Play, Plus, Share, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { artistNames } from '../../_utils/music.util';

export interface ContextMenuState {
    track: Track | any;
    x: number;
    y: number;
    isQueueItem?: boolean;
    queueIndex?: number;
}

interface TrackContextMenuProps {
    contextMenu: ContextMenuState | null;
    onClose: () => void;
}

export function TrackContextMenu({ contextMenu, onClose }: TrackContextMenuProps) {
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

    const img = contextMenu.track.thumbnailUrl || contextMenu.track.albumCover || contextMenu.track.album?.images?.[0]?.url

    return (
        <AnimatePresence>
            <motion.div
                key="track-context-menu"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="fixed z-[99999] min-w-[220px] bg-popover rounded-lg shadow-2xl border border-white/10 py-1 overflow-hidden"
                style={{
                    top: Math.min(contextMenu.y, window.innerHeight - 320),
                    left: Math.min(contextMenu.x, window.innerWidth - 240),
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
            >
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 mb-1">
                    <div className="relative w-10 h-10 rounded shrink-0 bg-zinc-700 overflow-hidden">
                        {img ? (
                            <Image
                                src={img}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex justify-center items-center">
                                <Disc className="w-5 h-5 text-zinc-500" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{contextMenu.track.title}</p>
                        <p className="text-xs text-zinc-400 truncate">{artistNames(contextMenu.track.artists)}</p>
                    </div>
                </div>

                <ContextMenuItem
                    icon={<Play className="w-4 h-4" />}
                    label="Play now"
                    onClick={() => { dispatch(setTrack({ track: contextMenu.track })); onClose(); }}
                />

                <ContextMenuItem
                    icon={<ListStart className="w-4 h-4" />}
                    label="Play next"
                    onClick={() => {
                        dispatch(addToUserQueue({ track: contextMenu.track, atFront: true }));
                        onClose();
                    }}
                />

                <ContextMenuItem
                    icon={<ListPlus className="w-4 h-4" />}
                    label="Add to queue"
                    onClick={() => {
                        dispatch(addToUserQueue({ track: contextMenu.track }));
                        onClose();
                    }}
                />

                {/* <div className="my-1 border-t border-white/10" />

                <ContextMenuItem
                    icon={<Plus className="w-4 h-4" />}
                    label="Save to your Liked Songs"
                    onClick={onClose}
                />
                <ContextMenuItem
                    icon={<Share className="w-4 h-4" />}
                    label="Share"
                    onClick={onClose}
                /> */}

                {contextMenu.isQueueItem && contextMenu.queueIndex !== undefined && (
                    <>
                        <div className="my-1 border-t border-white/10" />
                        <ContextMenuItem
                            icon={<Trash2 className="w-4 h-4" />}
                            label="Remove from queue"
                            danger
                            onClick={() => {
                                dispatch(removeFromUserQueue(contextMenu.queueIndex!));
                                onClose();
                            }}
                        />
                    </>
                )}
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
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition hover:bg-white/10 ${danger ? 'text-red-400 hover:text-red-300' : 'text-zinc-200 hover:text-white'
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
