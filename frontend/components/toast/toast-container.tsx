'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { ToastItem, ToastPosition } from '@/store/slices/toast.slice';
import ToastCard from './toast-card';

const POSITIONS: Record<ToastPosition, string> = {
    'top-right': 'top-5 right-5 items-end',
    'top-left': 'top-5 left-5 items-start',
    'bottom-right': 'bottom-5 right-5 items-end',
    'bottom-left': 'bottom-5 left-5 items-start',
    'top-center': 'top-5 left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-5 left-1/2 -translate-x-1/2 items-center',
};

export default function ToastContainer() {
    const { toasts = [], position = 'top-right' } = useSelector(
        (state: any) => state.toast || {},
    );

    if (!toasts || toasts.length === 0) return null;

    return (
        <div
            className={`fixed z-[99999] flex flex-col gap-2 pointer-events-none transition-all duration-300 ${
                POSITIONS[position as ToastPosition] || POSITIONS['top-right']
            }`}
        >
            {toasts.map((toast: ToastItem) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastCard toast={toast} />
                </div>
            ))}
        </div>
    );
}
