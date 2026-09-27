'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { FilmService } from '@/services';
import {
    Heart, History, BookmarkPlus, Bell, User, Play,
    Trash2, ChevronRight, Film, Clock, Star, Shield,
    LogOut, Settings, Camera, Mail, Phone, Calendar,
} from 'lucide-react';
import { logout } from '@/store/slices/auth.slice';
import { useDispatch } from 'react-redux';
import { filmKeys } from '../_constants/film.keys';

// ─── CDN helper ────────────────────────────────────────────────────────────────
const CDN = 'https://phimimg.com';
function imgUrl(url?: string) {
    if (!url) return '/placeholder-film.jpg';
    if (url.startsWith('http')) return url;
    return `${CDN}/${url}`;
}

// ─── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { id: 'favorites', label: 'Yêu Thích', icon: Heart, color: 'text-red-400' },
    { id: 'history', label: 'Xem Tiếp', icon: History, color: 'text-blue-400' },
    { id: 'watchlist', label: 'Danh Sách', icon: BookmarkPlus, color: 'text-green-400' },
    { id: 'notifications', label: 'Thông Báo', icon: Bell, color: 'text-amber-400' },
    { id: 'account', label: 'Tài Khoản', icon: User, color: 'text-primary' },
];

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message, sub }: {
    icon: React.ElementType;
    message: string;
    sub?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
        >
            <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center">
                <Icon className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-muted-foreground">{message}</p>
                {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
            </div>
        </motion.div>
    );
}

// ─── Film Card (compact) ────────────────────────────────────────────────────────
function FilmCard({ film, onRemove, showProgress }: {
    film: any;
    onRemove?: () => void;
    showProgress?: boolean;
}) {
    const poster = imgUrl(film.posterUrl || film.poster_url || film.thumb_url);
    const progress = film.playbackPosition && film.duration
        ? Math.min((film.playbackPosition / film.duration) * 100, 100)
        : 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-200"
        >
            <Link href={`/film/${film.filmSlug || film.externalFilmId}`} className="flex gap-3 p-3">
                {/* Poster */}
                <div className="flex-shrink-0 w-16 h-24 relative rounded-xl overflow-hidden border border-border/50">
                    <Image
                        src={poster}
                        alt={film.filmTitle || film.name || ''}
                        fill
                        className="object-cover"
                        onError={(e: any) => { e.target.src = '/placeholder-film.jpg'; }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5 space-y-1">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {film.filmTitle || film.name}
                    </p>
                    {film.episodeSlug && (
                        <p className="text-xs text-muted-foreground">
                            Tập: {film.episodeSlug}
                        </p>
                    )}
                    {film.releaseYear && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {film.releaseYear}
                        </p>
                    )}
                    {showProgress && progress > 0 && (
                        <div className="space-y-0.5">
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground/70">
                                {Math.round(progress)}% đã xem
                            </p>
                        </div>
                    )}
                </div>
            </Link>

            {/* Remove button */}
            {onRemove && (
                <button
                    onClick={(e) => { e.preventDefault(); onRemove(); }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80"
                >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
            )}
        </motion.div>
    );
}

