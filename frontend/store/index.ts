import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
    FLUSH,
    PAUSE,
    PERSIST,
    persistReducer,
    persistStore,
    PURGE,
    REGISTER,
    REHYDRATE,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/auth.slice';
import modalReducer from './slices/modal.slice';
import musicPlayerReducer from './slices/musicPlayer.slice';
import sidebarReducer from './slices/sidebar.slice';
import toastReducer from './slices/toast.slice';

const musicPlayerPersistConfig = {
    key: 'musicPlayer',
    storage,
    blacklist: ['isMiniplayer', 'isBuffering', 'progress', 'isPlaying', 'duration']
};

const persistConfig = {
    key: 'root',
    version: 1,
    storage,
    whitelist: ['auth', 'sidebar'],
};

const rootReducer = combineReducers({
    auth: authReducer,
    sidebar: sidebarReducer,
    modal: modalReducer,
    toast: toastReducer,
    musicPlayer: persistReducer(musicPlayerPersistConfig, musicPlayerReducer),
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
            },
        }),
});

export const persistor = persistStore(store);
