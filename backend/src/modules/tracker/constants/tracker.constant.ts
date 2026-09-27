export type TrackAction =
    | 'PAGE_VIEW'
    | 'FILM_WATCH'
    | 'FILM_FAVORITE'
    | 'MUSIC_PLAY'
    | 'MUSIC_FAVORITE'
    | 'WHITEBOARD_OPEN'
    | 'WHITEBOARD_EDIT'
    | 'AUTH_LOGIN'
    | 'AUTH_REGISTER'
    | 'SEARCH';

export type TrackModule = 'AUTH' | 'FILM' | 'MUSIC' | 'WHITEBOARD' | 'SYSTEM';
