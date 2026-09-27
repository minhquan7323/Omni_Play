'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Bell,
    Check,
    Trash2,
    Info,
    BookOpen,
    CheckCircle2,
} from 'lucide-react';
import PopoverContent from '../ui/PopoverContent';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    time: string;
    isRead: boolean;
    type: 'course' | 'system' | 'assignment';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
    {
        id: '1',
        title: 'Khóa học mới!',
        message: 'Khóa học React Server Components vừa được cập nhật.',
        time: '5 phút trước',
        isRead: false,
        type: 'course',
    },
    {
        id: '2',
        title: 'Bài tập đã được chấm',
        message: 'Giảng viên đã chấm bài làm Whiteboard của bạn.',
        time: '1 giờ trước',
        isRead: false,
        type: 'assignment',
    },
    {
        id: '3',
        title: 'Cập nhật hệ thống',
        message: 'Hệ thống LMS sẽ bảo trì nhẹ vào 00:00 đêm nay.',
        time: '1 ngày trước',
        isRead: true,
        type: 'system',
    },
];

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>(
        INITIAL_NOTIFICATIONS,
    );

    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const getIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'course':
                return <BookOpen className="w-4 h-4 text-purple-400" />;
            case 'assignment':
                return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            default:
                return <Info className="w-4 h-4 text-blue-400" />;
        }
    };

    return (
        <PopoverContent
            contentRef={dropdownRef}
            button={
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors focus:outline-none"
                    title="Thông báo"
                >
                    <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />

                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-pulse shadow-sm">
                            {unreadCount}
                        </span>
                    )}
                </button>
            }
            isOpen={isOpen}
            width={'w-80 sm:w-96'}
        >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                        Thông báo
                    </span>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary border border-primary/30">
                            {unreadCount} mới
                        </span>
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent text-xs transition-colors flex items-center gap-1"
                                title="Đánh dấu tất cả là đã đọc"
                            >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={clearAll}
                            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs transition-colors"
                            title="Xóa tất cả"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1 py-1.5 my-1 custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Không có thông báo nào
                    </div>
                ) : (
                    notifications.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => markAsRead(item.id)}
                            className={`group relative flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                                item.isRead
                                    ? 'hover:bg-accent/40 opacity-75'
                                    : 'bg-primary/5 hover:bg-primary/10 border border-primary/10'
                            }`}
                        >
                            <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-card border border-border/40">
                                {getIcon(item.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p
                                        className={`text-xs truncate ${
                                            item.isRead
                                                ? 'font-medium text-foreground/80'
                                                : 'font-bold text-foreground'
                                        }`}
                                    >
                                        {item.title}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                        {item.time}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                    {item.message}
                                </p>
                            </div>

                            {!item.isRead && (
                                <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                            )}
                        </div>
                    ))
                )}
            </div>

            {notifications.length > 0 && (
                <div className="border-t border-border/40 pt-1 text-center">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="w-full py-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                        Xem tất cả thông báo
                    </button>
                </div>
            )}
        </PopoverContent>
    );
}
