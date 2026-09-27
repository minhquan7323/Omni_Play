'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, UserPlus, Trash2, Ban, X } from 'lucide-react';
import { Whiteboard } from '@/services';
import { BoardRole } from '@/services/whiteboard/whiteboard.constant';

interface BoardShareModalProps {
    boardId: string;
    currentUserRole: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function BoardShareModal({
    boardId,
    currentUserRole,
    isOpen,
    onClose,
}: BoardShareModalProps) {
    const queryClient = useQueryClient();
    const [newUserId, setNewUserId] = useState('');
    const [newRole, setNewRole] = useState<BoardRole>(BoardRole.VIEWER);

    const isOwner = currentUserRole === BoardRole.OWNER;

    const { data: boardInfo } = useQuery({
        queryKey: ['board-permission', boardId],
        queryFn: async () => await Whiteboard.findOneById(boardId),
        enabled: isOpen,
    });

    const addMemberMutation = useMutation({
        mutationFn: async () =>
            await Whiteboard.addMember(boardId, {
                userId: newUserId,
                role: newRole,
            }),
        onSuccess: () => {
            setNewUserId('');
            queryClient.invalidateQueries({
                queryKey: ['board-permission', boardId],
            });
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({
            targetUserId,
            role,
        }: {
            targetUserId: string;
            role: BoardRole;
        }) => await Whiteboard.updateMemberRole(boardId, targetUserId, role),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: ['board-permission', boardId],
            }),
    });

    const banMemberMutation = useMutation({
        mutationFn: async (targetUserId: string) =>
            await Whiteboard.banUser(boardId, targetUserId),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: ['board-permission', boardId],
            }),
    });

    const removeMemberMutation = useMutation({
        mutationFn: async (targetUserId: string) =>
            await Whiteboard.removeMember(boardId, targetUserId),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: ['board-permission', boardId],
            }),
    });

    const handleAddMember = () => {
        if (!newUserId.trim()) return;
        addMemberMutation.mutate();
    };

    const handleUpdateRole = (targetUserId: string, role: BoardRole) => {
        updateRoleMutation.mutate({ targetUserId, role });
    };

    const banMember = (targetUserId: string) => {
        banMemberMutation.mutate(targetUserId);
    };

    const removeMember = (targetUserId: string) => {
        removeMemberMutation.mutate(targetUserId);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold">
                            Quản lý Quyền Truy Cập
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-muted"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isOwner && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Nhập ID người dùng..."
                            value={newUserId}
                            onChange={(e) => setNewUserId(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <select
                            value={newRole}
                            onChange={(e) =>
                                setNewRole(e.target.value as BoardRole)
                            }
                            className="px-3 py-2 text-sm rounded-xl border border-border bg-muted/40"
                        >
                            <option value={BoardRole.EDITOR}>Editor</option>
                            <option value={BoardRole.VIEWER}>Viewer</option>
                        </select>
                        <button
                            onClick={handleAddMember}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90"
                        >
                            <UserPlus className="w-4 h-4" /> Thêm
                        </button>
                    </div>
                )}

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Danh sách thành viên (
                        {boardInfo?.data.members?.length || 0})
                    </p>
                    {boardInfo?.data.members?.map((member: any) => (
                        <div
                            key={member.userId}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/20"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                                    {member.userId
                                        .substring(0, 2)
                                        .toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-medium truncate max-w-[140px]">
                                        {member.userId}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground">
                                        {member.role}
                                    </span>
                                </div>
                            </div>

                            {isOwner && member.role !== BoardRole.OWNER && (
                                <div className="flex items-center gap-1.5">
                                    <select
                                        value={member.role}
                                        onChange={(e) =>
                                            handleUpdateRole(
                                                member.userId,
                                                e.target.value as BoardRole,
                                            )
                                        }
                                        className="text-xs py-1 px-2 rounded-lg border border-border bg-card"
                                    >
                                        <option value={BoardRole.EDITOR}>
                                            Editor
                                        </option>
                                        <option value={BoardRole.VIEWER}>
                                            Viewer
                                        </option>
                                    </select>

                                    <button
                                        title="Ban User khỏi phòng"
                                        onClick={() => banMember(member.userId)}
                                        className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg"
                                    >
                                        <Ban className="w-4 h-4" />
                                    </button>

                                    <button
                                        title="Xóa thành viên"
                                        onClick={() => removeMember(member.userId)}
                                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
