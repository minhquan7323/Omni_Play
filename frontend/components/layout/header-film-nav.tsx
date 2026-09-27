'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Loader2, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

import NavDropdown from './NavDropdown';
import { useDebounce } from '@/hooks/useDebounce';
import { FilmService } from '@/services/film/film.service';
import { APP_ROUTES } from '@/constants/routes.constant';
import { filmKeys } from '@/app/(client)/film/_constants/film.keys';

interface FilmHeaderNavProps {
    activeDropdown: string | null;
    toggleDropdown: (name: string) => void;
    closeDropdown: () => void;
}

export function FilmHeaderNav({
    activeDropdown,
    toggleDropdown,
    closeDropdown,
}: FilmHeaderNavProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounced = useDebounce(query);

    const { data: searchResults, isLoading: searchLoading } = useQuery({
        queryKey: filmKeys.search(debounced),
        queryFn: () => FilmService.search({ keyword: debounced, limit: 5, page: 1 }),
        enabled: debounced.trim().length > 0,
        select: (res) => res?.data?.data?.items,
    });

    const { data: categories } = useQuery({
        queryKey: filmKeys.categories(),
        queryFn: FilmService.getCategories,
        select: (res) => res?.data?.data?.items ?? [],
    });

    const { data: countries } = useQuery({
        queryKey: filmKeys.countries(),
        queryFn: FilmService.getCountries,
        select: (res) => res?.data?.data?.items ?? [],
    });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node))
                setIsSearchOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsSearchOpen(false);
            router.push(`${APP_ROUTES.FILM.SEARCH}?keyword=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="flex items-center justify-between flex-1 min-w-0 gap-3">
            <div
                ref={searchRef}
                className="relative flex-1 max-w-[200px] sm:max-w-[240px] lg:max-w-[280px]"
            >
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
                        placeholder="Tìm kiếm..."
                        className="w-full pl-9 pr-8 py-1.5 bg-muted/60 hover:bg-muted focus:bg-muted border border-border rounded-lg text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                setIsSearchOpen(false);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </form>

                <AnimatePresence>
                    {isSearchOpen && debounced.trim().length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="absolute left-0 top-[calc(100%+8px)] w-[200px] sm:w-[240px] lg:w-[280px] bg-card border border-border rounded-md shadow-2xl overflow-hidden z-50"
                        >
                            <div className="max-h-[380px] p-1.5">
                                {searchLoading ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2 w-full">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        <span className="text-xs">
                                            Đang tìm kiếm...
                                        </span>
                                    </div>
                                ) : searchResults &&
                                    searchResults.length > 0 ? (
                                    searchResults.map((film: any) => (
                                        <Link
                                            key={film.slug}
                                            href={`/film/${film.slug}`}
                                            onClick={() =>
                                                setIsSearchOpen(false)
                                            }
                                            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/60 transition-colors group"
                                        >
                                            <div className="relative w-14 h-18 rounded-md overflow-hidden shrink-0 bg-muted border border-border">
                                                {film.poster_url ? (
                                                    <Image
                                                        src={film.poster_url}
                                                        alt={film.name}
                                                        fill
                                                        sizes="48px"
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e: any) => {
                                                            e.currentTarget.srcset =
                                                                '';
                                                            e.currentTarget.src =
                                                                '/placeholder-film.jpg';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Film className="w-4 h-4 text-muted-foreground/40" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-0.5">
                                                <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                    {film.name}
                                                </h4>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {film.origin_name}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                                    <span>{film.year}</span>
                                                    {film.episode_current && (
                                                        <>
                                                            <span>•</span>
                                                            <span>
                                                                {
                                                                    film.episode_current
                                                                }
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-xs text-muted-foreground w-full">
                                        Không tìm thấy phim phù hợp
                                    </div>
                                )}
                            </div>

                            {searchResults &&
                                searchResults.length > 0 &&
                                !searchLoading && (
                                    <Link
                                        href={`/film/search?q=${encodeURIComponent(debounced)}`}
                                        onClick={() => setIsSearchOpen(false)}
                                        className="block w-full py-2.5 text-center text-xs font-semibold text-muted-foreground hover:text-primary bg-muted/30 hover:bg-muted/50 border-t border-border transition-colors"
                                    >
                                        Toàn bộ kết quả
                                    </Link>
                                )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="hidden md:flex items-center gap-1 shrink-0 mx-auto">
                <NavDropdown
                    title="Quốc gia"
                    isOpen={activeDropdown === 'film-country'}
                    onToggle={() => toggleDropdown('film-country')}
                    items={countries}
                    hrefPrefix={APP_ROUTES.FILM.SEARCH + '?country='}
                />

                <NavDropdown
                    title="Thể loại"
                    isOpen={activeDropdown === 'film-genre'}
                    onToggle={() => toggleDropdown('film-genre')}
                    items={categories}
                    hrefPrefix={APP_ROUTES.FILM.SEARCH + '?category='}
                />

                <Link
                    href={APP_ROUTES.FILM.FAVORITES}
                    onClick={closeDropdown}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap hover:text-primary hover:bg-primary/20"
                >
                    Yêu thích
                </Link>
            </div>
        </div>
    );
}
