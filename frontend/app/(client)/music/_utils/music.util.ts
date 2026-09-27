
export function fmtMs(ms?: number | null): string {
    if (!ms) return '';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export function spotifyImg(
    images?: { url: string; width?: number; height?: number }[] | null,
    preferWidth = 300,
): string {
    if (!images || images.length === 0) return '';
    const sorted = [...images].sort((a, b) =>
        Math.abs((a.width ?? 0) - preferWidth) - Math.abs((b.width ?? 0) - preferWidth),
    );
    return sorted[0].url;
}

export function artistNames(artists?: any[] | null): string {
    if (!artists || artists.length === 0) return 'Unknown Artist';
    return artists.map((a) => a.name).join(', ');
}

export function fmtNumber(n?: number | null): string {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

export const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

export const MUSIC_GRADIENTS = {
    purple: 'from-purple-900/60 to-background',
    green: 'from-green-900/60 to-background',
    blue: 'from-blue-900/60 to-background',
    rose: 'from-rose-900/60 to-background',
    amber: 'from-amber-900/60 to-background',
    teal: 'from-teal-900/60 to-background',
} as const;
