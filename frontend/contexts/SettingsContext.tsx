'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light' | 'oled' | 'sepia' | 'forest' | 'ocean';
export type FontFamily = 'inter' | 'outfit' | 'mono' | 'noto';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type Language = 'vi' | 'en' | 'ja';

export interface AppSettings {
    theme: Theme;
    language: Language;
    fontFamily: FontFamily;
    accentColor: string;
    fontSize: FontSize;
    sidebarCompact: boolean;
}

interface SettingsContextValue {
    settings: AppSettings;
    updateSettings: (patch: Partial<AppSettings>) => void;
    loadServerSettings: (data: Partial<AppSettings>) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    language: 'vi',
    fontFamily: 'inter',
    accentColor: '#6366f1',
    fontSize: 'md',
    sidebarCompact: false,
};

// ─── Theme palettes (hex values) ─────────────────────────────────────────────
interface ThemePalette {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    input: string;
}

const THEME_PALETTES: Record<Theme, ThemePalette> = {
    dark: {
        background: '#111318',
        foreground: '#f0f2f7',
        card: '#181c24',
        cardForeground: '#f0f2f7',
        popover: '#1a1e28',
        popoverForeground: '#f0f2f7',
        secondary: '#1e2233',
        secondaryForeground: '#c8cee0',
        muted: '#1e2233',
        mutedForeground: '#7a849e',
        accent: '#1e2233',
        accentForeground: '#f0f2f7',
        border: '#252b3b',
        input: '#1e2233',
    },
    light: {
        background: '#f7f8fc',
        foreground: '#111318',
        card: '#ffffff',
        cardForeground: '#111318',
        popover: '#ffffff',
        popoverForeground: '#111318',
        secondary: '#eef0f6',
        secondaryForeground: '#111318',
        muted: '#eef0f6',
        mutedForeground: '#62697a',
        accent: '#eef0f6',
        accentForeground: '#111318',
        border: '#dde1ec',
        input: '#eef0f6',
    },
    oled: {
        background: '#000000',
        foreground: '#f2f2f2',
        card: '#0a0a0a',
        cardForeground: '#f2f2f2',
        popover: '#0d0d0d',
        popoverForeground: '#f2f2f2',
        secondary: '#111111',
        secondaryForeground: '#c0c0c0',
        muted: '#111111',
        mutedForeground: '#666666',
        accent: '#111111',
        accentForeground: '#f2f2f2',
        border: '#1a1a1a',
        input: '#111111',
    },
    sepia: {
        background: '#f4ede4',
        foreground: '#2c1e10',
        card: '#ede3d6',
        cardForeground: '#2c1e10',
        popover: '#ede3d6',
        popoverForeground: '#2c1e10',
        secondary: '#e2d4c1',
        secondaryForeground: '#2c1e10',
        muted: '#e2d4c1',
        mutedForeground: '#7a6652',
        accent: '#e2d4c1',
        accentForeground: '#2c1e10',
        border: '#cfc0ab',
        input: '#ede3d6',
    },
    forest: {
        background: '#0d150f',
        foreground: '#d8edda',
        card: '#121c14',
        cardForeground: '#d8edda',
        popover: '#141e16',
        popoverForeground: '#d8edda',
        secondary: '#192b1c',
        secondaryForeground: '#a8c9ab',
        muted: '#192b1c',
        mutedForeground: '#6a8f6d',
        accent: '#192b1c',
        accentForeground: '#d8edda',
        border: '#213326',
        input: '#192b1c',
    },
    ocean: {
        background: '#091421',
        foreground: '#daeaf8',
        card: '#0e1e2f',
        cardForeground: '#daeaf8',
        popover: '#102035',
        popoverForeground: '#daeaf8',
        secondary: '#142840',
        secondaryForeground: '#9bbfd8',
        muted: '#142840',
        mutedForeground: '#5b87a8',
        accent: '#142840',
        accentForeground: '#daeaf8',
        border: '#1c3451',
        input: '#142840',
    },
};

const FONT_FAMILIES: Record<FontFamily, string> = {
    inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
    outfit: "'Outfit', ui-sans-serif, system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
    noto: "'Noto Sans', ui-sans-serif, system-ui, sans-serif",
};

const FONT_SIZES: Record<FontSize, string> = {
    sm: '13px',
    md: '14px',
    lg: '15px',
    xl: '16px',
};

