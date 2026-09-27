import { DroppableList } from '@/components/DroppableList';
import { DroppableId } from '@/constants/dnd.constant';
import { clearUserQueue, playFromContextQueue, playFromUserQueue, Track } from '@/store/slices/musicPlayer.slice';
import { Droppable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Disc } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { artistNames } from '../../_utils/music.util';
import { QueueCard } from '../cards/queue.card';
import AudioVisualizer from '../player/AudioVisualizer';
import MarqueeText from '../ui/MarqueeText';
import { useAudio } from '@/providers/audio.provider';

interface RightSidebarQueueProps {
    openContextMenu: (e: React.MouseEvent, track: Track, queueIndex?: number) => void;
}

export function RightSidebarQueue({ openContextMenu }: RightSidebarQueueProps) {
    const dispatch = useDispatch();
    const { audioElement } = useAudio();

    const { currentTrack, userQueue, contextQueue, contextName } = useSelector(
        (state: any) => state.musicPlayer,
        shallowEqual
    );

    const imageUrl = currentTrack?.thumbnailUrl || currentTrack?.albumCover;
    const hasUserQueue = userQueue.length > 0;
    const hasContextQueue = contextQueue.length > 0 && contextName;

    return (
        <motion.div
            key="queue-view"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col gap-4 mt-4 pr-3"
        >
            <Droppable droppableId={DroppableId.NOW_PLAYING} isDropDisabled={hasUserQueue}>
                {(nowPlayingProvided, nowPlayingSnapshot) => (
                    <>
                        <div
                            ref={nowPlayingProvided.innerRef}
                            {...nowPlayingProvided.droppableProps}
                            className={`relative rounded-lg transition-colors px-2 py-1 -mx-2 ${nowPlayingSnapshot.isDraggingOver ? 'bg-primary/40' : ''}`}
                        >
                            <h3 className="font-bold text-sm text-foreground mb-2">Now playing</h3>
                            {currentTrack ? (
                                <div className="flex items-center gap-3 p-2 rounded-md bg-primary/20 pointer-events-none">
                                    <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0">
                                        {imageUrl ? (
                                            <Image src={imageUrl} alt="Cover" fill sizes="48px" className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-zinc-800 flex justify-center items-center">
                                                <Disc className="w-6 h-6 text-zinc-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 w-full">
                                        <MarqueeText text={currentTrack.title} textClassName="font-bold text-sm text-green-500 cursor-pointer" />
                                        <MarqueeText text={artistNames(currentTrack.artists)} textClassName="text-xs text-secondary-foreground cursor-pointer" />
                                    </div>
                                    <div className="flex-1 max-w-16">
                                        <AudioVisualizer audioElement={audioElement} barCount={10} />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-zinc-500 pointer-events-none">Chưa phát bài nào</p>
                            )}
                            <div className="hidden">{nowPlayingProvided.placeholder}</div>
                        </div>

                        {!hasUserQueue && (
                            <Droppable droppableId={DroppableId.QUEUE_LIST}>
                                {(queueProvided, queueSnapshot) => (
                                    <div
                                        ref={queueProvided.innerRef}
                                        {...queueProvided.droppableProps}
                                        className={`transition-all duration-300 rounded-lg flex flex-col ${nowPlayingSnapshot.isDraggingOver || queueSnapshot.isDraggingOver
                                            ? 'h-24 opacity-100 mt-2'
                                            : 'h-0 opacity-0 overflow-hidden mt-0'
                                            }`}
                                    >
                                        {(nowPlayingSnapshot.isDraggingOver || queueSnapshot.isDraggingOver) && (
                                            <h3 className="font-bold text-sm text-foreground">Next in queue</h3>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        )}
                    </>
                )}
            </Droppable>

            {hasUserQueue && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm text-foreground">Next in queue</h3>
                        <button
                            onClick={() => dispatch(clearUserQueue())}
                            className="text-xs font-semibold text-secondary-foreground hover:text-foreground transition"
                        >
                            Clear queue
                        </button>
                    </div>
                    <DroppableList
                        droppableId={DroppableId.QUEUE_LIST}
                        items={userQueue}
                        keyExtractor={(track: any, i: number) => `${track?.id}-${i}`}
                        containerClassName="flex flex-col space-y-1 pb-2"
                        getItemClassName={(isDragging) =>
                            `rounded-md ${isDragging ? 'bg-primary/40 shadow-xl' : 'hover:bg-primary/20'}`
                        }
                        renderItem={(track: any, index: number) => (
                            <QueueCard
                                key={`${track?.id}-${index}`}
                                item={track}
                                onPlay={() => dispatch(playFromUserQueue(index))}
                                onContextMenuClick={(e) => openContextMenu(e, track, index)}
                                onContextMenu={(e: React.MouseEvent) => openContextMenu(e, track, index)}
                            />
                        )}
                    />
                </div>
            )}

            {hasContextQueue && (
                <div>
                    <h3 className="font-bold text-sm text-foreground mb-2">
                        Next from:{' '}
                        <span className="text-foreground/80">{contextName}</span>
                    </h3>
                    <div className="flex flex-col space-y-1">
                        <DroppableList
                            droppableId={DroppableId.CONTEXT_QUEUE_LIST}
                            items={contextQueue}
                            keyExtractor={(track: any, i: number) => `ctx-${track?.id}-${i}`}
                            containerClassName="flex flex-col space-y-1 pb-2"
                            getItemClassName={(isDragging) =>
                                `rounded-md ${isDragging ? 'bg-primary/40 shadow-xl' : 'hover:bg-primary/20'}`
                            }
                            renderItem={(track: any, index: number) => (
                                <QueueCard
                                    key={`ctx-${track?.id}-${index}`}
                                    item={track}
                                    onPlay={() => dispatch(playFromContextQueue(index))}
                                    onContextMenuClick={(e) => openContextMenu(e, track)}
                                    onContextMenu={(e: React.MouseEvent) => openContextMenu(e, track)}
                                />
                            )}
                        />
                    </div>
                </div>
            )}

            {!hasUserQueue && !hasContextQueue && (
                <p className="text-xs text-zinc-500 px-2 mt-2">Không có gì trong queue.</p>
            )}
        </motion.div>
    );
}
