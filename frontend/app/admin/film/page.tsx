'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Film, Eye, Heart, Clock, TrendingUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import adminApi from '@/services/api/admin.api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-popover border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
                <p className="font-semibold text-foreground mb-1">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdminFilmPage() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-film-stats'],
        queryFn: () => adminApi.getFilmStats(),
        select: (res: any) => res?.data ?? res,
    });

    const { data: histories, isLoading: historiesLoading } = useQuery({
        queryKey: ['admin-film-histories', search, page],
        queryFn: () => adminApi.getWatchHistories({ search: search || undefined, page, limit: 15 }),
        select: (res: any) => res?.data ?? res,
    });

    const watchActivity = stats?.watchActivity ?? [];
    const topFilms = stats?.topFilms ?? [];
    const historyData: any[] = histories?.data ?? [];
    const totalPages: number = histories?.totalPages ?? 1;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-foreground">Film Analytics</h1>
                <p className="text-muted-foreground text-sm mt-1">Thống kê lượt xem và yêu thích phim</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { icon: Eye, label: 'Tổng lượt xem', value: stats?.totalWatches ?? 0, color: 'bg-rose-500/10 text-rose-400' },
                    { icon: Heart, label: 'Yêu thích', value: stats?.totalFavorites ?? 0, color: 'bg-pink-500/10 text-pink-400' },
                    { icon: TrendingUp, label: 'Xem xong', value: stats?.completedWatches ?? 0, color: 'bg-emerald-500/10 text-emerald-400' },
                    { icon: Clock, label: 'Tỷ lệ xem xong', value: `${stats?.completionRate ?? 0}%`, color: 'bg-amber-500/10 text-amber-400' },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-card border border-border rounded-2xl p-5">
                        <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                            <s.icon className="w-4 h-4" />
                        </div>
                        <p className="text-2xl font-black text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Watch Activity Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-bold text-foreground text-sm mb-1">Lượt xem theo ngày</h3>
                    <p className="text-xs text-muted-foreground mb-4">7 ngày gần nhất</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={watchActivity}>
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7a849e' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#7a849e' }} axisLine={false} tickLine={false} width={28} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="watches" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Lượt xem" />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Top Films */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-bold text-foreground text-sm mb-4">Top phim được xem nhiều nhất</h3>
                    <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
                        {topFilms.length === 0 ? (
                            <div className="text-center text-muted-foreground text-sm py-8">Chưa có dữ liệu</div>
                        ) : topFilms.map((film: any, idx: number) => (
                            <div key={film.externalFilmId} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{idx + 1}</span>
                                {film.posterUrl ? (
                                    <img src={film.posterUrl} alt={film.filmTitle} className="w-8 h-11 rounded-lg object-cover shrink-0" />
                                ) : (
                                    <div className="w-8 h-11 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                                        <Film className="w-4 h-4 text-rose-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{film.filmTitle}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <div className="h-1 rounded-full bg-rose-500/20 flex-1">
                                            <div
                                                className="h-full rounded-full bg-rose-500"
                                                style={{ width: `${Math.min(100, (film.watchCount / (topFilms[0]?.watchCount || 1)) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0">{film.watchCount} lượt</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Watch History Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">Lịch sử xem gần đây</h3>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Tìm phim..."
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/20">
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Phim</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Người xem</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Tiến độ</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Trạng thái</th>
                                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Cập nhật</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {historiesLoading
                                ? Array(6).fill(0).map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td></tr>
                                ))
                                : historyData.map((h) => {
                                    const pct = h.duration > 0 ? Math.round((h.playbackPosition / h.duration) * 100) : 0;
                                    return (
                                        <tr key={h.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    {h.thumbUrl || h.posterUrl ? (
                                                        <img src={h.thumbUrl ?? h.posterUrl} alt={h.filmTitle} className="w-10 h-7 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                                            <Film className="w-3 h-3 text-rose-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-foreground text-sm truncate max-w-[150px]">{h.filmTitle}</p>
                                                        {h.episodeTitle && <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{h.episodeTitle}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 hidden sm:table-cell">
                                                <div className="flex items-center gap-2">
                                                    {h.user?.avatarUrl && <img src={h.user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />}
                                                    <p className="text-sm text-muted-foreground">{h.user?.fullName ?? 'Ẩn danh'}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div className="h-full rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{pct}%</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${h.isCompleted ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'}`}>
                                                    {h.isCompleted ? 'Hoàn thành' : 'Đang xem'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                                                {new Date(h.updatedAt).toLocaleDateString('vi-VN')}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                    {totalPages > 1 && (
                        <div className="px-5 py-3.5 border-t border-border flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Trang {page}/{totalPages}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
