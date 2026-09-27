import { FastAverageColor } from 'fast-average-color';

const fac = new FastAverageColor();

export async function getDominantColor(imageUrl?: string, fallback = '#242424'): Promise<string> {
    if (typeof window === 'undefined' || !imageUrl) return fallback;

    try {
        const color = await fac.getColorAsync(imageUrl, {
            algorithm: 'dominant',
            crossOrigin: 'anonymous',
        });
        return color.hex;
    } catch {
        return fallback;
    }
}