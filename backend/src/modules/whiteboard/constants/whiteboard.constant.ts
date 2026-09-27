export enum WsEvents {
    JOIN_BOARD = 'join-board',
    INIT_SHAPES = 'init-shapes',
    DRAW_STEP = 'draw-step',
    KICK_USER = 'kick-user',
    YOU_ARE_KICKED = 'you-are-kicked',
}

export enum BoardRole {
    OWNER = 'owner',
    EDITOR = 'editor',
    VIEWER = 'viewer',
}
