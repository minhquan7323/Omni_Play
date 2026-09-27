'use client';

import { DroppableList } from '@/components/DroppableList';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

interface CarouselProps<T = any> {
    title: string;
    label?: string;
    avatarUrl?: string;
    showAllHref?: string;

    items?: T[];
    renderItem?: (item: T, index: number) => React.ReactNode;

    children?: React.ReactNode;

    droppableId?: string;
    isDropDisabled?: boolean;
    keepOriginal?: boolean;
    renderClone?: (item: T) => React.ReactElement;
    isLoading?: boolean;
    renderSkeleton?: () => React.ReactNode;
}

export function Carousel<T = any>({
    title,
    label,
    avatarUrl,
    showAllHref,
    items,
    renderItem,
    children,
    droppableId,
    isDropDisabled = true,
    keepOriginal = true,
    renderClone,
    isLoading,
    renderSkeleton
}: CarouselProps<T>) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        const timeoutId = setTimeout(handleScroll, 100);
        return () => {
            window.removeEventListener('resize', handleScroll);
            clearTimeout(timeoutId);
        }
    }, [children, items]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollAmount = container.clientWidth * 0.75;

        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    const renderContent = () => {
        if (isLoading && renderSkeleton) {
            return (
                <div className="flex gap-2 overflow-x-hidden pb-4 px-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index}>{renderSkeleton()}</div>
                    ))}
                </div>
            );
        }

        if (droppableId && items && renderItem) {
            return (
                <div ref={scrollContainerRef} onScroll={handleScroll} className="overflow-x-auto scrollbar-none pb-4 px-2" style={{ scrollBehavior: 'smooth' }}>
                    <DroppableList
                        droppableId={droppableId}
                        direction="horizontal"
                        items={items}
                        keyExtractor={(item: any) => item.id}
                        containerClassName="flex gap-2 w-max min-w-full"
                        isDropDisabled={isDropDisabled}
                        keepOriginal={keepOriginal}
                        renderClone={renderClone as any}
                        renderItem={renderItem as any}
                    />
                </div>
            );
        }

        return (
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex gap-2 overflow-x-auto scrollbar-none pb-4 px-2" style={{ scrollBehavior: 'smooth' }}>
                {items && renderItem ? items.map((item, index) => renderItem(item, index)) : children}
            </div>
        );
    };

    return (
        <section className="mb-8 relative group w-full">
            <div className="flex items-end justify-between mb-4 px-2">
                <div className="flex items-center gap-4">
                    {avatarUrl && (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-md">
                            <Image src={avatarUrl} alt={title} fill sizes="64px" className="object-cover" />
                        </div>
                    )}
                    <div className="flex flex-col">
                        {label && <p className="text-sm text-muted-foreground font-medium">{label}</p>}
                        {showAllHref ? (
                            <Link href={showAllHref} className="hover:underline">
                                <h2 className="text-2xl font-bold text-foreground hover:text-primary transition-colors">{title}</h2>
                            </Link>
                        ) : (
                            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                        )}
                    </div>
                </div>
                {showAllHref && (
                    <Link href={showAllHref} className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline transition-colors">
                        Show all
                    </Link>
                )}
            </div>

            <div className="relative w-full">
                {showLeftArrow && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                {renderContent()}

                {showRightArrow && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>
        </section>
    );
}
