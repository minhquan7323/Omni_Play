'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useSettings, Language } from './SettingsContext';

// ─── Translation Dictionaries ─────────────────────────────────────────────────
type TranslationKey =
    | 'nav.film' | 'nav.music' | 'nav.whiteboard' | 'nav.settings' | 'nav.admin'
    | 'auth.login' | 'auth.register' | 'auth.logout' | 'auth.loginGoogle'
    | 'auth.email' | 'auth.password' | 'auth.fullName' | 'auth.forgotPassword'
    | 'film.title' | 'film.new' | 'film.tvShows' | 'film.movies' | 'film.search'
    | 'film.history' | 'film.favorites' | 'film.watchNow' | 'film.detail'
    | 'music.title' | 'music.trending' | 'music.search' | 'music.library'
    | 'music.playlist' | 'music.favorites' | 'music.playing' | 'music.next' | 'music.prev'
    | 'whiteboard.title' | 'whiteboard.create' | 'whiteboard.private' | 'whiteboard.public'
    | 'settings.title' | 'settings.appearance' | 'settings.language' | 'settings.theme'
    | 'settings.font' | 'settings.fontSize' | 'settings.accent' | 'settings.save'
    | 'admin.title' | 'admin.users' | 'admin.roles' | 'admin.permissions' | 'admin.stats'
    | 'common.loading' | 'common.error' | 'common.retry' | 'common.close' | 'common.save'
    | 'common.cancel' | 'common.delete' | 'common.edit' | 'common.add' | 'common.search';

type Translations = Record<TranslationKey, string>;

const VI: Translations = {
    'nav.film': 'Phim',
    'nav.music': 'Âm Nhạc',
    'nav.whiteboard': 'Bảng Vẽ',
    'nav.settings': 'Cài Đặt',
    'nav.admin': 'Quản Trị',
    'auth.login': 'Đăng Nhập',
    'auth.register': 'Đăng Ký',
    'auth.logout': 'Đăng Xuất',
    'auth.loginGoogle': 'Đăng nhập với Google',
    'auth.email': 'Địa chỉ Email',
    'auth.password': 'Mật khẩu',
    'auth.fullName': 'Họ và tên',
    'auth.forgotPassword': 'Quên mật khẩu?',
    'film.title': 'Phim & TV Shows',
    'film.new': 'Phim Mới Cập Nhật',
    'film.tvShows': 'Phim Bộ',
    'film.movies': 'Phim Lẻ',
    'film.search': 'Tìm kiếm phim',
    'film.history': 'Lịch Sử Xem',
    'film.favorites': 'Phim Yêu Thích',
    'film.watchNow': 'Xem Ngay',
    'film.detail': 'Chi Tiết',
    'music.title': 'Âm Nhạc',
    'music.trending': 'Đang Hot',
    'music.search': 'Tìm kiếm nhạc',
    'music.library': 'Thư Viện',
    'music.playlist': 'Danh Sách Phát',
    'music.favorites': 'Bài Yêu Thích',
    'music.playing': 'Đang phát',
    'music.next': 'Bài tiếp',
    'music.prev': 'Bài trước',
    'whiteboard.title': 'Bảng Vẽ',
    'whiteboard.create': 'Tạo Bảng Mới',
    'whiteboard.private': 'Riêng Tư',
    'whiteboard.public': 'Công Khai',
    'settings.title': 'Cài Đặt',
    'settings.appearance': 'Giao Diện',
    'settings.language': 'Ngôn Ngữ',
    'settings.theme': 'Chủ Đề',
    'settings.font': 'Font Chữ',
    'settings.fontSize': 'Cỡ Chữ',
    'settings.accent': 'Màu Nhấn',
    'settings.save': 'Lưu Cài Đặt',
    'admin.title': 'Quản Trị Hệ Thống',
    'admin.users': 'Quản Lý Users',
    'admin.roles': 'Quản Lý Roles',
    'admin.permissions': 'Phân Quyền',
    'admin.stats': 'Thống Kê',
    'common.loading': 'Đang tải...',
    'common.error': 'Đã xảy ra lỗi',
    'common.retry': 'Thử lại',
    'common.close': 'Đóng',
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
    'common.delete': 'Xóa',
    'common.edit': 'Chỉnh sửa',
    'common.add': 'Thêm',
    'common.search': 'Tìm kiếm',
};

