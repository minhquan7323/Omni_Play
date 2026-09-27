'use client';

import { motion, Variants } from 'framer-motion';
import { Film, Music, Layout, ArrowRight, Users, Star, Play } from 'lucide-react';
import Link from 'next/link';
import { useSelector } from 'react-redux';

const MODULES = [
    {
        id: 'film',
        icon: Film,
        label: 'Film',
        tagline: 'Xem phim mọi lúc mọi nơi',
        description: 'Khám phá kho phim đa dạng với bộ lọc thể loại, quốc gia, năm phát hành. Lưu lịch sử và danh sách yêu thích.',
        href: '/film',
        gradient: 'from-rose-600/30 to-orange-500/20',
        border: 'border-rose-500/20',
        iconBg: 'bg-rose-500/20',
        iconColor: 'text-rose-400',
        badge: 'Mới cập nhật',
        badgeColor: 'bg-rose-500/20 text-rose-400',
        stats: ['10,000+ phim', 'HD chất lượng'],
    },
    {
        id: 'music',
        icon: Music,
        label: 'Music',
        tagline: 'Âm nhạc không giới hạn',
        description: 'Stream nhạc chất lượng cao, tạo playlist cá nhân, khám phá nghệ sĩ và album mới nhất mỗi ngày.',
        href: '/music',
        gradient: 'from-violet-600/30 to-indigo-500/20',
        border: 'border-violet-500/20',
        iconBg: 'bg-violet-500/20',
        iconColor: 'text-violet-400',
        badge: 'Trending',
        badgeColor: 'bg-violet-500/20 text-violet-400',
        stats: ['500+ bài hát', 'Playlist tuỳ chỉnh'],
    },
    {
        id: 'whiteboard',
        icon: Layout,
        label: 'Whiteboard',
        tagline: 'Cộng tác thời gian thực',
        description: 'Bảng vẽ trực tuyến đa người dùng với WebSocket. Brainstorm, vẽ sơ đồ và cộng tác nhóm hiệu quả.',
        href: '/whiteboard',
        gradient: 'from-emerald-600/30 to-teal-500/20',
        border: 'border-emerald-500/20',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        badge: 'Real-time',
        badgeColor: 'bg-emerald-500/20 text-emerald-400',
        stats: ['Đa người dùng', 'Tự động lưu'],
    },
];

const PLATFORM_STATS = [
    { icon: Film, value: '10K+', label: 'Phim & Series' },
    { icon: Music, value: '500+', label: 'Bài hát' },
    { icon: Users, value: '1K+', label: 'Người dùng' },
    { icon: Star, value: '4.9', label: 'Đánh giá' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function HomePage() {
    const auth = useSelector((state: any) => state.auth);
    const isAuthenticated = auth?.isAuthenticated;
    const user = auth?.user;

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* ─── Hero Section ──────────────────────────────────────────────── */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Animated mesh background */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-radial from-primary/10 via-transparent to-transparent"
                        style={{ width: '200%', height: '200%' }}
                    />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl" />
                    {/* Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
                        }}
                    />
                </div>

                <motion.div
                    className="relative z-10 max-w-4xl mx-auto px-6 text-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Badge */}
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Nền tảng giải trí & cộng tác
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
                        Trải nghiệm{' '}
                        <span
                            className="bg-clip-text text-transparent"
                            style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a855f7 100%)' }}
                        >
                            không giới hạn
                        </span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        Một nền tảng duy nhất để xem phim, nghe nhạc và cộng tác trực tuyến.
                        {isAuthenticated ? ` Chào mừng trở lại, ${user?.fullName?.split(' ')[0]}!` : ' Bắt đầu hành trình của bạn ngay hôm nay.'}
                    </motion.p>

                    {/* CTAs */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/film"
                            className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Play className="w-4 h-4" />
                            Xem phim ngay
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/music"
                            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Music className="w-4 h-4" />
                            Nghe nhạc
                        </Link>
                    </motion.div>

                    {/* Platform stats */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
                        {PLATFORM_STATS.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <p className="text-2xl font-black text-foreground">{stat.value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2">
                        <div className="w-1 h-2 rounded-full bg-muted-foreground/50" />
                    </div>
                </motion.div>
            </section>

            {/* ─── Module Cards ──────────────────────────────────────────────── */}
            <section className="px-6 py-20 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-14"
                >
                    <h2 className="text-3xl md:text-4xl font-black mb-3">
                        Khám phá{' '}
                        <span className="text-primary">tất cả tính năng</span>
                    </h2>
                    <p className="text-muted-foreground">Mọi thứ bạn cần trong một nền tảng duy nhất</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {MODULES.map((mod, idx) => (
                        <motion.div
                            key={mod.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        >
                            <Link
                                href={mod.href}
                                className={`group block h-full bg-gradient-to-br ${mod.gradient} border ${mod.border} rounded-3xl p-6 hover:border-opacity-60 transition-all duration-300 hover:shadow-2xl`}
                            >
                                {/* Badge */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className={`w-12 h-12 rounded-2xl ${mod.iconBg} flex items-center justify-center`}>
                                        <mod.icon className={`w-6 h-6 ${mod.iconColor}`} />
                                    </div>
                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${mod.badgeColor}`}>
                                        {mod.badge}
                                    </span>
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-foreground mb-1">{mod.label}</h3>
                                <p className="text-sm font-medium text-muted-foreground mb-3">{mod.tagline}</p>
                                <p className="text-sm text-muted-foreground/70 leading-relaxed mb-5">
                                    {mod.description}
                                </p>

                                {/* Stats pills */}
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {mod.stats.map((s) => (
                                        <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                                            {s}
                                        </span>
                                    ))}
                                </div>

                                {/* CTA */}
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:gap-3 transition-all">
                                    Khám phá ngay
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── Features Strip ────────────────────────────────────────────── */}
            <section className="px-6 py-16 bg-card/50 border-y border-border">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
                    >
                        {[
                            { emoji: '⚡', title: 'Hiệu năng cao', desc: 'Next.js 16 + Redis caching, tải trang dưới 1 giây' },
                            { emoji: '🔐', title: 'Bảo mật tuyệt đối', desc: 'JWT Access/Refresh Token, Google OAuth 2.0' },
                            { emoji: '🌐', title: 'Real-time', desc: 'WebSocket cho whiteboard cộng tác đa người dùng' },
                        ].map((f) => (
                            <div key={f.title} className="space-y-2">
                                <div className="text-3xl">{f.emoji}</div>
                                <h3 className="font-bold text-foreground">{f.title}</h3>
                                <p className="text-sm text-muted-foreground">{f.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ─── CTA Bottom ────────────────────────────────────────────────── */}
            {!isAuthenticated && (
                <section className="px-6 py-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-xl mx-auto space-y-6"
                    >
                        <h2 className="text-3xl font-black">Sẵn sàng bắt đầu?</h2>
                        <p className="text-muted-foreground">Đăng ký miễn phí và khám phá ngay hôm nay</p>
                        <button
                            onClick={() => {
                                // Dispatch openModal if needed — handled by Header
                                document.dispatchEvent(new CustomEvent('open-auth-modal'));
                            }}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 hover:scale-[1.02]"
                        >
                            Đăng ký miễn phí
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                </section>
            )}
        </div>
    );
}
