'use client';

import { MAIN_SIDEBAR_CONFIG, SidebarId } from '@/constants/sidebar.constant';
import { useResizable } from '@/hooks/useResizable';
import { setWidth, togglePinned } from '@/store/slices/sidebar.slice';
import { LayoutGroup, motion } from 'framer-motion';
import {
    Film,
    Gamepad,
    LayoutDashboard,
    Music,
    Pin,
    PinOff,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SlidingPillNav, { NavItem } from '../ui/SlidingPillNav';

const NAV_ITEMS: NavItem[] = [
    {
        id: 'whiteboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        label: 'Whiteboard',
        href: '/whiteboard',
    },
    {
        id: 'liars-bar',
        icon: <Gamepad className="w-5 h-5" />,
        label: "Liar's Bar",
        href: '/liars-bar',
    },
    {
        id: 'film',
        icon: <Film className="w-5 h-5" />,
        label: 'Film',
        href: '/film',
    },
    {
        id: 'music',
        icon: <Music className="w-5 h-5" />,
        label: 'Music',
        href: '/music',
    },
];

const HOVER_DELAY_MS = 300;

export default function Sidebar() {
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();

    const sidebar = useSelector(
        (state: any) => state.sidebar?.[SidebarId.MAIN],
    );

    const [isHovered, setIsHovered] = useState(false);
    const hoverTimerRef = useRef(null);

    const { isResizing, startResizing } = useResizable({
        direction: 'right',
        min: MAIN_SIDEBAR_CONFIG.MIN_WIDTH,
        max: MAIN_SIDEBAR_CONFIG.MAX_WIDTH,
        currentSize: sidebar.width,
        onResize: (newWidth) =>
            dispatch(setWidth({ id: SidebarId.MAIN, width: newWidth })),
    });

    const isExpanded = sidebar.isPinned || isHovered || isResizing;
    const currentWidth = isExpanded
        ? sidebar.width
        : MAIN_SIDEBAR_CONFIG.COLLAPSED_WIDTH;

    const handleMouseEnter = useCallback(() => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(
            () => setIsHovered(true),
            HOVER_DELAY_MS,
        );
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        setIsHovered(false);
    }, []);

    useEffect(() => {
        return () => {
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        };
    }, []);

    const activeTab = useMemo(() => {
        if (pathname.startsWith('/whiteboard')) return 'whiteboard';
        if (pathname.startsWith('/film')) return 'film';
        if (pathname.startsWith('/music')) return 'music';
        return null;
    }, [pathname]);

    const handleSelectTab = useCallback(
        (id: string) => {
            const targetNav = NAV_ITEMS.find((item) => item.id === id);
            if (targetNav?.href) router.push(targetNav.href);
        },
        [router],
    );

    const handleTogglePin = useCallback(() => {
        dispatch(togglePinned({ id: SidebarId.MAIN }));
    }, [dispatch]);

    return (
        <LayoutGroup>
            <motion.aside
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                initial={false}
                animate={{ width: currentWidth }}
                transition={
                    isResizing
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 300, damping: 30 }
                }
                className="fixed top-0 left-0 z-50 h-screen bg-card flex flex-col justify-between overflow-hidden"
            >
                <div>
                    <div className="flex h-10 items-center justify-between pl-2 pt-1 px-1 overflow-hidden">
                        <span className="font-bold text-sm truncate text-foreground shrink-0">
                            LMS
                        </span>

                        <motion.button
                            onClick={handleTogglePin}
                            animate={{
                                opacity: isExpanded ? 1 : 0,
                                scale: isExpanded ? 1 : 0.8,
                            }}
                            transition={{ duration: 0.2 }}
                            className={`p-2 rounded-sm hover:bg-primary text-muted-foreground hover:text-primary-foreground shrink-0 ${
                                !isExpanded ? 'pointer-events-none' : ''
                            }`}
                            title={
                                sidebar.isPinned
                                    ? 'Unpin sidebar'
                                    : 'Pin sidebar'
                            }
                        >
                            {sidebar.isPinned ? (
                                <PinOff className="w-4 h-4" />
                            ) : (
                                <Pin className="w-4 h-4 rotate-45" />
                            )}
                        </motion.button>
                    </div>

                    <div className="p-1">
                        <SlidingPillNav
                            layoutId="sidebar-sliding-pill"
                            items={NAV_ITEMS}
                            activeId={activeTab}
                            onSelect={handleSelectTab}
                            orientation="vertical"
                            isCollapsed={!isExpanded}
                            pillClassName="bg-primary text-primary-foreground rounded-sm"
                            activePillClassName="bg-primary/20 rounded-sm"
                        />
                    </div>
                </div>

                <div
                    onMouseDown={startResizing}
                    onTouchStart={startResizing}
                    className="absolute cursor-w-resize top-0 right-0 h-full w-1.5 z-10 hover:bg-primary/30 transition-colors"
                />
            </motion.aside>
        </LayoutGroup>
    );
}
