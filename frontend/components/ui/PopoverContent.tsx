'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PopoverContentProps {
    contentRef: React.RefObject<HTMLDivElement | null>;
    button: ReactNode;
    isOpen: boolean;
    children: ReactNode;
    width: string;
}

export default function PopoverContent({
    contentRef,
    button,
    isOpen,
    children,
    width,
}: PopoverContentProps) {
    return (
        <div ref={contentRef} className="relative inline-block text-left">
            {button}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0, y: -16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0, y: -16 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                            mass: 0.8,
                        }}
                        style={{
                            transformOrigin: 'calc(100% - 1rem) 0px',
                        }}
                        className={`absolute right-0 mt-2 rounded-2xl bg-card/95 backdrop-blur-md border border-border/60 shadow-2xl p-1.5 z-50 ${width}`}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
