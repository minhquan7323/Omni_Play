import { Gamepad2, Grid3x3, Keyboard, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { APP_ROUTES } from './routes.constant';

export type GameStatus = 'available' | 'coming-soon';

export interface GameEntry {
    id: string;
    icon: LucideIcon;
    label: string;
    tagline: string;
    description: string;
    href: string | null;      // null while the game is still coming soon
    status: GameStatus;
    players: string;
    tags: string[];
    gradient: string;
    border: string;
    iconBg: string;
    iconColor: string;
    accent: string;           // text colour for links / highlights
}

/**
 * Single source of truth for the games hub. Add an entry here and it shows up
 * on `/games` automatically — no changes needed in the page itself.
 */
export const GAMES: GameEntry[] = [
    {
        id: 'typing-fall',
        icon: Keyboard,
        label: 'Typing Fall',
        tagline: 'Gõ nhanh trước khi từ chạm đáy',
        description:
            'Từ vựng tiếng Anh ngẫu nhiên rơi từ trên xuống. Gõ đúng để phá huỷ chúng, giữ combo để nhân điểm — càng lên level từ rơi càng nhanh.',
        href: APP_ROUTES.GAMES.TYPING_FALL,
        status: 'available',
        players: '1 người',
        tags: ['Luyện gõ', 'Tiếng Anh', 'Endless'],
        gradient: 'from-indigo-600/30 to-cyan-500/20',
        border: 'border-indigo-500/20',
        iconBg: 'bg-indigo-500/20',
        iconColor: 'text-indigo-400',
        accent: 'text-indigo-400',
    },
    {
        id: 'wordle',
        icon: Grid3x3,
        label: 'Wordle',
        tagline: 'Sáu lượt đoán, một từ',
        description:
            'Đoán từ tiếng Anh 5 chữ cái trong 6 lượt. Mỗi ngày một câu đố chung cho tất cả mọi người, có thống kê chuỗi thắng và chia sẻ kết quả.',
        href: APP_ROUTES.GAMES.WORDLE,
        status: 'available',
        players: '1 người',
        tags: ['Đoán từ', 'Hàng ngày', 'Tiếng Anh'],
        gradient: 'from-emerald-600/30 to-teal-500/20',
        border: 'border-emerald-500/20',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        accent: 'text-emerald-400',
    },
    {
        id: 'liars-bar',
        icon: Gamepad2,
        label: "Liar's Bar",
        tagline: 'Tố cáo hay tin tưởng?',
        description:
            'Game thẻ bài lừa dối nhiều người chơi. Đánh ra lá bài được yêu cầu — hoặc nói dối — và cầu mong không ai gọi tên bạn.',
        href: APP_ROUTES.GAMES.LIARS_BAR,
        status: 'available',
        players: 'Nhiều người',
        tags: ['Thẻ bài', 'Tâm lý', 'Nhiều người'],
        gradient: 'from-rose-600/30 to-amber-500/20',
        border: 'border-rose-500/20',
        iconBg: 'bg-rose-500/20',
        iconColor: 'text-rose-400',
        accent: 'text-rose-400',
    },
    {
        id: 'coming-soon',
        icon: Sparkles,
        label: 'Sắp ra mắt',
        tagline: 'Thêm game đang được phát triển',
        description:
            'Còn nhiều game nữa đang trên đường tới. Có ý tưởng muốn thấy ở đây? Hãy cho chúng tôi biết.',
        href: null,
        status: 'coming-soon',
        players: '—',
        tags: ['Đang phát triển'],
        gradient: 'from-slate-600/20 to-slate-500/10',
        border: 'border-border',
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
        accent: 'text-muted-foreground',
    },
];

export const PLAYABLE_GAMES = GAMES.filter(game => game.status === 'available');
