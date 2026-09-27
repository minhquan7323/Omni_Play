'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Users, Music, Film, Activity, Layout,
    TrendingUp, ArrowUp, ArrowDown, Star
} from 'lucide-react';
import adminApi from '@/services/api/admin.api';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MODULE_COLORS: Record<string, string> = {
    FILM: '#f43f5e',
    MUSIC: '#8b5cf6',
    WHITEBOARD: '#10b981',
    AUTH: '#6366f1',
    GLOBAL: '#f59e0b',
};

function StatCard({ icon: Icon, label, value, sub, color, change }: {
    icon: any; label: string; value: string | number;
    sub?: string; color: string; change?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3"
        >
            <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${change >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                        {change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-2xl font-black text-foreground">{value}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{label}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
        </motion.div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-popover border border-border rounded-xl px-3 py-2 shadow-xl text-xs">
                <p className="font-semibold text-foreground mb-1">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }}>
                        {p.name}: {p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-dashboard-stats'],
        queryFn: () => adminApi.getDashboardStats(),
        select: (res: any) => res?.data ?? res,
        refetchInterval: 30_000,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array(8).fill(0).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-2xl p-5 h-32 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const s = stats;

    const userStatsCards = [
        { icon: Users, label: 'Tổng người dùng', value: s?.users?.total ?? 0, sub: `+${s?.users?.newThisWeek ?? 0} tuần này`, color: 'bg-indigo-500/10 text-indigo-400', change: 12 },
        { icon: TrendingUp, label: 'Đang hoạt động', value: s?.users?.active ?? 0, sub: 'Trạng thái ACTIVE', color: 'bg-emerald-500/10 text-emerald-400', change: 3 },
        { icon: Music, label: 'Bài hát', value: s?.music?.tracks ?? 0, sub: `${s?.music?.albums ?? 0} albums • ${s?.music?.artists ?? 0} nghệ sĩ`, color: 'bg-violet-500/10 text-violet-400' },
        { icon: Film, label: 'Lượt xem phim', value: s?.film?.totalWatches ?? 0, sub: `${s?.film?.totalFavorites ?? 0} yêu thích`, color: 'bg-rose-500/10 text-rose-400', change: 8 },
        { icon: Activity, label: 'Hoạt động hôm nay', value: s?.activity?.today ?? 0, sub: `${s?.activity?.thisWeek ?? 0} tuần này`, color: 'bg-amber-500/10 text-amber-400', change: 5 },
        { icon: Layout, label: 'Whiteboards', value: s?.whiteboard?.total ?? 0, sub: 'Tổng boards đang có', color: 'bg-teal-500/10 text-teal-400' },
        { icon: Users, label: 'Đã banned', value: s?.users?.banned ?? 0, sub: `${s?.users?.suspended ?? 0} đang tạm khóa`, color: 'bg-red-500/10 text-red-400' },
        { icon: Star, label: 'Yêu thích phim', value: s?.film?.totalFavorites ?? 0, sub: 'Tổng film favorites', color: 'bg-pink-500/10 text-pink-400' },
    ];

    const userGrowth = s?.charts?.userGrowth ?? [];
    const activityByModule = s?.charts?.activityByModule ?? [];

    return (
        <div className="space-y-8">
            {/* Page title */}
            <div>
                <h1 className="text-2xl font-black text-foreground">Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">Tổng quan hệ thống theo thời gian thực</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {userStatsCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                    >
                        <StatCard {...card} />
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* User Growth Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 bg-card border border-border rounded-2xl p-5"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-bold text-foreground text-sm">Người dùng mới</h3>
                            <p className="text-xs text-muted-foreground">7 ngày gần nhất</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={userGrowth}>
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7a849e' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#7a849e' }} axisLine={false} tickLine={false} width={28} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} name="Người dùng" />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Activity by Module */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card border border-border rounded-2xl p-5"
                >
                    <div className="mb-5">
                        <h3 className="font-bold text-foreground text-sm">Hoạt động theo module</h3>
                        <p className="text-xs text-muted-foreground">7 ngày gần nhất</p>
                    </div>
                    {activityByModule.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={activityByModule}
                                    dataKey="count"
                                    nameKey="module"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={75}
                                    innerRadius={40}
                                >
                                    {activityByModule.map((entry: any) => (
                                        <Cell key={entry.module} fill={MODULE_COLORS[entry.module] ?? '#6366f1'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any, n: any) => [v, n]} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                            Chưa có dữ liệu
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Quick Status */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card border border-border rounded-2xl p-5"
            >
                <h3 className="font-bold text-foreground text-sm mb-4">Trạng thái người dùng</h3>
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'Active', value: s?.users?.active, color: 'bg-emerald-400' },
                        { label: 'Suspended', value: s?.users?.suspended, color: 'bg-amber-400' },
                        { label: 'Banned', value: s?.users?.banned, color: 'bg-red-400' },
                    ].map((item) => {
                        const pct = s?.users?.total ? Math.round(((item.value ?? 0) / s.users.total) * 100) : 0;
                        return (
                            <div key={item.label} className="flex-1 min-w-[120px]">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-muted-foreground">{item.label}</span>
                                    <span className="text-foreground font-semibold">{item.value ?? 0}</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${item.color}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.8, delay: 0.6 }}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">{pct}%</p>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
