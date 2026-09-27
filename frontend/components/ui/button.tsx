'use client';

import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/utils';

interface ComicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'purple' | 'pink' | 'yellow';
    isFullWidth?: boolean;
    className?: string;
}

export function ComicButton({
    children,
    variant = 'purple',
    isFullWidth = false,
    className,
    ...props
}: ComicButtonProps) {
    return (
        <button
            className={cn(
                // 1. Base style (Đã sửa border-3 -> border-[3px])
                'p-4 rounded-2xl border-[3px] border-slate-900 font-bold shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none',

                // 2. Logic Variant
                variant === 'purple' && 'bg-purple-500 text-white',
                variant === 'pink' && 'bg-pink-500 text-white',
                variant === 'yellow' && 'bg-yellow-400 text-slate-900',

                // 3. Conditional class
                isFullWidth ? 'w-full' : 'w-fit',

                // 4. Override
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
