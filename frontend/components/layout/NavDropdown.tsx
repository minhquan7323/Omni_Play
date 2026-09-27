'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export interface NavDropdownItem {
    _id?: string;
    slug: string;
    name: string;
}

interface NavDropdownProps {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    items?: NavDropdownItem[];
    hrefPrefix: string;
    allHref?: string;
    allLabel?: string;
    columns?: 2 | 3 | 4;
}

export default function NavDropdown({
    title,
    isOpen,
    onToggle,
    items = [],
    hrefPrefix,
    allHref,
    allLabel = 'Tất cả',
    columns = 3,
}: NavDropdownProps) {
    const gridColsClass =
        columns === 2
            ? 'grid-cols-2'
            : columns === 4
              ? 'grid-cols-4'
              : 'grid-cols-3';
    const spanClass =
        columns === 2
            ? 'col-span-2'
            : columns === 4
              ? 'col-span-4'
              : 'col-span-3';

    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                className={`group relative flex items-center gap-1 rounded-xl select-none p-1 px-2 transition-colors ${
                    isOpen
                        ? 'text-primary-foreground bg-primary'
                        : 'hover:text-primary hover:bg-primary/20'
                }`}
            >
                <span className="relative z-10 flex items-center gap-1 text-xs font-semibold">
                    {title}
                    <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center"
                    >
                        <ChevronDown className="w-3 h-3" />
                    </motion.span>
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -6 }}
                        transition={{
                            type: 'spring',
                            damping: 26,
                            stiffness: 360,
                            mass: 0.6,
                        }}
                        style={{ transformOrigin: 'center top' }}
                        className="absolute left-1/2 -translate-x-1/2 mt-2 w-max min-w-[280px] rounded-xl bg-card border border-border shadow-2xl p-2 z-50 select-none"
                    >
                        <div
                            className={`grid ${gridColsClass} gap-x-4 gap-y-0.5`}
                        >
                            {allHref && (
                                <Link
                                    href={allHref}
                                    onClick={onToggle}
                                    className={`px-3 py-1.5 text-left text-xs font-bold text-primary hover:bg-primary/10 rounded-md transition-colors ${spanClass}`}
                                >
                                    {allLabel}
                                </Link>
                            )}
                            {items.map((item) => {
                                const isQueryParam = hrefPrefix.includes('?');
                                const targetHref = isQueryParam
                                    ? `${hrefPrefix}${item.slug}`
                                    : `${hrefPrefix}/${item.slug}`;

                                return (
                                    <Link
                                        key={item._id ?? item.slug}
                                        href={targetHref}
                                        onClick={onToggle}
                                        className="px-3 py-1.5 text-left text-xs rounded-lg transition-colors whitespace-nowrap hover:text-primary hover:bg-primary/20"
                                    >
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
