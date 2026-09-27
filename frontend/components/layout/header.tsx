'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import NotificationDropdown from './NotificationDropdown';
import UserDropdown from './UserDropdown';

import { ModalEnum, openModal } from '@/store/slices/modal.slice';
import { HEADER_HEIGHT } from '../../constants/layout.constant';
import { FilmHeaderNav } from './header-film-nav';
import { MAIN_SIDEBAR_CONFIG } from '@/constants/sidebar.constant';
import { MusicHeaderNav } from './header-music-nav';

export default function Header() {
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const toggleDropdown = (name: string) => {
        setActiveDropdown((prev) => (prev === name ? null : name));
    };

    const headerNavRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch();

    const sidebar = useSelector((state: any) => state.sidebar);
    const auth = useSelector((state: any) => state.auth);
    const sidebarWidth = sidebar.main.isPinned ? sidebar.main.width : MAIN_SIDEBAR_CONFIG.COLLAPSED_WIDTH;

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                headerNavRef.current &&
                !headerNavRef.current.contains(e.target as Node)
            ) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setIsScrolled(window.scrollY > 20);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleOpenAuth = (mode: ModalEnum) => {
        dispatch(
            openModal({
                type: ModalEnum.AUTH,
                props: { initialMode: mode },
            }),
        );
    };

    const renderModuleNav = () => {
        switch (true) {
            case pathname.startsWith('/film'):
                return (
                    <FilmHeaderNav
                        activeDropdown={activeDropdown}
                        toggleDropdown={toggleDropdown}
                        closeDropdown={() => setActiveDropdown(null)}
                    />
                );
            case pathname.startsWith('/whiteboard'):
                return (
                    <div className="text-xs font-semibold text-white/70">
                        Bảng vẽ trực tuyến
                    </div>
                );
            case pathname.startsWith('/music'):
                return (
                    <MusicHeaderNav
                        activeDropdown={activeDropdown}
                        toggleDropdown={toggleDropdown}
                        closeDropdown={() => setActiveDropdown(null)}
                    />
                );
            default:
                return <div className="flex-1" />;
        }
    };

    return (
        <motion.div
            initial={{ left: sidebarWidth }}
            animate={{ left: sidebarWidth }}
            transition={{
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
            }}
            className={`fixed top-0 right-0 z-50 flex justify-center pointer-events-none ${isScrolled ? 'px-2 transition-all' : ''}`}
        >
            <header
                ref={headerNavRef}
                style={{ height: `${HEADER_HEIGHT}px` }}
                className={`pointer-events-auto relative flex items-center justify-between px-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isScrolled
                    ? 'w-full max-w-5xl mt-3 bg-card/80 backdrop-blur-xs rounded-2xl text-card-foreground shadow-lg'
                    : 'w-full max-w-full mt-0 bg-transparent rounded-none text-foreground'
                    }`}
            >
                {renderModuleNav()}

                <div className="flex items-center gap-3 shrink-0 ml-4">
                    {auth?.isAuthenticated ? (
                        <>
                            {/* <NotificationDropdown /> */}
                            <UserDropdown />
                        </>
                    ) : (
                        <button
                            onClick={() => handleOpenAuth(ModalEnum.AUTH)}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            Đăng nhập
                        </button>
                    )}
                </div>
            </header>
        </motion.div>
    );
}
