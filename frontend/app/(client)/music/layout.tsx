'use client';

import { DragScenario, DraggableItemsRegistry } from '@/constants/dnd.constant';
import { HEADER_HEIGHT } from '@/constants/layout.constant';
import { SidebarId } from '@/constants/sidebar.constant';
import { addMultipleToUserQueue, addToUserQueue, moveFromContextToUserQueue, reorderContextQueue, reorderUserQueue } from '@/store/slices/musicPlayer.slice';
import { createDndHandler } from '@/utils/dnd.util';
import { DragDropContext } from '@hello-pangea/dnd';
import { AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { BottomPlayer } from './_component/layout/BottomPlayer';
import { LeftSidebar } from './_component/layout/LeftSidebar';
import { MainContent } from './_component/layout/MainContent';
import { RightSidebar } from './_component/layout/RightSidebar';
import { MiniPlayer } from './_component/player/MiniPlayer';

export default function MusicLayout({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();
    const sidebar = useSelector((state: any) => state.sidebar?.[SidebarId.MUSIC_RIGHT]);
    const { isMiniplayer } = useSelector((state: any) => state.musicPlayer);

    const handleExternalDrop = (destIndex: number, draggableId: string) => {
        const draggedItem = DraggableItemsRegistry[draggableId];
        if (!draggedItem) return;
        if (draggedItem.tracks) {
            dispatch(addMultipleToUserQueue({ tracks: draggedItem.tracks, insertIndex: destIndex }));
        } else if (draggedItem.audioUrl || draggedItem.duration) {
            dispatch(addToUserQueue({ track: draggedItem, insertIndex: destIndex }));
        }
    };

    const handleDragEnd = createDndHandler({
        [DragScenario.QUEUE_TO_QUEUE]: (source, dest) => {
            dispatch(reorderUserQueue({ startIndex: source.index, endIndex: dest.index }));
        },
        [DragScenario.CONTEXT_QUEUE_TO_CONTEXT_QUEUE]: (source, dest) => {
            dispatch(reorderContextQueue({ startIndex: source.index, endIndex: dest.index }));
        },
        [DragScenario.CONTEXT_QUEUE_TO_QUEUE]: (source, dest) => {
            dispatch(moveFromContextToUserQueue({ sourceIndex: source.index, destIndex: dest.index }));
        },
        [DragScenario.CONTEXT_QUEUE_TO_NOW_PLAYING]: (source, dest) => {
            dispatch(moveFromContextToUserQueue({ sourceIndex: source.index, destIndex: 0 }));
        },

        // Drop to Queue
        [DragScenario.MAIN_CONTENT_TRACKS_TO_QUEUE]: (source, dest, result) => handleExternalDrop(dest.index, result.draggableId),
        [DragScenario.MAIN_CONTENT_ALBUMS_TO_QUEUE]: (source, dest, result) => handleExternalDrop(dest.index, result.draggableId),
        [DragScenario.TRACK_LIST_TO_QUEUE]: (source, dest, result) => handleExternalDrop(dest.index, result.draggableId),

        // Drop to Now Playing
        [DragScenario.MAIN_CONTENT_TRACKS_TO_NOW_PLAYING]: (source, dest, result) => handleExternalDrop(0, result.draggableId),
        [DragScenario.MAIN_CONTENT_ALBUMS_TO_NOW_PLAYING]: (source, dest, result) => handleExternalDrop(0, result.draggableId),
        [DragScenario.TRACK_LIST_TO_NOW_PLAYING]: (source, dest, result) => handleExternalDrop(0, result.draggableId),
    });

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div
                className="flex flex-col w-full bg-background text-foreground select-none font-sans overflow-hidden"
                style={{ height: `calc(100vh - ${HEADER_HEIGHT + 8}px)` }}
            >
                <div className="flex flex-1 gap-2 px-2 pb-2 min-h-0 overflow-hidden">
                    <LeftSidebar />

                    <MainContent>
                        {children}
                    </MainContent>

                    <AnimatePresence>
                        {sidebar?.isOpen && <RightSidebar />}
                    </AnimatePresence>
                </div>

                <BottomPlayer />
                {isMiniplayer && <MiniPlayer />}
            </div>
        </DragDropContext>
    );
}