// ─── Favorites Tab ─────────────────────────────────────────────────────────────
function FavoritesTab() {
    const auth = useSelector((state: any) => state.auth);
    const queryClient = useQueryClient();

    const { data: favorites, isLoading } = useQuery({
        queryKey: filmKeys.favorites(),
        queryFn: FilmService.getFavorites,
        select: (res: any) => res?.data,
        enabled: !!auth?.accessToken,
    });

    const removeMutation = useMutation({
        mutationFn: (film: any) => FilmService.toggleFavorite({
            externalFilmId: film.externalFilmId,
            filmTitle: film.filmTitle,
            filmSlug: film.slug,
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-favorites'] }),
    });

    const items: any[] = Array.isArray(favorites) ? favorites : [];

    if (!auth?.accessToken) {
        return <EmptyState icon={Heart} message="Vui lòng đăng nhập" sub="Để xem danh sách yêu thích của bạn" />;
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3 p-3 bg-card border border-border rounded-2xl">
                        <div className="w-16 h-24 bg-white/5 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-white/5 rounded w-3/4" />
                            <div className="h-3 bg-white/5 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <EmptyState
                icon={Heart}
                message="Chưa có phim yêu thích"
                sub="Nhấn icon ❤️ trên phim để thêm vào yêu thích"
            />
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">{items.length}</span> phim yêu thích
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                    {items.map((film: any) => (
                        <FilmCard
                            key={film._id || film.externalFilmId}
                            film={film}
                            onRemove={() => removeMutation.mutate(film)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab() {
    const auth = useSelector((state: any) => state.auth);

    const { data: history, isLoading } = useQuery({
        queryKey: ['user-history'],
        queryFn: FilmService.getHistory,
        select: (res: any) => res?.data || res || [],
        enabled: !!auth?.accessToken,
    });

    const items: any[] = Array.isArray(history) ? history : [];

    if (!auth?.accessToken) {
        return <EmptyState icon={History} message="Vui lòng đăng nhập" sub="Để xem lịch sử xem phim của bạn" />;
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3 p-3 bg-card border border-border rounded-2xl">
                        <div className="w-16 h-24 bg-white/5 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-white/5 rounded w-3/4" />
                            <div className="h-3 bg-white/5 rounded w-1/2" />
                            <div className="h-1 bg-primary/30 rounded w-full mt-3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <EmptyState
                icon={History}
                message="Chưa có lịch sử xem"
                sub="Xem phim để lưu lịch sử tại đây"
            />
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">{items.length}</span> phim đã xem
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                    {items.map((film: any) => (
                        <FilmCard
                            key={film._id || film.externalFilmId}
                            film={film}
                            showProgress
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─── Watchlist Tab (placeholder) ───────────────────────────────────────────────
function WatchlistTab() {
    return (
        <EmptyState
            icon={BookmarkPlus}
            message="Tính năng đang phát triển"
            sub="Danh sách phim muốn xem sẽ sớm ra mắt"
        />
    );
}

// ─── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
    return (
        <EmptyState
            icon={Bell}
            message="Chưa có thông báo"
            sub="Các cập nhật phim và hoạt động sẽ hiển thị tại đây"
        />
    );
}

// ─── Account Tab ───────────────────────────────────────────────────────────────
function AccountTab() {
    const auth = useSelector((state: any) => state.auth);
    const dispatch = useDispatch();
    const router = useRouter();

    const user = auth?.user;

    if (!auth?.accessToken || !user) {
        return (
            <EmptyState
                icon={User}
                message="Vui lòng đăng nhập"
                sub="Để quản lý thông tin tài khoản"
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 max-w-lg"
        >
            {/* Avatar + Name */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                                <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                            ) : (
                                <span className="text-3xl font-bold text-primary">
                                    {(user.name || user.email || 'U')[0].toUpperCase()}
                                </span>
                            )}
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
                            <Camera className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-foreground truncate">
                            {user.name || 'Người dùng'}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-semibold rounded-full border border-primary/25">
                                <Shield className="w-2.5 h-2.5" />
                                Thành viên
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info fields */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Thông tin</h4>
                {[
                    { icon: Mail, label: 'Email', value: user.email },
                    { icon: Phone, label: 'Điện thoại', value: user.phone || '—' },
                    { icon: Calendar, label: 'Ngày tham gia', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—' },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground">{item.label}</p>
                            <p className="text-sm text-foreground truncate">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="bg-card border border-border rounded-2xl p-2 space-y-1">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/10 transition-colors group"
                >
                    <Settings className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm text-foreground">Cài đặt</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </Link>
                <button
                    onClick={() => {
                        dispatch(logout());
                        router.push('/');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors group text-left"
                >
                    <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
                    <span className="text-sm text-foreground group-hover:text-red-400 transition-colors">Đăng xuất</span>
                </button>
            </div>
        </motion.div>
    );
}

// ─── Tab content map ───────────────────────────────────────────────────────────
const TAB_CONTENT: Record<string, React.FC> = {
    favorites: FavoritesTab,
    history: HistoryTab,
    watchlist: WatchlistTab,
    notifications: NotificationsTab,
    account: AccountTab,
};

// ─── Main Account Page ─────────────────────────────────────────────────────────
export default function AccountPage() {
    const [activeTab, setActiveTab] = useState('favorites');
    const auth = useSelector((state: any) => state.auth);

    const ActiveContent = TAB_CONTENT[activeTab] || FavoritesTab;
    const activeItem = NAV_ITEMS.find(n => n.id === activeTab);

    return (
        <div className="min-h-screen">
            <div className="flex gap-6">
                {/* ── Sidebar ────────────────────────────────────────────────── */}
                <aside className="w-56 flex-shrink-0">
                    <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="sticky top-20 bg-card border border-border rounded-2xl p-3 space-y-1"
                    >
                        {/* User brief */}
                        {auth?.user && (
                            <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-border">
                                <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {auth.user.avatar ? (
                                        <Image src={auth.user.avatar} alt={auth.user.name} width={36} height={36} className="object-cover" />
                                    ) : (
                                        <span className="text-sm font-bold text-primary">
                                            {(auth.user.name || auth.user.email || 'U')[0].toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate">
                                        {auth.user.name || 'Người dùng'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                        {auth.user.email}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Nav */}
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-3 pb-1">
                            Quản lý tài khoản
                        </p>
                        {NAV_ITEMS.map(item => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                        }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="account-nav-active"
                                            className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <item.icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isActive ? 'text-primary' : item.color}`} />
                                    <span className="relative z-10">{item.label}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                </aside>

                {/* ── Main Content ─────────────────────────────────────────── */}
                <main className="flex-1 min-w-0">
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-5 flex items-center gap-2"
                    >
                        {activeItem && (
                            <>
                                <activeItem.icon className={`w-5 h-5 ${activeItem.color}`} />
                                <h1 className="text-xl font-bold text-foreground">{activeItem.label}</h1>
                            </>
                        )}
                    </motion.div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ActiveContent />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