// ─── Apply to DOM ─────────────────────────────────────────────────────────────
function applySettings(settings: AppSettings) {
    const root = document.documentElement;
    const p = THEME_PALETTES[settings.theme];

    // Theme palette
    root.style.setProperty('--background', p.background);
    root.style.setProperty('--foreground', p.foreground);
    root.style.setProperty('--card', p.card);
    root.style.setProperty('--card-foreground', p.cardForeground);
    root.style.setProperty('--popover', p.popover);
    root.style.setProperty('--popover-foreground', p.popoverForeground);
    root.style.setProperty('--secondary', p.secondary);
    root.style.setProperty('--secondary-foreground', p.secondaryForeground);
    root.style.setProperty('--muted', p.muted);
    root.style.setProperty('--muted-foreground', p.mutedForeground);
    root.style.setProperty('--accent', p.accent);
    root.style.setProperty('--accent-foreground', p.accentForeground);
    root.style.setProperty('--border', p.border);
    root.style.setProperty('--input', p.input);

    // Accent / primary color
    root.style.setProperty('--primary', settings.accentColor);
    root.style.setProperty('--primary-foreground', '#ffffff');
    root.style.setProperty('--ring', settings.accentColor);

    // Font family
    root.style.setProperty('--font-family', FONT_FAMILIES[settings.fontFamily]);

    // Font size
    root.style.fontSize = FONT_SIZES[settings.fontSize];

    // color-scheme hint for browser
    root.style.colorScheme = (settings.theme === 'light' || settings.theme === 'sepia') ? 'light' : 'dark';
}

// ─── Context ──────────────────────────────────────────────────────────────────
const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('app-settings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const merged = { ...DEFAULT_SETTINGS, ...parsed };
                setSettings(merged);
                applySettings(merged);
            } catch {
                applySettings(DEFAULT_SETTINGS);
            }
        } else {
            applySettings(DEFAULT_SETTINGS);
        }
    }, []);

    const updateSettings = useCallback((patch: Partial<AppSettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...patch };
            localStorage.setItem('app-settings', JSON.stringify(next));
            applySettings(next);
            return next;
        });
    }, []);

    // Called after login to merge server settings (server wins)
    const loadServerSettings = useCallback((data: Partial<AppSettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...data };
            localStorage.setItem('app-settings', JSON.stringify(next));
            applySettings(next);
            return next;
        });
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, loadServerSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
    return ctx;
}

// ─── Export theme/font meta for UI ───────────────────────────────────────────
export const THEME_LIST: { id: Theme; name: string; preview: string; description: string }[] = [
    { id: 'dark', name: 'Dark', preview: '#111318', description: 'Nền tối mặc định' },
    { id: 'light', name: 'Light', preview: '#f7f8fc', description: 'Nền sáng' },
    { id: 'oled', name: 'OLED Black', preview: '#000000', description: 'Đen thuần, tiết kiệm pin' },
    { id: 'sepia', name: 'Sepia', preview: '#f4ede4', description: 'Màu ấm dễ đọc' },
    { id: 'forest', name: 'Forest', preview: '#0d150f', description: 'Xanh rừng' },
    { id: 'ocean', name: 'Ocean', preview: '#091421', description: 'Xanh đại dương' },
];

export const FONT_LIST: { id: FontFamily; name: string; sample: string; stack: string }[] = [
    { id: 'inter', name: 'Inter', sample: 'Aa Bb 123', stack: 'Inter, sans-serif' },
    { id: 'outfit', name: 'Outfit', sample: 'Aa Bb 123', stack: 'Outfit, sans-serif' },
    { id: 'mono', name: 'JetBrains Mono', sample: 'Aa Bb 123', stack: 'JetBrains Mono, monospace' },
    { id: 'noto', name: 'Noto Sans', sample: 'Aa Bb 123', stack: 'Noto Sans, sans-serif' },
];

export const ACCENT_PRESETS = [
    { hex: '#6366f1', name: 'Indigo' },
    { hex: '#8b5cf6', name: 'Violet' },
    { hex: '#ec4899', name: 'Pink' },
    { hex: '#f59e0b', name: 'Amber' },
    { hex: '#10b981', name: 'Emerald' },
    { hex: '#06b6d4', name: 'Cyan' },
    { hex: '#ef4444', name: 'Red' },
    { hex: '#f97316', name: 'Orange' },
    { hex: '#a855f7', name: 'Purple' },
    { hex: '#14b8a6', name: 'Teal' },
];
