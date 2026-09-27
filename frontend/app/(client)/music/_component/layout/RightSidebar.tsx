'use client';

import { MUSIC_RIGHT_SIDEBAR_CONFIG, SidebarId } from '@/constants/sidebar.constant';
import { useResizable } from '@/hooks/useResizable';
import { Track } from '@/store/slices/musicPlayer.slice';
import { setOpen, setWidth, togglePinned } from '@/store/slices/sidebar.slice';
import { getDominantColor } from '@/utils/color.util';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, Maximize2, PanelRightClose, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import MarqueeText from '../ui/MarqueeText';
import { ContextMenuState, TrackContextMenu } from '../ui/TrackContextMenu';
import { RightSidebarDetails } from './RightSidebarDetails';
import { RightSidebarQueue } from './RightSidebarQueue';

export function RightSidebar() {
    const dispatch = useDispatch();

    const sidebar = useSelector((state: any) => state.sidebar?.[SidebarId.MUSIC_RIGHT], shallowEqual);
    const { currentTrack } = useSelector(
        (state: any) => state.musicPlayer,
        shallowEqual
    );

    const [dominantColor, setDominantColor] = useState('');
    const [isHovered, setIsHovered] = useState(false);
    const [viewMode, setViewMode] = useState<'details' | 'queue'>('details');
    const scrollContainerRef = useRef(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const { scrollY } = useScroll({ container: scrollContainerRef });
    const coverOpacity = useTransform(scrollY, [0, 220], [1, 0.15]);
    const coverScale = useTransform(scrollY, [0, 220], [1, 0.88]);
    const coverY = useTransform(scrollY, [0, 220], [0, -30]);

    const { isResizing, startResizing } = useResizable({
        direction: 'left',
        min: MUSIC_RIGHT_SIDEBAR_CONFIG.MIN_WIDTH,
        max: MUSIC_RIGHT_SIDEBAR_CONFIG.MAX_WIDTH,
        currentSize: sidebar?.width ?? MUSIC_RIGHT_SIDEBAR_CONFIG.MIN_WIDTH,
        onResize: (newWidth) => dispatch(setWidth({ id: SidebarId.MUSIC_RIGHT, width: newWidth })),
    });

    const imageUrl = currentTrack?.thumbnailUrl || currentTrack?.albumCover;

    useEffect(() => {
        getDominantColor(imageUrl).then((color) => setDominantColor(color));
    }, [imageUrl]);

    const isExpanded = sidebar?.isPinned || isResizing;
    const currentContainerWidth = isExpanded
        ? (sidebar?.width ?? MUSIC_RIGHT_SIDEBAR_CONFIG.MIN_WIDTH)
        : isHovered
            ? MUSIC_RIGHT_SIDEBAR_CONFIG.PREVIEW_WIDTH
            : MUSIC_RIGHT_SIDEBAR_CONFIG.COLLAPSED_WIDTH;

    const handleTogglePin = () => dispatch(togglePinned({ id: SidebarId.MUSIC_RIGHT }));

    const openContextMenu = useCallback(
        (e: React.MouseEvent, track: Track, queueIndex?: number) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({
                track,
                x: e.clientX,
                y: e.clientY,
                isQueueItem: queueIndex !== undefined,
                queueIndex,
            });
        },
        []
    );

    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    useEffect(() => {
        const handleClick = () => closeContextMenu();
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            document.addEventListener('contextmenu', handleClick);
        }
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('contextmenu', handleClick);
        };
    }, [contextMenu, closeContextMenu]);

    return (
        <>
            <motion.aside
                key="music-right-sidebar"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                initial={{ width: 0, opacity: 0, marginRight: -8 }}
                animate={{
                    width: currentContainerWidth,
                    opacity: 1,
                    marginRight: !isExpanded ? -8 : 0,
                }}
                exit={{
                    width: 0,
                    opacity: 0,
                    marginRight: -8,
                    transition: { type: 'tween', duration: 0.25, ease: 'easeInOut' },
                }}
                transition={
                    isResizing
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 300, damping: 40 }
                }
                onClick={!isExpanded ? handleTogglePin : undefined}
                className={`shrink-0 min-w-0 h-full relative flex flex-col rounded-lg select-none ${!isExpanded ? 'cursor-pointer rounded-r-none' : ''}`}
                style={{ background: `linear-gradient(to bottom, ${dominantColor} 0%, #121212 650px)` }}
            >
                {isExpanded && (
                    <div
                        onMouseDown={startResizing}
                        onTouchStart={startResizing}
                        className={`absolute left-[-4.7px] top-1/2 -translate-y-1/2 w-1 h-[96%] rounded-full cursor-col-resize z-10 transition-colors ${isResizing ? 'bg-foreground/60' : 'hover:bg-foreground/80'}`}
                    />
                )}

                {!isExpanded && (
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center text-foreground transition-colors pointer-events-none">
                        <ChevronLeft className="w-5 h-5" strokeWidth={3} />
                    </div>
                )}

                <div className={`w-full h-full overflow-hidden relative rounded-lg ${!isExpanded ? 'rounded-r-none' : ''}`}>
                    <div
                        style={{ width: sidebar?.width ?? MUSIC_RIGHT_SIDEBAR_CONFIG.MIN_WIDTH }}
                        className={`flex flex-col h-full transition-opacity duration-300 ${!isExpanded
                            ? isHovered
                                ? 'opacity-40 blur-[1px] pointer-events-none'
                                : 'opacity-0 pointer-events-none'
                            : 'opacity-100'
                            }`}
                    >
                        <div className="relative flex items-center justify-between shrink-0 h-14 px-5 pt-1 z-30 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-auto">
                            <div className="relative flex items-center min-w-0 flex-1">
                                <AnimatePresence>
                                    {isHovered && isExpanded && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8, x: -8 }}
                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.8, x: -8 }}
                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                            onClick={(e) => { e.stopPropagation(); handleTogglePin(); }}
                                            className="absolute left-0 z-10 shrink-0 p-1.5 text-foreground rounded-full hover:bg-foreground/10 hover:text-foreground/80 transition-colors"
                                        >
                                            <PanelRightClose className="w-5 h-5" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                <motion.div
                                    animate={{ paddingLeft: isHovered && isExpanded ? 32 : 0, paddingRight: isHovered && isExpanded ? 12 : 0 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex-1 min-w-0 drop-shadow-md"
                                >
                                    <span className="font-bold text-base text-foreground">
                                        {viewMode === 'queue' ? 'Queue' : (
                                            <MarqueeText
                                                text={currentTrack?.album?.name || currentTrack?.title || 'Chưa phát nhạc'}
                                                textClassName="font-bold text-sm text-foreground hover:underline cursor-pointer"
                                            />
                                        )}
                                    </span>
                                </motion.div>
                            </div>

                            <AnimatePresence>
                                {isHovered && isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 8 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                        className="flex items-center gap-1 text-zinc-400 shrink-0"
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (viewMode === 'queue') {
                                                    setViewMode('details');
                                                } else {
                                                    dispatch(setOpen({ id: SidebarId.MUSIC_RIGHT, isOpen: false }));
                                                }
                                            }}
                                            className="p-1.5 text-foreground rounded-full hover:bg-foreground/10 hover:text-foreground/80 transition-colors"
                                        >
                                            {viewMode === 'queue' ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div ref={scrollContainerRef} className="custom-scrollbar relative flex-1 overflow-y-auto overflow-x-hidden pl-4 pr-1 pb-4">
                            <AnimatePresence mode="wait">
                                {viewMode === 'queue' ? (
                                    <RightSidebarQueue openContextMenu={openContextMenu} />
                                ) : (
                                    <RightSidebarDetails
                                        coverOpacity={coverOpacity}
                                        coverScale={coverScale}
                                        coverY={coverY}
                                        setViewMode={setViewMode}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.aside >

            <TrackContextMenu contextMenu={contextMenu} onClose={closeContextMenu} />
        </>
    );
}