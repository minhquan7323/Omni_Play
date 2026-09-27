import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MAIN_SIDEBAR_CONFIG, SidebarId } from '@/constants/sidebar.constant';

interface SidebarConfig {
    width: number;
    isPinned: boolean;
    isOpen: boolean;
}

type SidebarState = Record<SidebarId, SidebarConfig>;

const initialState: SidebarState = {
    [SidebarId.MAIN]: {
        width: MAIN_SIDEBAR_CONFIG.INIT_WIDTH,
        isPinned: false,
        isOpen: true
    },
    [SidebarId.MUSIC_LEFT]: {
        width: 280,
        isPinned: false,
        isOpen: true
    },
    [SidebarId.MUSIC_RIGHT]: {
        width: 320,
        isPinned: false,
        isOpen: false
    },
};

export const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setWidth: (state, action: PayloadAction<{ id: SidebarId; width: number }>) => {
            const { id, width } = action.payload;
            if (state[id]) {
                state[id].width = width;
            }
        },
        setPinned: (state, action: PayloadAction<{ id: SidebarId; isPinned: boolean }>) => {
            const { id, isPinned } = action.payload;
            if (state[id]) {
                state[id].isPinned = isPinned;
            }
        },
        togglePinned: (state, action: PayloadAction<{ id: SidebarId }>) => {
            const { id } = action.payload;
            if (state[id]) {
                state[id].isPinned = !state[id].isPinned;
            }
        },
        setOpen: (state, action: PayloadAction<{ id: SidebarId; isOpen: boolean }>) => {
            const { id, isOpen } = action.payload;
            if (state[id]) {
                state[id].isOpen = isOpen;
            }
        },
        toggleOpen: (state, action: PayloadAction<{ id: SidebarId }>) => {
            const { id } = action.payload;
            if (state[id]) {
                state[id].isOpen = !state[id].isOpen;
            }
        }
    },
});

export const { setWidth, setPinned, togglePinned, setOpen, toggleOpen } = sidebarSlice.actions;
export default sidebarSlice.reducer;