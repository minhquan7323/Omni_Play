'use client';

import React, {
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

interface GameHudContextValue {
    slot: HTMLElement | null;
    setSlot: (el: HTMLElement | null) => void;
}

const GameHudContext = createContext<GameHudContextValue | null>(null);

export function GameHudProvider({ children }: { children: React.ReactNode }) {
    const [slot, setSlot] = useState<HTMLElement | null>(null);
    const value = useMemo(() => ({ slot, setSlot }), [slot]);

    return (
        <GameHudContext.Provider value={value}>
            {children}
        </GameHudContext.Provider>
    );
}

export function useGameHudSlotRef() {
    const ctx = useContext(GameHudContext);
    return ctx?.setSlot ?? (() => undefined);
}

export function GameHud({ children }: { children: React.ReactNode }) {
    const ctx = useContext(GameHudContext);
    if (!ctx?.slot) return null;
    return createPortal(children, ctx.slot);
}
