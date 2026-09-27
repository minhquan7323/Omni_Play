'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, CheckCircle, AlertCircle, Ban, Shield, Trash2, Plus, ChevronLeft, ChevronRight, X, Eye, Film, Music, Activity } from 'lucide-react';
import { toast } from 'sonner';
import adminApi from '@/services/api/admin.api';

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    SUSPENDED: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    BANNED: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    SUSPENDED: 'Tạm khóa',
    BANNED: 'Đã ban',
};

const PROVIDER_LABELS: Record<string, string> = {
    LOCAL: 'Email',
    GOOGLE: 'Google',
};

function AssignRoleModal({ user, roles, onClose }: { user: any; roles: any[]; onClose: () => void }) {
    const qc = useQueryClient();
    const [selectedRoleId, setSelectedRoleId] = useState('');

    const assignMutation = useMutation({
        mutationFn: () => adminApi.assignRole(user.id, selectedRoleId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Đã gán role thành công');
            onClose();
        },
        onError: (err: any) => toast.error(err.message ?? 'Lỗi khi gán role'),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="font-bold text-foreground mb-1">Gán Role</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Gán role cho <strong>{user.fullName}</strong>
                </p>
                <div className="flex flex-col gap-2 mb-4">
                    {roles.filter((r) => !r.isSystem).map((role) => (
                        <label key={role.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedRoleId === role.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                            <input type="radio" name="role" value={role.id} onChange={() => setSelectedRoleId(role.id)} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedRoleId === role.id ? 'border-primary' : 'border-muted-foreground'}`}>
                                {selectedRoleId === role.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">{role.name}</p>
                                <p className="text-xs text-muted-foreground">{role.scope}</p>
                            </div>
                        </label>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                        Hủy
                    </button>
                    <button
                        onClick={() => assignMutation.mutate()}
                        disabled={!selectedRoleId || assignMutation.isPending}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {assignMutation.isPending ? 'Đang gán...' : 'Gán role'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
    const { data, isLoading } = useQuery({
        queryKey: ['admin-user-detail', userId],
        queryFn: () => adminApi.getUserById(userId),
        select: (res: any) => res?.data ?? res,
    });

    const user = data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-foreground">Chi tiết người dùng</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
                </div>
                {isLoading ? (
                    <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-10 bg-muted/50 rounded-xl animate-pulse" />)}</div>
                ) : user ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                                    {user.fullName?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-foreground">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-1 ${STATUS_COLORS[user.status] ?? 'text-muted-foreground bg-muted border-border'}`}>
                                    {STATUS_LABELS[user.status] ?? user.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: Film, label: 'Phim đã xem', value: user._count?.filmWatchHistory ?? 0, color: 'text-rose-400 bg-rose-400/10' },
                                { icon: Music, label: 'Tracks upload', value: user._count?.uploadedTracks ?? 0, color: 'text-violet-400 bg-violet-400/10' },
                                { icon: Eye, label: 'Phim yêu thích', value: user._count?.filmFavorites ?? 0, color: 'text-pink-400 bg-pink-400/10' },
                                { icon: Activity, label: 'Hoạt động', value: user._count?.actionLogs ?? 0, color: 'text-emerald-400 bg-emerald-400/10' },
                            ].map(({ icon: Icon, label, value, color }) => (
                                <div key={label} className="bg-muted/30 rounded-xl p-3">
                                    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center mb-2`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <p className="text-lg font-black text-foreground">{value}</p>
                                    <p className="text-[10px] text-muted-foreground">{label}</p>
                                </div>
                            ))}
                        </div>

                        {user.userRoles?.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2">ROLES</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {user.userRoles.map((ur: any) => (
                                        <span key={ur.role.slug} className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-lg font-medium">
                                            {ur.role.name} <span className="text-primary/60">• {ur.role.scope}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                            <p>Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                            <p>Provider: {user.provider}</p>
                        </div>
                    </div>
                ) : <p className="text-muted-foreground text-sm">Không tìm thấy người dùng</p>}
            </motion.div>
        </div>
    );
}

export default function AdminUsersPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [assignRoleUser, setAssignRoleUser] = useState<any>(null);
    const [detailUserId, setDetailUserId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', search, statusFilter, page],
        queryFn: () => adminApi.getUsers({ search: search || undefined, status: statusFilter || undefined, page, limit: 15 }),
        select: (res: any) => res?.data ?? res,
    });

    const { data: rolesData } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: () => adminApi.getRoles(),
        select: (res: any) => res?.data ?? [],
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateUserStatus(id, status),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Đã cập nhật trạng thái');
        },
        onError: (err: any) => toast.error(err.message ?? 'Có lỗi xảy ra'),
    });

    const removeRoleMutation = useMutation({
        mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => adminApi.removeRole(userId, roleId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            toast.success('Đã xóa role');
        },
    });

    const users: any[] = data?.data ?? [];
    const totalPages: number = data?.totalPages ?? 1;
    const total: number = data?.total ?? 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Quản lý người dùng</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {total} người dùng trong hệ thống
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Tìm theo tên hoặc email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                </div>
                {(['', 'ACTIVE', 'SUSPENDED', 'BANNED'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setPage(1); }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50'}`}
                    >
                        {s === '' ? 'Tất cả' : STATUS_LABELS[s]}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/20">
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Người dùng</th>
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Email</th>
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trạng thái</th>
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Roles</th>
                            <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Hoạt động</th>
                            <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {isLoading
                            ? Array(8).fill(0).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={6} className="px-5 py-4">
                                        <div className="h-4 bg-muted/50 rounded-lg animate-pulse" />
                                    </td>
                                </tr>
                            ))
                            : users.map((user) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-muted/10 transition-colors group"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                                    {user.fullName?.[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <div onClick={() => setDetailUserId(user.id)} className="cursor-pointer">
                                                <p className="font-semibold text-foreground text-sm hover:text-primary transition-colors">{user.fullName}</p>
                                                <p className="text-[11px] text-muted-foreground">{PROVIDER_LABELS[user.provider] ?? user.provider}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell">{user.email}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${STATUS_COLORS[user.status] ?? 'text-muted-foreground bg-muted border-border'}`}>
                                            {STATUS_LABELS[user.status] ?? user.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 hidden md:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                            {user.userRoles?.map((ur: any) => (
                                                <span
                                                    key={ur.role.slug}
                                                    className="group/role inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] rounded-md cursor-pointer hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                    title="Click để xóa role"
                                                    onClick={() => removeRoleMutation.mutate({ userId: user.id, roleId: ur.role.slug })}
                                                >
                                                    {ur.role.name}
                                                    <Trash2 className="w-2.5 h-2.5 hidden group-hover/role:block" />
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 hidden lg:table-cell">
                                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                                            <p>📽 {user._count?.filmWatchHistory ?? 0} phim</p>
                                            <p>🎵 {user._count?.uploadedTracks ?? 0} tracks</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setDetailUserId(user.id)}
                                                title="Xem chi tiết"
                                                className="p-1.5 text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setAssignRoleUser(user)}
                                                title="Gán role"
                                                className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            >
                                                <Shield className="w-3.5 h-3.5" />
                                            </button>
                                            {user.status !== 'ACTIVE' && (
                                                <button
                                                    onClick={() => statusMutation.mutate({ id: user.id, status: 'ACTIVE' })}
                                                    title="Kích hoạt"
                                                    className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {user.status !== 'SUSPENDED' && (
                                                <button
                                                    onClick={() => statusMutation.mutate({ id: user.id, status: 'SUSPENDED' })}
                                                    title="Tạm khóa"
                                                    className="p-1.5 text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                                                >
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {user.status !== 'BANNED' && (
                                                <button
                                                    onClick={() => statusMutation.mutate({ id: user.id, status: 'BANNED' })}
                                                    title="Ban"
                                                    className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                >
                                                    <Ban className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-5 py-3.5 border-t border-border flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Trang {page}/{totalPages} • {total} người dùng
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Assign Role Modal */}
            <AnimatePresence>
                {assignRoleUser && (
                    <AssignRoleModal
                        user={assignRoleUser}
                        roles={rolesData ?? []}
                        onClose={() => setAssignRoleUser(null)}
                    />
                )}
            </AnimatePresence>

            {/* User Detail Modal */}
            <AnimatePresence>
                {detailUserId && (
                    <UserDetailModal
                        userId={detailUserId}
                        onClose={() => setDetailUserId(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
