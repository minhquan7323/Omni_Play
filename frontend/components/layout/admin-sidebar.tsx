'use client';

import { LayoutDashboard, Users, Shield, Music, Film, Activity, Layout, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/utils';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useSelector } from 'react-redux';

interface NavItem {
    icon: React.ElementType;
    label: string;
    href: string;
    visible: boolean;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const { canAccess, isSuperAdmin, roles } = useAdminPermissions();
    const user = useSelector((state: any) => state.auth.user);

    const NAV_GROUPS: NavGroup[] = [
        {
            label: 'Tổng quan',
            items: [
                {
                    icon: LayoutDashboard,
                    label: 'Dashboard',
                    href: '/admin/dashboard',
                    visible: canAccess.dashboard || canAccess.stats,
                },
            ],
        },
        {
            label: 'Quản lý người dùng',
            items: [
                {
                    icon: Users,
                    label: 'Người dùng',
                    href: '/admin/users',
                    visible: canAccess.usersView,
                },
                {
                    icon: Shield,
                    label: 'Roles & Quyền',
                    href: '/admin/roles',
                    visible: canAccess.rolesView,
                },
            ],
        },
        {
            label: 'Nội dung',
            items: [
                {
                    icon: Music,
                    label: 'Music CMS',
                    href: '/admin/music',
                    visible: canAccess.musicView,
                },
                {
                    icon: Film,
                    label: 'Film & Phim',
                    href: '/admin/film',
                    visible: canAccess.filmView,
                },
                {
                    icon: Layout,
                    label: 'Whiteboard',
                    href: '/admin/whiteboard',
                    visible: canAccess.whiteboardView,
                },
            ],
        },
        {
            label: 'Phân tích',
            items: [
                {
                    icon: Activity,
                    label: 'Tracking Logs',
                    href: '/admin/tracking',
                    visible: canAccess.trackingView,
                },
            ],
        },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-[240px] bg-card border-r border-border flex flex-col z-50">
            {/* Logo */}
            <div className="px-5 py-4 border-b border-border">
                <Link href="/admin/dashboard" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground leading-tight">LMS Admin</p>
                        <p className="text-[10px] text-muted-foreground">Management Panel</p>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {NAV_GROUPS.map((group) => {
                    const visibleItems = group.items.filter((item) => item.visible);
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={group.label}>
                            <p className="px-2 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                {group.label}
                            </p>
                            <ul className="space-y-0.5">
                                {visibleItems.map((item) => {
                                    const isActive =
                                        pathname === item.href ||
                                        (item.href !== '/admin' && pathname.startsWith(item.href));
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                                                )}
                                            >
                                                <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                                                <span className="flex-1">{item.label}</span>
                                                {isActive && <ChevronRight className="w-3 h-3 opacity-70" />}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </nav>

            {/* User info + role badges */}
            <div className="px-4 py-3 border-t border-border space-y-2">
                {user && (
                    <div className="flex items-center gap-2.5 px-1">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                {user.fullName?.[0]?.toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{user.fullName}</p>
                            <div className="flex gap-1 flex-wrap mt-0.5">
                                {roles.slice(0, 2).map((r: string) => (
                                    <span key={r} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-semibold">{r}</span>
                                ))}
                                {roles.length > 2 && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-muted/60 text-muted-foreground rounded">+{roles.length - 2}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    <span>Về trang chủ</span>
                </Link>
            </div>
        </aside>
    );
}
