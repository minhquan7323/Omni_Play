'use client';

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSettings } from '@/contexts/SettingsContext';
import privateApi from '@/services/api/private.api';

export function useServerSettingsSync() {
    const { loadServerSettings } = useSettings();
    const auth = useSelector((state: any) => state.auth);
    const lastTokenRef = useRef<string | null>(null);

    useEffect(() => {
        const token = auth?.accessToken;

        if (token && token !== lastTokenRef.current) {
            lastTokenRef.current = token;
            privateApi
                .get('/settings/me')
                .then((res: any) => {
                    const data = res?.data?.data ?? res?.data;
                    if (data) loadServerSettings(data);
                })
                .catch(() => {
                    // If error (settings not on server yet), keep localStorage settings
                });
        }

        if (!token) {
            lastTokenRef.current = null;
        }
    }, [auth?.accessToken, loadServerSettings]);
}
