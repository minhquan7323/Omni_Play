'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { removeToast, ToastItem } from '@/store/slices/toast.slice';
import {
    CheckCircle2,
    AlertCircle,
    Info,
    AlertTriangle,
    X,
} from 'lucide-react';

const ICONS = {
    success: <CheckCircle2 className="w-5 h-5 text-mint shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-destructive shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow shrink-0" />,
    info: <Info className="w-5 h-5 text-sky shrink-0" />,
};

const BORDER_ACCENTS = {
    success: 'border-l-mint',
    error: 'border-l-destructive',
    warning: 'border-l-yellow',
    info: 'border-l-sky',
};

export default function ToastCard({ toast }: { toast: ToastItem }) {
    const dispatch = useDispatch();
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            dispatch(removeToast(toast.id));
        }, 300);
    };

    useEffect(() => {
        if (!toast.duration) return;
        const timer = setTimeout(() => {
            handleDismiss();
        }, toast.duration);

        return () => clearTimeout(timer);
    }, [toast.duration]);

    const type = toast.type || 'info';

    return (
        <div
            className={`flex items-start gap-3 w-80 p-3.5 bg-card/95 text-card-foreground backdrop-blur-md rounded-xl border border-border/40 border-l-4 ${
                BORDER_ACCENTS[type]
            } shadow-2xl transition-all duration-300 ease-out ${
                isExiting
                    ? 'opacity-0 scale-90 translate-y-2'
                    : 'opacity-100 scale-100 translate-y-0'
            }`}
        >
            <div className="pt-0.5">{ICONS[type]}</div>

            <div className="flex-1 min-w-0">
                {toast.title && (
                    <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                        {toast.title}
                    </h4>
                )}
                <p className="text-xs text-muted-foreground break-words mt-0.5 leading-relaxed">
                    {toast.message}
                </p>
            </div>

            <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors shrink-0"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
