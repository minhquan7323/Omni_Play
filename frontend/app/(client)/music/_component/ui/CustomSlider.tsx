import React, { useEffect, useRef, useState } from 'react';

interface CustomSliderProps {
    value: number;
    max?: number;
    disabled?: boolean;
    onChange?: (val: number) => void;
    onCommit?: (val: number) => void;
    containerClass?: string;
    thumbClass?: string;
    showTooltip?: boolean;
    formatTooltip?: (val: number) => string | number;
    rounded?: boolean
}

export const CustomSlider = ({
    value, max = 1, disabled = false, onChange, onCommit,
    containerClass = "flex-1", thumbClass = "w-3 h-3",
    showTooltip = false, formatTooltip, rounded = true
}: CustomSliderProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localValue, setLocalValue] = useState(value);

    const [hoverX, setHoverX] = useState<number | null>(null);
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    useEffect(() => { if (!isDragging) setLocalValue(value); }, [value, isDragging]);

    const updateValue = (clientX: number) => {
        if (!ref.current || !max) return 0;
        const rect = ref.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const newValue = percent * max;
        setLocalValue(newValue);
        if (onChange) onChange(newValue);
        return newValue;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (disabled) return;
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        updateValue(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isDragging) updateValue(e.clientX);

        if (showTooltip && ref.current && max > 0 && !disabled) {
            const rect = ref.current.getBoundingClientRect();
            const hPercent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setHoverX(e.clientX - rect.left);
            setHoverValue(hPercent * max);
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isDragging) {
            setIsDragging(false);
            e.currentTarget.releasePointerCapture(e.pointerId);
            if (onCommit) onCommit(updateValue(e.clientX));
        }
    };

    const handlePointerLeave = () => {
        setHoverX(null);
        setHoverValue(null);
    };

    const percent = max > 0 ? (localValue / max) * 100 : 0;

    return (
        <div
            ref={ref}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className={`${containerClass} h-4 sm:h-5 flex items-center group cursor-pointer relative ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        >
            {showTooltip && hoverX !== null && hoverValue !== null && (
                <div
                    className="absolute -top-7 px-1.5 py-0.5 bg-zinc-800 text-white text-[10px] font-medium rounded shadow-md pointer-events-none transform -translate-x-1/2 z-50 whitespace-nowrap"
                    style={{ left: `${hoverX}px` }}
                >
                    {formatTooltip ? formatTooltip(hoverValue) : Math.round(hoverValue)}
                </div>
            )}

            <div className={`w-full h-1 sm:h-1.5 bg-secondary ${rounded ? 'rounded-full' : ''} overflow-hidden`}>
                <div className={`h-full rounded-full bg-primary/80 group-hover:bg-primary ${!isDragging ? 'transition-all duration-100 ease-linear' : ''}`} style={{ width: `${percent}%` }} />
            </div>
            <div className={`absolute ${thumbClass} bg-foreground rounded-full shadow flex items-center justify-center pointer-events-none transform -translate-x-1/2 top-1/2 -translate-y-1/2 ${isDragging ? 'opacity-100 bg-primary scale-110' : 'opacity-0 group-hover:opacity-100'}`} style={{ left: `${percent}%` }} />
        </div>
    );
};