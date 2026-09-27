'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export interface NavItem {
    id: string;
    label: React.ReactNode;
    href?: string;
    icon?: React.ReactNode;
    onClick?: () => void;
}

interface SlidingPillNavProps {
    items: NavItem[];
    activeId?: string;
    orientation?: 'horizontal' | 'vertical';
    className?: string;
    itemClassName?: string;
    pillClassName?: string;
    activePillClassName?: string;
    onSelect?: (id: string) => void;
    isCollapsed?: boolean;
    center?: boolean;
    layoutId?: string;
}

export default function SlidingPillNav({
    items,
    activeId,
    orientation = 'horizontal',
    className = '',
    itemClassName = '',
    pillClassName = 'bg-primary text-primary-foreground rounded-lg',
    activePillClassName = 'bg-primary/20 rounded-lg',
    onSelect,
    isCollapsed = false,
    center = false,
    layoutId,
}: SlidingPillNavProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const uniqueId = useId();
    const activeLayoutId = layoutId || `sliding-pill-${uniqueId}`;

    const isVertical = orientation === 'vertical';
    const currentPillId = hoveredId || activeId;

    return (
        <nav
            onMouseLeave={() => setHoveredId(null)}
            className={`relative flex ${isVertical ? 'flex-col gap-1' : 'flex-row items-center gap-1'
                } ${className}`}
        >
            {items.map((item) => {
                const isActive = activeId === item.id;
                const hasPillOverIt = currentPillId === item.id;

                const content = (
                    <>
                        {isActive && (
                            <div
                                className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-300 ease-in-out ${activePillClassName}`}
                            />
                        )}

                        {hasPillOverIt && (
                            <motion.div
                                layoutId={activeLayoutId}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 35,
                                }}
                                className={`absolute inset-0 z-0 pointer-events-none ${pillClassName}`}
                            />
                        )}

                        <div
                            className={`relative z-20 flex items-center w-full transition-colors duration-200 ${center ? 'justify-center' : 'justify-start'
                                } ${hasPillOverIt
                                    ? 'text-primary-foreground font-semibold'
                                    : isActive
                                        ? 'text-foreground font-semibold'
                                        : 'text-muted-foreground font-semibold'
                                }`}
                        >
                            {item.icon && (
                                <div className="w-8 h-8 shrink-0 flex items-center justify-center pl-0.5">
                                    {item.icon}
                                </div>
                            )}

                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: isVertical && isCollapsed ? 0 : 1,
                                    maxWidth: isVertical
                                        ? isCollapsed
                                            ? 0
                                            : 200
                                        : 'none',
                                }}
                                transition={{
                                    duration: 0.3,
                                    ease: 'easeInOut',
                                }}
                                className={`truncate whitespace-nowrap overflow-hidden ${center ? 'text-center' : ''
                                    } ${isVertical
                                        ? isCollapsed
                                            ? 'pointer-events-none pl-2'
                                            : 'pl-2'
                                        : ''
                                    }`}
                            >
                                {item.label}
                            </motion.span>
                        </div>
                    </>
                );

                const commonProps = {
                    onMouseEnter: () => setHoveredId(item.id),
                    onClick: () => {
                        item.onClick?.();
                        onSelect?.(item.id);
                    },
                    className: `group relative flex items-center rounded-md font-medium select-none p-1 ${center ? 'justify-center w-full' : 'justify-start'
                        } ${itemClassName}`,
                };

                if (item.href) {
                    return (
                        <Link key={item.id} href={item.href} {...commonProps}>
                            {content}
                        </Link>
                    );
                }

                return (
                    <button key={item.id} type="button" {...commonProps}>
                        {content}
                    </button>
                );
            })}
        </nav>
    );
}
