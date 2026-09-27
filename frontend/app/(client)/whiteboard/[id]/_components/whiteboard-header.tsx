'use client';

import { Eye, Share2, Shield, UserCheck } from 'lucide-react';
import { BoardRole } from '@/services/whiteboard/whiteboard.constant';
import Dropdown, { DropdownOption } from '@/components/ui/dropdown';
import { useState } from 'react';

interface ActiveUser {
    userId: string;
    fullName?: string;
    role: string;
    socketId: string;
}

interface WhiteboardHeaderProps {
    boardName?: string;
    activeUsers: ActiveUser[];
    myRole: string;
    onOpenShareModal: () => void;
}

export const WhiteboardHeader = ({
    boardName = 'Bảng vẽ chưa có tên',
    activeUsers,
    myRole,
    onOpenShareModal,
}: WhiteboardHeaderProps) => {
    const roleOptions: DropdownOption[] = [
        {
            id: 'admin',
            label: 'Quản trị viên',
        },
        {
            id: 'editor',
            label: 'Biên tập viên',
        },
    ];
    const [selectedRole, setSelectedRole] = useState<string | number>('editor');
    return (
        <div className="h-14 border-b border-border/40 bg-card/80 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0">
            <div className="flex items-center gap-3">
                <h1 className="font-semibold text-sm text-foreground truncate max-w-[250px]">
                    {boardName}
                </h1>
            </div>
            <Dropdown
                options={roleOptions}
                value={selectedRole}
                onChange={(option) => setSelectedRole(option.id)}
                width="w-72"
            />

            <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2 overflow-hidden">
                    {activeUsers.slice(0, 5).map((user, i) => {
                        const displayName = user.fullName || user.userId;
                        const initials = displayName
                            .trim()
                            .substring(0, 2)
                            .toUpperCase();

                        return (
                            <button
                                key={user.socketId || i}
                                onClick={onOpenShareModal}
                                title={`${displayName} (${user.role}) - Bấm để quản lý quyền`}
                                className="relative w-8 h-8 rounded-full border-2 border-background bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center uppercase shadow-sm hover:scale-105 transition-transform cursor-pointer"
                            >
                                {initials}
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-background" />
                            </button>
                        );
                    })}
                    {activeUsers.length > 5 && (
                        <div className="w-8 h-8 rounded-full border-2 border-background bg-muted text-muted-foreground font-semibold text-xs flex items-center justify-center">
                            +{activeUsers.length - 5}
                        </div>
                    )}
                </div>

                <div className="h-4 w-[1px] bg-border/60" />

                <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        myRole === BoardRole.OWNER
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : myRole === BoardRole.EDITOR
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                >
                    {myRole}
                </span>

                <button
                    onClick={onOpenShareModal}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Share2 className="w-3.5 h-3.5" /> Chia sẻ
                </button>
            </div>
        </div>
    );
};
