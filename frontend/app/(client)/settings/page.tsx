'use client';

import { useSettings, THEME_LIST, FONT_LIST, ACCENT_PRESETS, FontFamily, FontSize, Language } from '@/contexts/SettingsContext';
import { useI18n, LANGUAGE_LIST } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Type, Globe, Monitor, Check, Settings, Sparkles, Moon } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import privateApi from '@/services/api/private.api';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { SettingSection } from './_component/SettingSection';

const FONT_SIZES: { id: FontSize; label: string; px: string }[] = [
    { id: 'sm', label: 'Nhỏ', px: '13px' },
    { id: 'md', label: 'Vừa', px: '14px' },
    { id: 'lg', label: 'Lớn', px: '15px' },
    { id: 'xl', label: 'Rất Lớn', px: '16px' },
];

export default function SettingsPage() {
    const { settings, updateSettings } = useSettings();
    const { t, setLanguage } = useI18n();
    const auth = useSelector((state: any) => state.auth);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const saveMutation = useMutation({
        mutationFn: (data: any) => privateApi.patch('/settings/me', data),
        onSuccess: () => toast.success('Đã lưu cài đặt!', { duration: 1500 }),
        onError: () => toast.error('Lỗi khi lưu cài đặt'),
    });

    const scheduleAutoSave = (patch: any) => {
        if (!auth?.accessToken) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveMutation.mutate({ ...settings, ...patch });
        }, 1000);
    };

    const handleUpdate = (patch: any) => {
        updateSettings(patch);
        scheduleAutoSave(patch);
    };

    useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

    const saving = saveMutation.isPending;

    return (
        <div className="max-w-2xl mx-auto space-y-5 pb-12">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between pt-2"
            >
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-primary" />
                        </div>
                        {t('settings.title')}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1 ml-11">Tùy biến giao diện theo sở thích của bạn</p>
                </div>

                <div className="flex items-center gap-2">
                    <AnimatePresence>
                        {saving && (
                            <motion.span
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                className="text-xs text-muted-foreground flex items-center gap-1"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                Đang lưu...
                            </motion.span>
                        )}
                    </AnimatePresence>
                    {!auth?.accessToken && (
                        <span className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                            Đăng nhập để lưu lên server
                        </span>
                    )}
                </div>
            </motion.div>

            {/* ── Live Preview ─────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl border border-border/50 bg-card/60 p-4 flex items-center gap-4"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: settings.accentColor + '22' }}>
                        <Sparkles className="w-4.5 h-4.5" style={{ color: settings.accentColor }} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">Live Preview</p>
                        <p className="text-xs text-muted-foreground">Màu accent hiện tại</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: settings.accentColor }}
                    >
                        Button
                    </button>
                    <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg">
                        {settings.accentColor}
                    </span>
                </div>
            </motion.div>

            {/* ── Theme ─────────────────────────────────────────────────────────── */}
            <SettingSection title={t('settings.theme')} icon={<Moon className="w-4 h-4 text-primary" />}>
                <div className="grid grid-cols-3 gap-2">
                    {THEME_LIST.map((theme, i) => (
                        <motion.button
                            key={theme.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => handleUpdate({ theme: theme.id })}
                            className={`relative flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all overflow-hidden ${settings.theme === theme.id
                                    ? 'border-primary/70 bg-primary/8'
                                    : 'border-border/50 hover:border-border bg-card/40 hover:bg-card/60'
                                }`}
                        >
                            {/* Color swatch */}
                            <div
                                className="w-full h-8 rounded-lg border border-white/10"
                                style={{ backgroundColor: theme.preview }}
                            />
                            <div className="w-full">
                                <p className={`text-xs font-semibold leading-none ${settings.theme === theme.id ? 'text-primary' : 'text-foreground'}`}>
                                    {theme.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{theme.description}</p>
                            </div>
                            {settings.theme === theme.id && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                        </motion.button>
                    ))}
                </div>
            </SettingSection>

            {/* ── Accent Color ──────────────────────────────────────────────────── */}
            <SettingSection title={t('settings.accent')} icon={<Palette className="w-4 h-4 text-primary" />}>
                <div className="space-y-3">
                    {/* Presets */}
                    <div className="flex gap-2 flex-wrap">
                        {ACCENT_PRESETS.map(({ hex, name }) => (
                            <button
                                key={hex}
                                onClick={() => handleUpdate({ accentColor: hex })}
                                title={name}
                                className={`relative w-8 h-8 rounded-full transition-all hover:scale-110 ${settings.accentColor === hex ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : ''
                                    }`}
                                style={{ backgroundColor: hex }}
                            >
                                {settings.accentColor === hex && (
                                    <Check className="absolute inset-0 m-auto w-3.5 h-3.5 text-white drop-shadow" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Custom color picker */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">Màu tuỳ chỉnh:</label>
                        <div className="relative">
                            <input
                                type="color"
                                value={settings.accentColor}
                                onChange={e => handleUpdate({ accentColor: e.target.value })}
                                className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                            />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">{settings.accentColor}</span>
                        <div
                            className="ml-auto w-6 h-6 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: settings.accentColor }}
                        />
                    </div>
                </div>
            </SettingSection>

            {/* ── Font Family ───────────────────────────────────────────────────── */}
            <SettingSection title={t('settings.font')} icon={<Type className="w-4 h-4 text-primary" />}>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        {FONT_LIST.map(font => (
                            <button
                                key={font.id}
                                onClick={() => handleUpdate({ fontFamily: font.id as FontFamily })}
                                className={`p-3 rounded-xl border text-left transition-all ${settings.fontFamily === font.id
                                        ? 'border-primary/70 bg-primary/8'
                                        : 'border-border/50 hover:border-border bg-card/40'
                                    }`}
                            >
                                <p
                                    className={`text-sm font-semibold mb-0.5 ${settings.fontFamily === font.id ? 'text-primary' : 'text-foreground'}`}
                                    style={{ fontFamily: font.stack }}
                                >
                                    {font.name}
                                </p>
                                <p
                                    className="text-xs text-muted-foreground"
                                    style={{ fontFamily: font.stack }}
                                >
                                    {font.sample}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Font Size */}
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">{t('settings.fontSize')}</p>
                        <div className="flex gap-2">
                            {FONT_SIZES.map(size => (
                                <button
                                    key={size.id}
                                    onClick={() => handleUpdate({ fontSize: size.id })}
                                    className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border transition-all ${settings.fontSize === size.id
                                            ? 'border-primary/70 bg-primary/8 text-primary'
                                            : 'border-border/50 hover:border-border text-muted-foreground'
                                        }`}
                                >
                                    <span className="font-bold" style={{ fontSize: size.px }}>A</span>
                                    <span className="text-[10px] mt-0.5">{size.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </SettingSection>

            {/* ── Language ──────────────────────────────────────────────────────── */}
            <SettingSection title={t('settings.language')} icon={<Globe className="w-4 h-4 text-primary" />}>
                <div className="grid grid-cols-3 gap-2">
                    {LANGUAGE_LIST.map(lang => (
                        <button
                            key={lang.id}
                            onClick={() => { setLanguage(lang.id as Language); scheduleAutoSave({ language: lang.id }); }}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${settings.language === lang.id
                                    ? 'border-primary/70 bg-primary/8 text-primary'
                                    : 'border-border/50 hover:border-border text-muted-foreground bg-card/40'
                                }`}
                        >
                            <span className="text-xl">{lang.flag}</span>
                            <div className="text-left">
                                <p className={`text-xs font-semibold ${settings.language === lang.id ? 'text-primary' : 'text-foreground'}`}>
                                    {lang.name}
                                </p>
                            </div>
                            {settings.language === lang.id && (
                                <Check className="w-3.5 h-3.5 text-primary ml-auto" />
                            )}
                        </button>
                    ))}
                </div>
            </SettingSection>

            {/* ── UI Preferences ────────────────────────────────────────────────── */}
            <SettingSection title="Giao Diện" icon={<Monitor className="w-4 h-4 text-primary" />}>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-card/40 border border-border/40">
                        <div>
                            <p className="text-sm font-medium">Sidebar Thu Gọn</p>
                            <p className="text-xs text-muted-foreground">Hiển thị sidebar dạng icon only</p>
                        </div>
                        <button
                            onClick={() => handleUpdate({ sidebarCompact: !settings.sidebarCompact })}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${settings.sidebarCompact ? 'bg-primary' : 'bg-muted'
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.sidebarCompact ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>
                </div>
            </SettingSection>
        </div>
    );
}
