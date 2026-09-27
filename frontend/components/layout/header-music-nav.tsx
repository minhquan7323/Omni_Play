'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MUSIC_LEFT_SIDEBAR_CONFIG } from '@/constants/sidebar.constant';

interface MusicHeaderNavProps {
    activeDropdown: string | null;
    toggleDropdown: (name: string) => void;
    closeDropdown: () => void;
}

const FILTER_TABS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'music', label: 'Âm nhạc' },
    { id: 'podcasts', label: 'Podcast & chương trình' },
];

export function MusicHeaderNav({
    activeDropdown,
    toggleDropdown,
    closeDropdown,
}: MusicHeaderNavProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const searchRef = useRef<HTMLDivElement>(null);

    const isSearchPage = pathname?.includes('/music/search');
    const isHomePage = pathname === '/music';

    const searchResults = query.trim().length > 0
        ? [
        ]
        : [];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsSearchOpen(false);
            router.push(`/music/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div
            className="flex items-center flex-1 min-w-0 gap-3"
            style={{ paddingLeft: `${MUSIC_LEFT_SIDEBAR_CONFIG.COLLAPSED_WIDTH}px` }}
        >
            {/* Home button */}
            <Link
                href="/music"
                className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all ${isHomePage
                    ? 'bg-white text-black'
                    : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                title="Trang chủ"
            >
                <Home className="w-5 h-5" />
            </Link>

            {/* Search box */}
            <div ref={searchRef} className="relative flex-1 max-w-[200px] sm:max-w-[240px] lg:max-w-[320px]">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsSearchOpen(true);
                        }}
                        onFocus={() => setIsSearchOpen(true)}
                        placeholder="Tìm kiếm bài hát, nghệ sĩ..."
                        className="w-full h-10 pl-9 pr-8 py-1.5 bg-muted/60 hover:bg-muted focus:bg-muted border border-border rounded-full text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(''); setIsSearchOpen(false); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </form>

                {/* Dropdown results */}
                <AnimatePresence>
                    {isSearchOpen && query.trim().length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute left-0 top-[calc(100%+8px)] w-full min-w-[280px] bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                        >
                            <div className="max-h-[400px] overflow-y-auto p-1.5">
                                {searchResults.length > 0 ? (
                                    <>
                                        {searchResults.map((item) => (
                                            <Link
                                                key={`${item.type}-${item.id}`}
                                                href={item.type === 'album' ? `/music/album/${item.id}` : '#'}
                                                onClick={() => setIsSearchOpen(false)}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors group"
                                            >
                                                <div className={`relative w-10 h-10 flex-shrink-0 overflow-hidden bg-muted ${item.type === 'track' ? 'rounded' : 'rounded-md'}`}>
                                                    {item.img ? (
                                                        <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-secondary flex items-center justify-center">
                                                            <Search className="w-4 h-4 text-muted-foreground/40" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                                                </div>
                                            </Link>
                                        ))}
                                        <Link
                                            href={`/music/search?q=${encodeURIComponent(query)}`}
                                            onClick={() => setIsSearchOpen(false)}
                                            className="block w-full py-2.5 text-center text-xs font-semibold text-muted-foreground hover:text-primary bg-muted/30 hover:bg-muted/50 border-t border-border transition-colors rounded-b-lg mt-1"
                                        >
                                            Tìm kiếm "{query}"
                                        </Link>
                                    </>
                                ) : (
                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                        Không tìm thấy kết quả phù hợp
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Filter tabs - only show on home or search pages */}
            {(isHomePage || isSearchPage) && (
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilter === tab.id
                                ? 'bg-foreground text-background'
                                : 'bg-muted/60 text-foreground hover:bg-muted'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
