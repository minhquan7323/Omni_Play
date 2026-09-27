import { useCallback, useEffect, useRef, useState } from 'react';

export type ResizableDirection = 'top' | 'right' | 'bottom' | 'left';

interface UseResizableProps {
    direction: ResizableDirection;
    min?: number;
    max?: number;
    currentSize: number;
    onResize: (newSize: number) => void;
    onResizeEnd?: () => void;
}

export function useResizable({
    direction,
    min = 0,
    max = Infinity,
    currentSize,
    onResize,
    onResizeEnd,
}: UseResizableProps) {
    const [isResizing, setIsResizing] = useState(false);

    const animationFrameId = useRef<number | null>(null);
    const resizeState = useRef({ startX: 0, startY: 0, startSize: 0 });

    const startResizing = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            setIsResizing(true);

            let clientX = 0;
            let clientY = 0;

            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = (e as React.MouseEvent).clientX;
                clientY = (e as React.MouseEvent).clientY;
            }

            resizeState.current = {
                startX: clientX,
                startY: clientY,
                startSize: currentSize,
            };
        },
        [currentSize]
    );

    useEffect(() => {
        if (!isResizing) return;

        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }

            animationFrameId.current = requestAnimationFrame(() => {
                let clientX = 0;
                let clientY = 0;

                if ('touches' in e) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = (e as MouseEvent).clientX;
                    clientY = (e as MouseEvent).clientY;
                }

                const { startX, startY, startSize } = resizeState.current;
                let newSize = startSize;

                switch (direction) {
                    case 'right':
                        newSize = startSize + (clientX - startX);
                        break;
                    case 'left':
                        newSize = startSize - (clientX - startX);
                        break;
                    case 'bottom':
                        newSize = startSize + (clientY - startY);
                        break;
                    case 'top':
                        newSize = startSize - (clientY - startY);
                        break;
                }

                newSize = Math.min(Math.max(newSize, min), max);
                onResize(newSize);
            });
        };

        const handleUp = () => {
            setIsResizing(false);
            if (onResizeEnd) onResizeEnd();
        };

        const cursor = ['right', 'left'].includes(direction) ? 'ew-resize' : 'ns-resize';

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleUp);

        document.body.style.userSelect = 'none';
        document.body.style.cursor = cursor;

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);

            document.body.style.userSelect = 'auto';
            document.body.style.cursor = 'default';
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [isResizing, direction, min, max, onResize, onResizeEnd]);

    return { isResizing, startResizing };
}