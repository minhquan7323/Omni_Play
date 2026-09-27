'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    User,
    Settings,
    Moon,
    Sun,
    Globe,
    LogOut,
    ChevronDown,
    Sparkles,
} from 'lucide-react';
import PopoverContent from '../ui/PopoverContent';
import { AuthService } from '@/services/auth/auth.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/slices/auth.slice';

export default function UserDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [lang, setLang] = useState<'VI' | 'EN'>('VI');
    const auth = useSelector((state: any) => state.auth);

    const dispatch = useDispatch();
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const toggleTheme = () =>
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    const toggleLang = () => setLang((prev) => (prev === 'VI' ? 'EN' : 'VI'));

    const queryClient = useQueryClient();

    const logoutMutation = useMutation({
        mutationFn: () => AuthService.logout(),
        onSuccess: () => {
            queryClient.clear();
            dispatch(logout());
        },
        onError: () => { },
    });

    return (
        <PopoverContent
            contentRef={dropdownRef}
            button={
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="group flex items-center gap-1.5 p-1 rounded-full hover:bg-accent/50 transition-colors focus:outline-none"
                >
                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[2px] shadow-sm group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full bg-card flex items-center justify-center font-bold text-xs text-foreground overflow-hidden">
                            <span>{auth?.user?.fullName.charAt(0).toUpperCase() + auth?.user?.fullName.charAt(1).toUpperCase()}</span>
                        </div>
                    </div>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                            }`}
                    />
                </button>
            }
            isOpen={isOpen}
            width="w-64"
        >
            <div className="px-3 py-2.5 mb-1 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-foreground truncate">
                        {auth?.user?.fullName}
                    </p>
                    {/* <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                        <Sparkles className="w-2.5 h-2.5" /> PRO
                    </span> */}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {auth?.user?.email}
                </p>
            </div>

            <div className="space-y-0.5">
                {/* <button
                    type="button"
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        {theme === 'dark' ? (
                            <Moon className="w-4 h-4 text-purple-400" />
                        ) : (
                            <Sun className="w-4 h-4 text-amber-500" />
                        )}
                        <span>Giao diện</span>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground/80 uppercase bg-muted/50 px-2 py-0.5 rounded-md">
                        {theme}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={toggleLang}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span>Ngôn ngữ</span>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded-md">
                        {lang === 'VI' ? 'Tiếng Việt' : 'English'}
                    </span>
                </button> */}

                <div className="my-1 border-t border-border/40" />

                {/* <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors"
                >
                    <User className="w-4 h-4" />
                    <span>Trang cá nhân</span>
                </Link> */}

                <Link
                    href="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    <span>Cài đặt tài khoản</span>
                </Link>

                <div className="my-1 border-t border-border/40" />

                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(false);
                        logoutMutation.mutate();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </PopoverContent>
    );
}
