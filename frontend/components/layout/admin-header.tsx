'use client';

import { Bell, Search, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

const BREADCRUMB_MAP: Record<string, string[]> = {
    '/admin/dashboard': ['Admin', 'Dashboard'],
    '/admin/users': ['Admin', 'Người dùng'],
    '/admin/roles': ['Admin', 'Roles & Quyền'],
    '/admin/music': ['Admin', 'Music CMS'],
    '/admin/film': ['Admin', 'Film Analytics'],
    '/admin/tracking': ['Admin', 'Tracking Logs'],
    '/admin/whiteboard': ['Admin', 'Whiteboard'],
};

export default function AdminHeader() {
    const pathname = usePathname();
    const auth = useSelector((state: any) => state.auth);
    const user = auth?.user;

    const breadcrumbs = useMemo(() => {
        return BREADCRUMB_MAP[pathname] ?? ['Admin'];
    }, [pathname]);

    return (
        <header className="fixed top-0 left-[240px] right-0 h-14 bg-card/80 backdrop-blur-md border-b border-border z-40 flex items-center justify-between px-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, idx) => (
                    <span key={idx} className="flex items-center gap-2">
                        {idx > 0 && <span className="text-muted-foreground/40">/</span>}
                        <span
                            className={
                                idx === breadcrumbs.length - 1
                                    ? 'text-foreground font-semibold'
                                    : 'text-muted-foreground'
                            }
                        >
                            {crumb}
                        </span>
                    </span>
                ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-xl px-3 py-1.5 text-sm text-muted-foreground">
                    <Search className="w-3.5 h-3.5" />
                    <span className="text-xs">Tìm kiếm...</span>
                </div>
                <button className="p-2 rounded-xl hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground">
                    <Bell className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                    )}
                    <div className="hidden sm:block">
                        <p className="text-xs font-semibold text-foreground leading-tight">{user?.fullName ?? 'Admin'}</p>
                        <p className="text-[10px] text-muted-foreground">Administrator</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
