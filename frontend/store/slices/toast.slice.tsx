import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition =
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';

export interface ToastItem {
    id: string;
    message: string;
    title?: string;
    type?: ToastType;
    duration?: number;
}

interface ToastState {
    toasts: ToastItem[];
    position: ToastPosition;
}

const initialState: ToastState = {
    toasts: [],
    position: 'top-right',
};

export const toastSlice = createSlice({
    name: 'toast',
    initialState,
    reducers: {
        addToast: (
            state,
            action: PayloadAction<Omit<ToastItem, 'id'> & { id?: string }>,
        ) => {
            const id =
                action.payload.id || Math.random().toString(36).substring(2, 9);
            state.toasts.push({
                ...action.payload,
                id,
                duration: action.payload.duration ?? 3500,
                type: action.payload.type ?? 'info',
            });
        },
        removeToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter((t) => t.id !== action.payload);
        },
        setToastPosition: (state, action: PayloadAction<ToastPosition>) => {
            state.position = action.payload;
        },
    },
});

export const { addToast, removeToast, setToastPosition } = toastSlice.actions;
export default toastSlice.reducer;
