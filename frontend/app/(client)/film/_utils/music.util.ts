export const CDN = 'https://phimimg.com';

export const imgUrl = (url?: string | null): string => {
    if (!url || typeof url !== 'string' || !url.trim()) {
        return '/placeholder-film.jpg';
    }

    const clean = url.trim();

    if (clean.includes('/t/p/') || clean.startsWith('t/p/')) {
        const tmdbPath = clean.substring(clean.indexOf('t/p/') - 1);
        const path = tmdbPath.startsWith('/') ? tmdbPath : `/${tmdbPath}`;
        return `https://image.tmdb.org${path}`;
    }

    if (clean.startsWith('http://') || clean.startsWith('https://')) {
        return clean;
    }

    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\//.test(clean)) {
        return `https://${clean}`;
    }

    const cleanPath = clean.startsWith('/') ? clean : `/${clean}`;
    return `${CDN}${cleanPath}`;
};

export const SECTION_GRADIENTS: Record<string, string> = {
    top: 'from-amber-400 to-primary',
    new: 'from-cyan-400 to-primary',
    tv: 'from-indigo-400 to-primary',
    anime: 'from-rose-400 to-primary',
    movie: 'from-emerald-400 to-primary',
    us: 'from-fuchsia-400 to-primary',
    vn: 'from-yellow-400 to-primary',
};

export interface HoverInfo {
    film: any;
    rect: DOMRect;
}

export function fmtSeconds(s?: number): string {
    if (!s || s <= 0) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export function progressPercent(pos?: number, dur?: number): number {
    if (!pos || !dur || dur === 0) return 0;
    return Math.min(100, Math.round((pos / dur) * 100));
}

export const fmtViews = (views: number) => {
    if (views > 1000000) {
        return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views > 1000) {
        return `${(views / 1000).toFixed(0)}K`;
    }
    return views;
};