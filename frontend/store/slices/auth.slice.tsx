import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    accessToken: null as string | null,
    user: null as any,
    roles: [] as string[],
    permissions: [] as string[],
    isAuthenticated: false,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            state.accessToken = action.payload.accessToken;
            if (action.payload.user) {
                state.user = action.payload.user;
                state.roles = action.payload.user.roles ?? action.payload.roles ?? [];
                state.permissions = action.payload.user.permissions ?? action.payload.permissions ?? [];
            } else if (action.payload.roles) {
                state.roles = action.payload.roles;
                state.permissions = action.payload.permissions ?? [];
            }
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.accessToken = null;
            state.user = null;
            state.roles = [];
            state.permissions = [];
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
