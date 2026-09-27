'use client';

import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TooltipProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    disabled?: boolean;
    position?: 'top' | 'right' | 'bottom' | 'left'; // simplified to right for now
}

export function Tooltip({ children, title, subtitle, disabled = false, position = 'right' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + rect.height / 2,
                left: rect.right,
            });
        }
        setIsVisible(true);
    };

    if (disabled) {
        return <>{children}</>;
    }

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVisible(false)}
            ref={containerRef}
        >
            {children}

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, x: 10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 14, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            position: 'fixed',
                            top: coords.top,
                            left: coords.left,
                            y: '-50%',
                            zIndex: 99999
                        }}
                        className="p-3 rounded-md bg-popover text-foreground shadow-xl min-w-max pointer-events-none border border-white/10"
                    >
                        <p className="text-sm font-semibold">{title}</p>
                        {subtitle && <p className="text-xs text-foreground/60 mt-1">{subtitle}</p>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
