'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Trash2, Key, Users, Check, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import adminApi from '@/services/api/admin.api';

const SCOPE_COLORS: Record<string, string> = {
    GLOBAL: 'bg-indigo-500/10 text-indigo-400',
    FILM: 'bg-rose-500/10 text-rose-400',
    MUSIC: 'bg-violet-500/10 text-violet-400',
    WHITEBOARD: 'bg-emerald-500/10 text-emerald-400',
};

function CreateRoleModal({ onClose }: { onClose: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState({ slug: '', name: '', description: '', scope: 'GLOBAL' });

    const createMutation = useMutation({
        mutationFn: () => adminApi.createRole(form),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-roles'] });
            toast.success('Tạo role thành công');
            onClose();
        },
        onError: (err: any) => toast.error(err.message ?? 'Lỗi tạo role'),
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
                <h3 className="font-bold text-foreground mb-4">Tạo Role mới</h3>
                <div className="space-y-3">
                    {(['slug', 'name', 'description'] as const).map((field) => (
                        <div key={field}>
                            <label className="text-xs text-muted-foreground mb-1 block capitalize">{field}</label>
                            <input
                                value={form[field]}
                                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                                placeholder={field === 'slug' ? 'vd: film_moderator' : field === 'name' ? 'vd: Film Moderator' : 'Mô tả...'}
                                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    ))}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Scope</label>
                        <select
                            value={form.scope}
                            onChange={(e) => setForm({ ...form, scope: e.target.value })}
                            className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none"
                        >
                            {['GLOBAL', 'FILM', 'MUSIC', 'WHITEBOARD'].map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-2 mt-5">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors">Hủy</button>
                    <button
                        onClick={() => createMutation.mutate()}
                        disabled={!form.slug || !form.name || createMutation.isPending}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {createMutation.isPending ? 'Đang tạo...' : 'Tạo Role'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function EditRoleModal({ role, onClose }: { role: any; onClose: () => void }) {
    const qc = useQueryClient();
    const [form, setForm] = useState({ name: role.name ?? '', description: role.description ?? '' });

    const mutation = useMutation({
        mutationFn: () => adminApi.updateRole(role.id, form),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-roles'] }); toast.success('Cập nhật role thành công'); onClose(); },
        onError: (e: any) => toast.error(e.message ?? 'Lỗi cập nhật'),
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-foreground mb-1">Chỉnh sửa Role</h3>
                <p className="text-xs text-muted-foreground font-mono mb-4">{role.slug}</p>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Tên</label>
                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Mô tả</label>
                        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                </div>
                <div className="flex gap-2 mt-5">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50">Hủy</button>
                    <button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
                        {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function AdminRolesPage() {
    const qc = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [expandedRole, setExpandedRole] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<any>(null);

    const { data: roles = [], isLoading: rolesLoading } = useQuery({
        queryKey: ['admin-roles'],
        queryFn: () => adminApi.getRoles(),
        select: (res: any) => res?.data ?? [],
    });

    const { data: permissions = [] } = useQuery({
        queryKey: ['admin-permissions'],
        queryFn: () => adminApi.getPermissions(),
        select: (res: any) => res?.data ?? [],
    });

    const deleteMutation = useMutation({
        mutationFn: (roleId: string) => adminApi.deleteRole(roleId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-roles'] }); toast.success('Đã xóa role'); },
        onError: (err: any) => toast.error(err.message ?? 'Không thể xóa role hệ thống'),
    });

    const assignPermMutation = useMutation({
        mutationFn: ({ roleId, permId }: { roleId: string; permId: string }) => adminApi.assignPermission(roleId, permId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-roles'] }); toast.success('Đã gán permission'); },
    });

    const removePermMutation = useMutation({
        mutationFn: ({ roleId, permId }: { roleId: string; permId: string }) => adminApi.removePermission(roleId, permId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-roles'] }); toast.success('Đã xóa permission'); },
    });

    const permsByScope = (permissions as any[]).reduce((acc: Record<string, any[]>, p) => {
        (acc[p.scope] ??= []).push(p);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Roles & Quyền</h1>
                    <p className="text-muted-foreground text-sm mt-1">Quản lý phân quyền hệ thống</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Tạo Role
                </button>
            </div>

            {/* Roles Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rolesLoading
                    ? Array(5).fill(0).map((_, i) => <div key={i} className="bg-card border border-border rounded-2xl h-36 animate-pulse" />)
                    : (roles as any[]).map((role) => {
                        const isExpanded = expandedRole === role.id;
                        const rolePermIds = new Set(role.permissions?.map((rp: any) => rp.permission?.id));

                        return (
                            <motion.div
                                key={role.id}
                                layout
                                className="bg-card border border-border rounded-2xl overflow-hidden"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <Shield className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm">{role.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{role.slug}</p>
                                            </div>
                                        </div>
                                        {!role.isSystem && (
                                            <button
                                                onClick={() => deleteMutation.mutate(role.id)}
                                                className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setEditRole(role)}
                                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SCOPE_COLORS[role.scope] ?? 'bg-muted text-muted-foreground'}`}>
                                            {role.scope}
                                        </span>
                                        {role.isSystem && (
                                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">System</span>
                                        )}
                                        <span className="text-[11px] text-muted-foreground">
                                            <Users className="w-3 h-3 inline mr-0.5" />
                                            {role._count?.users ?? 0} users
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            <Key className="w-3 h-3 inline mr-0.5" />
                                            {role.permissions?.length ?? 0} quyền
                                        </span>
                                    </div>
                                </div>

                                {/* Permission Matrix */}
                                <div className="border-t border-border">
                                    <button
                                        onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                                        className="w-full px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors flex items-center justify-between"
                                    >
                                        <span>Quản lý quyền</span>
                                        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} className="text-muted-foreground">▾</motion.span>
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-4 space-y-3">
                                                    {Object.entries(permsByScope).map(([scope, perms]) => (
                                                        <div key={scope}>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">{scope}</p>
                                                            <div className="grid grid-cols-2 gap-1">
                                                                {(perms as any[]).map((perm) => {
                                                                    const has = rolePermIds.has(perm.id);
                                                                    return (
                                                                        <button
                                                                            key={perm.id}
                                                                            onClick={() => has
                                                                                ? removePermMutation.mutate({ roleId: role.id, permId: perm.id })
                                                                                : assignPermMutation.mutate({ roleId: role.id, permId: perm.id })
                                                                            }
                                                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${has ? 'bg-primary/10 text-primary' : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'}`}
                                                                        >
                                                                            {has ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0 opacity-40" />}
                                                                            <span className="truncate">{perm.name}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && <CreateRoleModal onClose={() => setShowCreate(false)} />}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editRole && <EditRoleModal role={editRole} onClose={() => setEditRole(null)} />}
            </AnimatePresence>
        </div>
    );
}
