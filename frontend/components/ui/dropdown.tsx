'use client';

import React, { useState, useRef, useEffect, ReactNode, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import PopoverContent from '../ui/PopoverContent';

export interface DropdownOption {
    id: string | number;
    label: string;
    subLabel?: string;
    icon?: ReactNode;
    badge?: ReactNode;
    disabled?: boolean;
    danger?: boolean;
    onClick?: () => void;
}

interface DropdownProps {
    options: DropdownOption[];
    value?: string | number;
    onChange?: (option: DropdownOption) => void;
    placeholder?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    emptyText?: string;
    customTrigger?: (
        isOpen: boolean,
        selectedOption?: DropdownOption,
    ) => ReactNode;
    width?: string;
    showCheckmark?: boolean;
    header?: ReactNode;
    footer?: ReactNode;
}

export default function Dropdown({
    options = [],
    value,
    onChange,
    placeholder = 'Chọn một tùy chọn...',
    searchable = false,
    searchPlaceholder = 'Tìm kiếm...',
    emptyText = 'Không tìm thấy kết quả',
    customTrigger,
    width = 'w-64',
    showCheckmark = true,
    header,
    footer,
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Xử lý bật/tắt menu
    const handleToggleOpen = () => {
        setIsOpen((prev) => {
            const nextState = !prev;
            if (nextState) {
                setSearchQuery('');
            }
            return nextState;
        });
    };

    useEffect(() => {
        if (isOpen && searchable) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen, searchable]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.id === value);

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const query = searchQuery.toLowerCase().trim();
        return options.filter(
            (opt) =>
                opt.label.toLowerCase().includes(query) ||
                (opt.subLabel && opt.subLabel.toLowerCase().includes(query)),
        );
    }, [options, searchQuery]);

    const handleSelect = (option: DropdownOption) => {
        if (option.disabled) return;

        if (option.onClick) {
            option.onClick();
        }
        if (onChange) {
            onChange(option);
        }
        setIsOpen(false);
        setSearchQuery('');
    };

    const defaultTrigger = (
        <button
            type="button"
            onClick={handleToggleOpen}
            className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-medium bg-card hover:bg-accent/50 border border-border/60 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground w-full"
        >
            <div className="flex items-center gap-2 truncate">
                {selectedOption?.icon && (
                    <span className="shrink-0">{selectedOption.icon}</span>
                )}
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
            </div>
            <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                }`}
            />
        </button>
    );

    return (
        <PopoverContent
            contentRef={dropdownRef}
            button={
                customTrigger
                    ? customTrigger(isOpen, selectedOption)
                    : defaultTrigger
            }
            isOpen={isOpen}
            width={width}
        >
            {header && <div className="mb-1">{header}</div>}

            {searchable && (
                <div className="relative px-1 pt-0.5 pb-1.5">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-muted/40 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}

            <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                {filteredOptions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                        {emptyText}
                    </div>
                ) : (
                    filteredOptions.map((option, index) => {
                        const isSelected = selectedOption?.id === option.id;
                        const showSeparator =
                            index > 0 &&
                            (option.danger || option.id === 'divider');

                        return (
                            <React.Fragment key={option.id}>
                                {showSeparator && (
                                    <div className="my-1 border-t border-border/40" />
                                )}
                                <button
                                    type="button"
                                    disabled={option.disabled}
                                    onClick={() => handleSelect(option)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                                        option.disabled
                                            ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                                            : option.danger
                                              ? 'text-destructive hover:bg-destructive/10'
                                              : isSelected
                                                ? 'bg-accent text-foreground font-semibold'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        {option.icon && (
                                            <span className="shrink-0 text-muted-foreground">
                                                {option.icon}
                                            </span>
                                        )}
                                        <div className="flex flex-col text-left truncate">
                                            <span className="truncate">
                                                {option.label}
                                            </span>
                                            {option.subLabel && (
                                                <span className="text-[10px] text-muted-foreground font-normal truncate">
                                                    {option.subLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                        {option.badge && (
                                            <span className="text-[11px] font-semibold text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded-md">
                                                {option.badge}
                                            </span>
                                        )}
                                        {showCheckmark && isSelected && (
                                            <Check className="w-3.5 h-3.5 text-primary" />
                                        )}
                                    </div>
                                </button>
                            </React.Fragment>
                        );
                    })
                )}
            </div>

            {footer && (
                <>
                    <div className="my-1 border-t border-border/40" />
                    {footer}
                </>
            )}
        </PopoverContent>
    );
}
