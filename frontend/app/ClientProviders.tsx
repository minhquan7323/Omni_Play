'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { persistor, store } from '@/store';
import { PersistGate } from 'redux-persist/integration/react';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { MiniPlayerProvider } from '@/contexts/MiniPlayerContext';
import { useServerSettingsSync } from '@/hooks/useServerSettingsSync';
import { AudioProvider } from '@/providers/audio.provider';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 10 * 1000, // 10 phút
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

function SettingsSyncBridge({ children }: { children: React.ReactNode }) {
    useServerSettingsSync();
    return <>{children}</>;
}

export default function ClientProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <SettingsProvider>
                        <I18nProvider>
                            <MiniPlayerProvider>
                                <AudioProvider>
                                    <SettingsSyncBridge>
                                        {children}
                                    </SettingsSyncBridge>
                                </AudioProvider>
                            </MiniPlayerProvider>
                        </I18nProvider>
                    </SettingsProvider>
                </PersistGate>
            </Provider>
        </QueryClientProvider>
    );
}
