'use client';

import { GAMES, PLAYABLE_GAMES } from '@/constants/games.constant';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Gamepad2, Lock, Users } from 'lucide-react';
import Link from 'next/link';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function GamesPage() {
    return (
        <div className="bg-background text-foreground">
            <section className="relative overflow-hidden px-6 pt-16 pb-10">
                <motion.div
                    className="relative z-10 max-w-3xl mx-auto text-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div
                        variants={itemVariants}
                        className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium"
                    >
                        <Gamepad2 className="w-4 h-4" />
                        {PLAYABLE_GAMES.length} game có thể chơi ngay
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        className="text-4xl md:text-6xl font-black tracking-tight mb-4"
                    >
                        Chọn{' '}
                        <span
                            className="bg-clip-text text-transparent"
                            style={{
                                backgroundImage:
                                    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #f43f5e 100%)',
                            }}
                        >
                            game của bạn
                        </span>
                    </motion.h1>
                </motion.div>
            </section>

            <section className="px-6 pb-24 max-w-7xl mx-auto">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {GAMES.map((game, idx) => {
                        const Icon = game.icon;
                        const isPlayable = game.status === 'available' && game.href !== null;

                        const card = (
                            <div
                                className={`relative h-full flex flex-col overflow-hidden rounded-3xl border ${game.border} bg-gradient-to-br ${game.gradient} p-6 transition-all ${isPlayable
                                    ? 'hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10'
                                    : 'opacity-70'
                                    }`}
                            >

                                <h2 className="text-xl font-bold mb-1">{game.label}</h2>
                                <p className={`text-sm font-medium mb-3 ${game.accent}`}>{game.tagline}</p>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                                    {game.description}
                                </p>

                                <div className="flex flex-wrap gap-1.5 mb-5">
                                    {game.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 rounded-lg bg-background/50 border border-border/50 text-[11px] text-muted-foreground"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/40">
                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Users className="w-3.5 h-3.5" />
                                        {game.players}
                                    </span>
                                    {isPlayable && (
                                        <span className={`flex items-center gap-1 text-xs font-semibold ${game.accent}`}>
                                            Vào game
                                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        );

                        return (
                            <motion.div
                                key={game.id}
                                className={isPlayable ? 'group' : ''}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.45, delay: idx * 0.08 }}
                                whileHover={isPlayable ? { y: -6, transition: { duration: 0.2 } } : undefined}
                            >
                                {isPlayable ? (
                                    <Link href={game.href!} className="block h-full">
                                        {card}
                                    </Link>
                                ) : (
                                    <div aria-disabled className="h-full cursor-not-allowed">
                                        {card}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
