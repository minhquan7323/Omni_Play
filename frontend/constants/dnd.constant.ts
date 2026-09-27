export const DroppableId = {
    QUEUE_LIST: 'queue-list',
    CONTEXT_QUEUE_LIST: 'context-queue-list',
    NOW_PLAYING: 'now-playing',
    MAIN_CONTENT_TRACKS: 'main-content-tracks',
    MAIN_CONTENT_ALBUMS: 'main-content-albums',
    TRACK_LIST: 'track-list',
} as const;

export const DragScenario = {
    QUEUE_TO_QUEUE: `${DroppableId.QUEUE_LIST}->${DroppableId.QUEUE_LIST}`,
    CONTEXT_QUEUE_TO_CONTEXT_QUEUE: `${DroppableId.CONTEXT_QUEUE_LIST}->${DroppableId.CONTEXT_QUEUE_LIST}`,
    CONTEXT_QUEUE_TO_QUEUE: `${DroppableId.CONTEXT_QUEUE_LIST}->${DroppableId.QUEUE_LIST}`,
    CONTEXT_QUEUE_TO_NOW_PLAYING: `${DroppableId.CONTEXT_QUEUE_LIST}->${DroppableId.NOW_PLAYING}`,

    MAIN_CONTENT_TRACKS_TO_QUEUE: `${DroppableId.MAIN_CONTENT_TRACKS}->${DroppableId.QUEUE_LIST}`,
    MAIN_CONTENT_ALBUMS_TO_QUEUE: `${DroppableId.MAIN_CONTENT_ALBUMS}->${DroppableId.QUEUE_LIST}`,
    TRACK_LIST_TO_QUEUE: `${DroppableId.TRACK_LIST}->${DroppableId.QUEUE_LIST}`,

    MAIN_CONTENT_TRACKS_TO_NOW_PLAYING: `${DroppableId.MAIN_CONTENT_TRACKS}->${DroppableId.NOW_PLAYING}`,
    MAIN_CONTENT_ALBUMS_TO_NOW_PLAYING: `${DroppableId.MAIN_CONTENT_ALBUMS}->${DroppableId.NOW_PLAYING}`,
    TRACK_LIST_TO_NOW_PLAYING: `${DroppableId.TRACK_LIST}->${DroppableId.NOW_PLAYING}`,
} as const;

export const DraggableItemsRegistry: Record<string, any> = {};