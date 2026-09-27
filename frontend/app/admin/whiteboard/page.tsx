'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Layout, Users, Lock, Globe, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import adminApi from '@/services/api/admin.api';

export default function AdminWhiteboardPage() {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['admin-whiteboards', page, search],
        queryFn: () => adminApi.getWhiteboards({ page, limit: 20, search: search || undefined }),
        select: (res: any) => res?.data ?? res,
    });

    const deleteMutation = useMutation({
        mutationFn: (boardId: string) => adminApi.deleteWhiteboard(boardId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-whiteboards'] });
            toast.success('Đã xóa whiteboard');
        },
        onError: (err: any) => toast.error(err.message ?? 'Lỗi xóa whiteboard'),
    });

    const boards: any[] = data?.data ?? [];
    const total: number = data?.total ?? 0;
    const totalPages: number = data?.totalPages ?? 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Quản lý Whiteboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {total} boards trong hệ thống
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Tìm kiếm board theo tên..."
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center mb-3">
                        <Layout className="w-4 h-4 text-teal-400" />
                    </div>
                    <p className="text-2xl font-black text-foreground">{total}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tổng Boards</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                        <Globe className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-black text-foreground">
                        {boards.filter((b) => !b.isPrivate).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Công khai</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 col-span-2 sm:col-span-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                        <Lock className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-2xl font-black text-foreground">
                        {boards.filter((b) => b.isPrivate).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Riêng tư</p>
                </div>
            </div>

            {/* Boards Grid */}
            {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array(8).fill(0).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-2xl h-52 animate-pulse" />
                    ))}
                </div>
            ) : boards.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-16 text-center">
                    <Layout className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Chưa có whiteboard nào</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {boards.map((board, i) => (
                        <motion.div
                            key={board.boardId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-card border border-border rounded-2xl overflow-hidden group"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-muted/30 overflow-hidden">
                                {board.thumbnailUrl ? (
                                    <img src={board.thumbnailUrl} alt={board.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Layout className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                )}

                                {/* Privacy badge */}
                                <div className="absolute top-2 left-2">
                                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${board.isPrivate ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'}`}>
                                        {board.isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                                        {board.isPrivate ? 'Riêng tư' : 'Công khai'}
                                    </span>
                                </div>

                                {/* Delete button */}
                                <button
                                    onClick={() => {
                                        if (confirm(`Xóa board "${board.name}"?`)) {
                                            deleteMutation.mutate(board.boardId);
                                        }
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <p className="font-semibold text-foreground text-sm truncate">{board.name || 'Untitled Board'}</p>

                                <div className="flex items-center gap-2 mt-2">
                                    {board.owner?.avatarUrl ? (
                                        <img src={board.owner.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[9px] font-bold">
                                            {board.owner?.fullName?.[0] ?? '?'}
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground truncate">{board.owner?.fullName ?? 'Unknown'}</p>
                                </div>

                                <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {board.members?.length ?? 0} thành viên
                                    </span>
                                    {board.createdAt && (
                                        <span>{new Date(board.createdAt).toLocaleDateString('vi-VN')}</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">Trang {page}/{totalPages} • {total} boards</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
