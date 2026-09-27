import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export enum ModalEnum {
    AUTH = 'AUTH',
    WHITEBOARD_PASSWORD = 'WHITEBOARD_PASSWORD',
    WHITEBOARD_CREATE = 'WHITEBOARD_CREATE',
}

interface ModalState {
    activeModal: ModalEnum | null;
    modalProps?: Record<string, any>;
}

const initialState: ModalState = {
    activeModal: null,
    modalProps: {},
};

const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openModal: (
            state,
            action: PayloadAction<{
                type: ModalEnum;
                props?: Record<string, any>;
            }>,
        ) => {
            state.activeModal = action.payload.type;
            state.modalProps = action.payload.props || {};
        },
        closeModal: (state) => {
            state.activeModal = null;
            state.modalProps = {};
        },
    },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
