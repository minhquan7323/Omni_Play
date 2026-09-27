'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Search, ChevronLeft, ChevronRight, Zap, Calendar } from 'lucide-react';
import adminApi from '@/services/api/admin.api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MODULE_COLORS: Record<string, string> = {
    FILM: '#f43f5e',
    MUSIC: '#8b5cf6',
    WHITEBOARD: '#10b981',
    AUTH: '#6366f1',
    GLOBAL: '#f59e0b',
};

const MODULE_LABELS: Record<string, string> = {
    FILM: 'Phim',
    MUSIC: 'Nhạc',
    WHITEBOARD: 'Whiteboard',
    AUTH: 'Xác thực',
    GLOBAL: 'Hệ thống',
};

const ACTION_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#10b981', '#14b8a6', '#06b6d4'];

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

export default function AdminTrackingPage() {
    const [search, setSearch] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [page, setPage] = useState(1);

    const { data: stats } = useQuery({
        queryKey: ['admin-tracking-stats'],
        queryFn: () => adminApi.getTrackingStats(),
        select: (res: any) => res?.data ?? res,
        refetchInterval: 15_000,
    });

    const { data: logs, isLoading } = useQuery({
        queryKey: ['admin-tracking-logs', moduleFilter, actionFilter, page],
        queryFn: () => adminApi.getTrackingLogs({
            module: moduleFilter || undefined,
            action: actionFilter || undefined,
            page,
            limit: 20,
        }),
        select: (res: any) => res?.data ?? res,
    });

    const byModule = stats?.byModule ?? [];
    const byAction = stats?.byAction ?? [];
    const logData: any[] = logs?.data ?? [];
    const totalPages: number = logs?.totalPages ?? 1;
    const total: number = logs?.total ?? 0;

    const modules = ['', 'FILM', 'MUSIC', 'WHITEBOARD', 'AUTH', 'GLOBAL'];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-foreground">Tracking Logs</h1>
                <p className="text-muted-foreground text-sm mt-1">Theo dõi hoạt động người dùng theo thời gian thực</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
                        <Zap className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-black text-foreground">{stats?.totalToday ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Hôm nay</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-card border border-border rounded-2xl p-5">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
                        <Calendar className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-2xl font-black text-foreground">{stats?.totalWeek ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">7 ngày qua</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-card border border-border rounded-2xl p-5 col-span-2 sm:col-span-1">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                        <Activity className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-foreground">{total}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tổng logs hiển thị</p>
                </motion.div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* By Module Pie */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-bold text-foreground text-sm mb-1">Hoạt động theo module</h3>
                    <p className="text-xs text-muted-foreground mb-4">7 ngày gần nhất</p>
                    {byModule.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={byModule.map((m: any) => ({ ...m, name: MODULE_LABELS[m.module] ?? m.module }))} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                                    {byModule.map((m: any) => (
                                        <Cell key={m.module} fill={MODULE_COLORS[m.module] ?? '#6366f1'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
                    )}
                </div>

                {/* Top Actions Bar Chart */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-bold text-foreground text-sm mb-1">Top actions phổ biến</h3>
                    <p className="text-xs text-muted-foreground mb-4">7 ngày gần nhất</p>
                    {byAction.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={byAction} layout="vertical">
                                <XAxis type="number" tick={{ fontSize: 10, fill: '#7a849e' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="action" tick={{ fontSize: 10, fill: '#7a849e' }} axisLine={false} tickLine={false} width={90} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Lượt" radius={[0, 4, 4, 0]}>
                                    {byAction.map((_: any, idx: number) => (
                                        <Cell key={idx} fill={ACTION_COLORS[idx % ACTION_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex gap-1 p-1 bg-muted/30 rounded-xl">
                    {modules.map((m) => (
                        <button
                            key={m}
                            onClick={() => { setModuleFilter(m); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${moduleFilter === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {m === '' ? 'Tất cả' : (MODULE_LABELS[m] ?? m)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/20">
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Người dùng</th>
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Action</th>
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase">Module</th>
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Metadata</th>
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {isLoading
                            ? Array(10).fill(0).map((_, i) => (
                                <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-muted/50 rounded animate-pulse" /></td></tr>
                            ))
                            : logData.map((log) => (
                                <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-5 py-3">
                                        {log.user ? (
                                            <div className="flex items-center gap-2">
                                                {log.user.avatarUrl ? (
                                                    <img src={log.user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">{log.user.fullName?.[0]}</div>
                                                )}
                                                <p className="text-xs text-foreground font-medium truncate max-w-[120px]">{log.user.fullName}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Ẩn danh</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <code className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded-md text-foreground">{log.action}</code>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${MODULE_COLORS[log.module]}20`, color: MODULE_COLORS[log.module] ?? '#7a849e' }}>
                                            {MODULE_LABELS[log.module] ?? log.module}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 hidden md:table-cell">
                                        {log.metadata && (
                                            <code className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px] block">
                                                {JSON.stringify(log.metadata).slice(0, 60)}...
                                            </code>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="px-5 py-3.5 border-t border-border flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Trang {page}/{totalPages} • {total} logs</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