const EN: Translations = {
    'nav.film': 'Films',
    'nav.music': 'Music',
    'nav.whiteboard': 'Whiteboard',
    'nav.settings': 'Settings',
    'nav.admin': 'Admin',
    'auth.login': 'Sign In',
    'auth.register': 'Sign Up',
    'auth.logout': 'Sign Out',
    'auth.loginGoogle': 'Sign in with Google',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.forgotPassword': 'Forgot password?',
    'film.title': 'Films & TV Shows',
    'film.new': 'New Updates',
    'film.tvShows': 'TV Series',
    'film.movies': 'Movies',
    'film.search': 'Search films...',
    'film.history': 'Watch History',
    'film.favorites': 'Favorites',
    'film.watchNow': 'Watch Now',
    'film.detail': 'Details',
    'music.title': 'Music',
    'music.trending': 'Trending',
    'music.search': 'Search music...',
    'music.library': 'Library',
    'music.playlist': 'Playlist',
    'music.favorites': 'Liked Songs',
    'music.playing': 'Now Playing',
    'music.next': 'Next',
    'music.prev': 'Previous',
    'whiteboard.title': 'Whiteboard',
    'whiteboard.create': 'Create Board',
    'whiteboard.private': 'Private',
    'whiteboard.public': 'Public',
    'settings.title': 'Settings',
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.font': 'Font',
    'settings.fontSize': 'Font Size',
    'settings.accent': 'Accent Color',
    'settings.save': 'Save Settings',
    'admin.title': 'System Admin',
    'admin.users': 'User Management',
    'admin.roles': 'Role Management',
    'admin.permissions': 'Permissions',
    'admin.stats': 'Statistics',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Retry',
    'common.close': 'Close',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
};

const JA: Translations = {
    'nav.film': '映画',
    'nav.music': '音楽',
    'nav.whiteboard': 'ホワイトボード',
    'nav.settings': '設定',
    'nav.admin': '管理',
    'auth.login': 'ログイン',
    'auth.register': '新規登録',
    'auth.logout': 'ログアウト',
    'auth.loginGoogle': 'Googleでログイン',
    'auth.email': 'メールアドレス',
    'auth.password': 'パスワード',
    'auth.fullName': '氏名',
    'auth.forgotPassword': 'パスワードを忘れた？',
    'film.title': '映画・テレビシリーズ',
    'film.new': '新着映画',
    'film.tvShows': 'テレビシリーズ',
    'film.movies': '映画',
    'film.search': '映画を検索...',
    'film.history': '視聴履歴',
    'film.favorites': 'お気に入り',
    'film.watchNow': '今すぐ視聴',
    'film.detail': '詳細',
    'music.title': '音楽',
    'music.trending': 'トレンド',
    'music.search': '音楽を検索...',
    'music.library': 'ライブラリ',
    'music.playlist': 'プレイリスト',
    'music.favorites': 'お気に入り',
    'music.playing': '再生中',
    'music.next': '次の曲',
    'music.prev': '前の曲',
    'whiteboard.title': 'ホワイトボード',
    'whiteboard.create': '新しいボード',
    'whiteboard.private': 'プライベート',
    'whiteboard.public': '公開',
    'settings.title': '設定',
    'settings.appearance': '外観',
    'settings.language': '言語',
    'settings.theme': 'テーマ',
    'settings.font': 'フォント',
    'settings.fontSize': 'フォントサイズ',
    'settings.accent': 'アクセントカラー',
    'settings.save': '設定を保存',
    'admin.title': 'システム管理',
    'admin.users': 'ユーザー管理',
    'admin.roles': 'ロール管理',
    'admin.permissions': '権限',
    'admin.stats': '統計',
    'common.loading': '読み込み中...',
    'common.error': 'エラーが発生しました',
    'common.retry': '再試行',
    'common.close': '閉じる',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.add': '追加',
    'common.search': '検索',
};

const DICTIONARIES: Record<Language, Translations> = { vi: VI, en: EN, ja: JA };

// ─── Context ──────────────────────────────────────────────────────────────────
interface I18nContextValue {
    t: (key: TranslationKey) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const { settings, updateSettings } = useSettings();
    const lang = settings.language;

    const t = useCallback(
        (key: TranslationKey): string => {
            return DICTIONARIES[lang]?.[key] || DICTIONARIES['vi'][key] || key;
        },
        [lang],
    );

    const setLanguage = useCallback(
        (language: Language) => {
            updateSettings({ language });
        },
        [updateSettings],
    );

    return (
        <I18nContext.Provider value={{ t, language: lang, setLanguage }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n must be inside I18nProvider');
    return ctx;
}

export const LANGUAGE_LIST = [
    { id: 'vi' as Language, name: 'Tiếng Việt', flag: '🇻🇳' },
    { id: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { id: 'ja' as Language, name: '日本語', flag: '🇯🇵' },
];
