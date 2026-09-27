'use client';

import { motion } from 'framer-motion';

interface SettingSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

// ─── Setting Section ──────────────────────────────────────────────────────────
// Reusable section wrapper with animated entry, title, and icon.
export function SettingSection({ title, icon, children }: SettingSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
            <h3 className="text-sm font-bold flex items-center gap-2">
                {icon}
                {title}
            </h3>
            {children}
        </motion.div>
    );
}
