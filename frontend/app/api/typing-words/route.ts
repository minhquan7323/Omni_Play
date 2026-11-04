import englishWords from 'an-array-of-english-words';

/**
 * Serves random English words for the Typing Fall game.
 *
 * The ~275k-word list is only ever loaded on the server: shipping it to the
 * browser would add several MB to the client bundle.
 */

/** Only plain a-z words are typeable with a standard keyboard. */
const PLAYABLE_WORDS: string[] = (englishWords as string[]).filter(word => /^[a-z]+$/.test(word));

/** Bucketed by length once per server process so requests are O(count). */
const WORDS_BY_LENGTH: Map<number, string[]> = (() => {
    const buckets = new Map<number, string[]>();
    for (const word of PLAYABLE_WORDS) {
        const bucket = buckets.get(word.length);
        if (bucket) bucket.push(word);
        else buckets.set(word.length, [word]);
    }
    return buckets;
})();

const MIN_LENGTH = 2;
const MAX_LENGTH = 16;
const MAX_COUNT = 500;
const DEFAULT_COUNT = 200;

function toInt(value: string | null, fallback: number): number {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const count = clamp(toInt(searchParams.get('count'), DEFAULT_COUNT), 1, MAX_COUNT);
    let min = clamp(toInt(searchParams.get('min'), 3), MIN_LENGTH, MAX_LENGTH);
    let max = clamp(toInt(searchParams.get('max'), 7), MIN_LENGTH, MAX_LENGTH);
    if (min > max) [min, max] = [max, min];

    // Flatten the requested length buckets into one candidate pool.
    const candidates: string[] = [];
    for (let length = min; length <= max; length++) {
        const bucket = WORDS_BY_LENGTH.get(length);
        if (bucket) candidates.push(...bucket);
    }

    if (candidates.length === 0) {
        return Response.json({ words: [], min, max }, { status: 200 });
    }

    // Sample without replacement (partial Fisher-Yates on a seen-set, so we
    // never copy the whole candidate array).
    const picked: string[] = [];
    const used = new Set<number>();
    const wanted = Math.min(count, candidates.length);
    while (picked.length < wanted) {
        const index = Math.floor(Math.random() * candidates.length);
        if (used.has(index)) continue;
        used.add(index);
        picked.push(candidates[index]);
    }

    return Response.json({ words: picked, min, max });
}
