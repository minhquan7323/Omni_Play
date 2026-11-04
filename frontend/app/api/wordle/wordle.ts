import englishWords from 'an-array-of-english-words';
import words10 from 'wordlist-english/english-words-10.json';
import words20 from 'wordlist-english/english-words-20.json';
import words35 from 'wordlist-english/english-words-35.json';

/**
 * Wordle word lists and scoring. Server-only: the answer list must never reach
 * the client, and the dictionaries are several MB.
 *
 * Two different lists, on purpose:
 *  - ANSWERS comes from the *most frequent* English words, so the solution is
 *    always something people actually know.
 *  - GUESSES is the full ~275k dictionary, so any real word is accepted even if
 *    it would never be an answer.
 */

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

/** Day 0 of the daily puzzle, in the game's timezone. */
const EPOCH_UTC_MS = Date.UTC(2026, 0, 1);
/** The app's audience is in Vietnam, so "today" rolls over at UTC+7 midnight. */
const TIMEZONE_OFFSET_MINUTES = 7 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Frequency buckets used for answers. `10` and `20` are the most common words;
 * add `'35'` here if you want more variety at the cost of harder words.
 */
const ANSWER_BUCKETS: string[][] = [words10 as string[], words20 as string[]];
/** Used only to decide whether a trailing -s is a real plural. */
const PLURAL_CHECK_POOL = new Set<string>([
    ...(words10 as string[]),
    ...(words20 as string[]),
    ...(words35 as string[]),
]);

/**
 * Drops plurals and third-person verb forms ("backs", "boxes", "bases") the way
 * the original game does, without dropping genuine words that merely end in -s
 * ("alias", "chaos", "focus"): a word only counts as a plural when its singular
 * is itself a known word.
 */
function isPluralForm(word: string): boolean {
    if (!word.endsWith('s') || word.endsWith('ss')) return false;
    if (PLURAL_CHECK_POOL.has(word.slice(0, -1))) return true;
    return word.endsWith('es') && PLURAL_CHECK_POOL.has(word.slice(0, -2));
}

/** Deterministic PRNG so the puzzle order is identical on every server. */
function mulberry32(seed: number) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const ANSWERS: string[] = (() => {
    const pool = new Set<string>();
    for (const bucket of ANSWER_BUCKETS) {
        for (const word of bucket) {
            if (word.length !== WORD_LENGTH) continue;
            if (!/^[a-z]+$/.test(word)) continue;
            if (isPluralForm(word)) continue;
            pool.add(word);
        }
    }

    // Sort first so the input order never depends on bucket iteration, then
    // shuffle with a fixed seed: the sequence is stable but not alphabetical.
    const list = [...pool].sort();
    const random = mulberry32(0x5eed1e);
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
})();

/** Every real five-letter word is a legal guess, answers included. */
export const VALID_GUESSES: Set<string> = (() => {
    const set = new Set<string>();
    for (const word of englishWords as string[]) {
        if (word.length === WORD_LENGTH && /^[a-z]+$/.test(word)) set.add(word);
    }
    for (const answer of ANSWERS) set.add(answer);
    return set;
})();

/** Days elapsed since the epoch, in the game's timezone. */
export function currentPuzzleId(now: number = Date.now()): number {
    const shifted = now + TIMEZONE_OFFSET_MINUTES * 60 * 1000;
    return Math.floor((shifted - EPOCH_UTC_MS) / DAY_MS);
}

/** The local date string (YYYY-MM-DD) a puzzle id corresponds to. */
export function puzzleDate(puzzleId: number): string {
    return new Date(EPOCH_UTC_MS + puzzleId * DAY_MS).toISOString().slice(0, 10);
}

/** Milliseconds until the next daily puzzle unlocks. */
export function msUntilNextPuzzle(now: number = Date.now()): number {
    const shifted = now + TIMEZONE_OFFSET_MINUTES * 60 * 1000;
    return DAY_MS - ((shifted - EPOCH_UTC_MS) % DAY_MS);
}

export function answerFor(seed: number): string {
    // `%` keeps negative seeds negative, so normalise into range.
    const index = ((seed % ANSWERS.length) + ANSWERS.length) % ANSWERS.length;
    return ANSWERS[index];
}

export type TileState = 'correct' | 'present' | 'absent';

/**
 * Scores a guess against the answer.
 *
 * Repeated letters need two passes: exact matches claim their letter first,
 * and only the leftovers can be marked `present`. A single pass would mark the
 * first `o` of "boost" as present against "robot", which already has both of
 * its `o`s accounted for elsewhere.
 */
export function scoreGuess(guess: string, answer: string): TileState[] {
    const result: TileState[] = new Array(guess.length).fill('absent');
    const remaining = new Map<string, number>();

    for (let i = 0; i < answer.length; i++) {
        if (guess[i] === answer[i]) {
            result[i] = 'correct';
        } else {
            remaining.set(answer[i], (remaining.get(answer[i]) ?? 0) + 1);
        }
    }

    for (let i = 0; i < guess.length; i++) {
        if (result[i] === 'correct') continue;
        const left = remaining.get(guess[i]) ?? 0;
        if (left > 0) {
            result[i] = 'present';
            remaining.set(guess[i], left - 1);
        }
    }

    return result;
}
