'use client';

export function MainContent({ children }: { children: React.ReactNode }) {

    return (
        <main className="flex-1 w-full h-full bg-popover rounded-lg overflow-y-auto relative custom-scrollbar">
            {children}
        </main>
    );
}