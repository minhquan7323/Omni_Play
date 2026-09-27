export const MAIN_SIDEBAR_CONFIG = {
    MIN_WIDTH: 100,
    MAX_WIDTH: 400,
    INIT_WIDTH: 250,
    COLLAPSED_WIDTH: 42
};
export const MUSIC_LEFT_SIDEBAR_CONFIG = {
    MIN_WIDTH: 180,
    MAX_WIDTH: 380,
    INIT_WIDTH: 320,
    COLLAPSED_WIDTH: 65
};
export const MUSIC_RIGHT_SIDEBAR_CONFIG = {
    MIN_WIDTH: 250,
    MAX_WIDTH: 500,
    INIT_WIDTH: 300,
    COLLAPSED_WIDTH: 36,
    PREVIEW_WIDTH: 66

};

export enum SidebarId {
    MAIN = 'main',
    MUSIC_LEFT = 'musicLeft',
    MUSIC_RIGHT = 'musicRight',
}