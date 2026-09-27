import { useEffect, useRef, useState } from 'react';

interface MarqueeTextProps {
    text: string;
    isPlaying?: boolean;
    playOnHover?: boolean;
    fadeEdges?: boolean;
    speed?: number;
    textClassName?: string;
    containerClassName?: string;
}

export default function MarqueeText({
    text,
    isPlaying = true,
    playOnHover = false,
    fadeEdges = true,
    speed = 8,
    textClassName = '',
    containerClassName = ''
}: MarqueeTextProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text]);

    const shouldAnimate = isOverflowing && (playOnHover ? isHovered : isPlaying);

    return (
        <div
            ref={containerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`min-w-0 overflow-hidden relative ${containerClassName}`}
            style={{
                maskImage: isOverflowing && fadeEdges
                    ? 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
                    : 'none',
                WebkitMaskImage: isOverflowing && fadeEdges
                    ? 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
                    : 'none'
            }}
        >
            <div
                className="flex w-max"
                style={{
                    animation: shouldAnimate ? `marquee ${speed}s linear infinite` : 'none'
                }}
            >
                <p
                    ref={textRef}
                    className={`${textClassName} ${shouldAnimate ? 'pr-8' : 'truncate'}`}
                >
                    {text}
                </p>
                {shouldAnimate && (
                    <p className={`${textClassName} pr-8`}>
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
}