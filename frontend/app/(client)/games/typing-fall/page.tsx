'use client';

import { HEADER_HEIGHT } from '@/constants/layout.constant';
import { GameHud } from '@/contexts/GameHudContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Bomb, ChevronDown, Flame, Heart, Hourglass, Keyboard, RotateCcw, Snowflake, Star, Target, Timer, TrendingUp, Trophy, X, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const FALLBACK_WORDS = [
    'ace', 'bay', 'cog', 'den', 'elf', 'fog', 'gem', 'hub', 'ink', 'jar',
    'keg', 'log', 'mud', 'net', 'oak', 'pin', 'rim', 'sky', 'tin', 'urn',
    'brave', 'cloud', 'dance', 'eagle', 'flame', 'ghost', 'honey', 'ivory',
    'jewel', 'knife', 'lemon', 'magic', 'noble', 'ocean', 'pearl', 'queen',
    'river', 'stone', 'tiger', 'vivid', 'whale', 'youth', 'zebra', 'storm',
    'anchor', 'bridge', 'candle', 'dragon', 'ember', 'forest', 'garden',
    'hammer', 'island', 'jungle', 'kettle', 'lantern', 'marble', 'nectar',
    'orbit', 'puzzle', 'quiver', 'ribbon', 'saddle', 'temple', 'umbrella',
    'velvet', 'whisper', 'yonder', 'blossom', 'crystal', 'diamond',
    'elegant', 'feather', 'granite', 'harvest', 'journey', 'kingdom',
    'lantern', 'mystery', 'network', 'outlook', 'pyramid', 'quantum',
    'rainbow', 'symphony', 'treasure', 'universe', 'volcano', 'wanderer',
];

const WORD_BATCH_SIZE = 200;
const WORD_REFILL_THRESHOLD = 40;

/* ─────────────────────── Power-ups ─────────────────────── */

type WordKind = 'normal' | 'heal' | 'freeze' | 'slow' | 'bomb' | 'bonus';
type PowerUpKind = Exclude<WordKind, 'normal'>;

interface PowerUpSpec {
    icon: LucideIcon;
    label: string;
    description: string;
    weight: number;        // relative spawn chance among power-ups
    durationMs: number;    // 0 = instant effect
    pill: string;          // pill styling when idle
    activePill: string;    // pill styling while being typed
    text: string;          // accent colour for the icon / badge
    particle: string[];    // burst colours on completion
}

/** Roughly one in seven spawns is a power-up. */
const POWER_UP_CHANCE = 0.15;

const POWER_UPS: Record<PowerUpKind, PowerUpSpec> = {
    heal: {
        icon: Heart,
        label: 'Hồi máu',
        description: 'Hoàn thành để hồi 1 máu (không vượt quá máu tối đa)',
        weight: 3,
        durationMs: 0,
        pill: 'bg-emerald-500/15 border-emerald-400/40 shadow-[0_0_16px_rgba(52,211,153,0.25)]',
        activePill: 'bg-emerald-500/30 border-emerald-300/60 shadow-[0_0_24px_rgba(52,211,153,0.45)] scale-110',
        text: 'text-emerald-300',
        particle: ['#34d399', '#6ee7b7', '#a7f3d0'],
    },
    freeze: {
        icon: Snowflake,
        label: 'Đóng băng',
        description: 'Dừng mọi từ đang rơi trong 4 giây — vẫn gõ được bình thường',
        weight: 3,
        durationMs: 4000,
        pill: 'bg-sky-500/15 border-sky-400/40 shadow-[0_0_16px_rgba(56,189,248,0.25)]',
        activePill: 'bg-sky-500/30 border-sky-300/60 shadow-[0_0_24px_rgba(56,189,248,0.45)] scale-110',
        text: 'text-sky-300',
        particle: ['#38bdf8', '#7dd3fc', '#e0f2fe'],
    },
    slow: {
        icon: Hourglass,
        label: 'Làm chậm',
        description: 'Giảm tốc độ rơi còn 35% trong 7 giây',
        weight: 3,
        durationMs: 7000,
        pill: 'bg-violet-500/15 border-violet-400/40 shadow-[0_0_16px_rgba(167,139,250,0.25)]',
        activePill: 'bg-violet-500/30 border-violet-300/60 shadow-[0_0_24px_rgba(167,139,250,0.45)] scale-110',
        text: 'text-violet-300',
        particle: ['#a78bfa', '#c4b5fd', '#ddd6fe'],
    },
    bomb: {
        icon: Bomb,
        label: 'Bom',
        description: 'Phá huỷ toàn bộ từ đang trên màn hình, mỗi từ +15 điểm',
        weight: 2,
        durationMs: 0,
        pill: 'bg-orange-500/15 border-orange-400/40 shadow-[0_0_16px_rgba(251,146,60,0.25)]',
        activePill: 'bg-orange-500/30 border-orange-300/60 shadow-[0_0_24px_rgba(251,146,60,0.45)] scale-110',
        text: 'text-orange-300',
        particle: ['#fb923c', '#fbbf24', '#ef4444'],
    },
    bonus: {
        icon: Star,
        label: 'Điểm x3',
        description: 'Từ này ăn gấp 3 điểm',
        weight: 4,
        durationMs: 0,
        pill: 'bg-amber-500/15 border-amber-400/40 shadow-[0_0_16px_rgba(251,191,36,0.25)]',
        activePill: 'bg-amber-500/30 border-amber-300/60 shadow-[0_0_24px_rgba(251,191,36,0.45)] scale-110',
        text: 'text-amber-300',
        particle: ['#fbbf24', '#fcd34d', '#fef3c7'],
    },
};

const POWER_UP_KINDS = Object.keys(POWER_UPS) as PowerUpKind[];
const POWER_UP_TOTAL_WEIGHT = POWER_UP_KINDS.reduce((sum, k) => sum + POWER_UPS[k].weight, 0);

/** Slowdown factor applied while the `slow` power-up is active. */
const SLOW_FACTOR = 0.35;
/** Points awarded per word wiped out by a bomb. */
const BOMB_POINTS_PER_WORD = 15;

function rollWordKind(): WordKind {
    if (Math.random() > POWER_UP_CHANCE) return 'normal';
    let roll = Math.random() * POWER_UP_TOTAL_WEIGHT;
    for (const kind of POWER_UP_KINDS) {
        roll -= POWER_UPS[kind].weight;
        if (roll <= 0) return kind;
    }
    return 'bonus';
}

/* ─────────────────────── Types ─────────────────────── */

interface FallingWord {
    id: number;
    text: string;
    kind: WordKind;
    x: number;           // percentage 0-85
    y: number;           // pixel position from top
    speed: number;       // pixels per frame (16ms)
    typedIndex: number;  // how many chars typed correctly
    isActive: boolean;   // currently being typed
    isCompleted: boolean;
    createdAt: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
    maxLives: number;
    baseSpeed: number;
    speedVariation: number;
    spawnInterval: number;    // ms
    maxWords: number;
    mistakePenalty: number;   // lives lost per mistake
    minLength: number;        // shortest word to spawn
    maxLength: number;        // longest word to spawn
    wordsPerLevel: number;    // completed words needed to advance a level
    speedStep: number;        // fall-speed multiplier gained per level
    maxSpeedMultiplier: number;
    spawnStep: number;        // ms shaved off the spawn interval per level
    minSpawnInterval: number; // floor for the spawn interval
    label: string;
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
    easy: {
        maxLives: 7,
        baseSpeed: 0.3,
        speedVariation: 0.2,
        spawnInterval: 3000,
        maxWords: 5,
        mistakePenalty: 1,
        minLength: 3,
        maxLength: 5,
        wordsPerLevel: 8,
        speedStep: 0.12,
        maxSpeedMultiplier: 3,
        spawnStep: 150,
        minSpawnInterval: 1200,
        label: 'Dễ',
    },
    medium: {
        maxLives: 5,
        baseSpeed: 0.5,
        speedVariation: 0.35,
        spawnInterval: 2200,
        maxWords: 7,
        mistakePenalty: 1,
        minLength: 4,
        maxLength: 7,
        wordsPerLevel: 6,
        speedStep: 0.16,
        maxSpeedMultiplier: 3.5,
        spawnStep: 140,
        minSpawnInterval: 900,
        label: 'Trung bình',
    },
    hard: {
        maxLives: 3,
        baseSpeed: 0.8,
        speedVariation: 0.5,
        spawnInterval: 1500,
        maxWords: 10,
        mistakePenalty: 1,
        minLength: 5,
        maxLength: 10,
        wordsPerLevel: 5,
        speedStep: 0.2,
        maxSpeedMultiplier: 4,
        spawnStep: 120,
        minSpawnInterval: 650,
        label: 'Khó',
    },
};

/* ─────────────────────── Particles ─────────────────────── */

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    velocityX: number;
    velocityY: number;
    life: number;
    type: 'spark' | 'star' | 'ring';
}

/* ─────────────────────── Component ─────────────────────── */

let wordIdCounter = 0;
let particleIdCounter = 0;

export default function TypingFallGame() {
    /* ── state ── */
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [words, setWords] = useState<FallingWord[]>([]);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [wordsCompleted, setWordsCompleted] = useState(0);
    const [totalMistakes, setTotalMistakes] = useState(0);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [shakeScreen, setShakeScreen] = useState(false);
    const [flashRed, setFlashRed] = useState(false);
    const [activeWordId, setActiveWordId] = useState<number | null>(null);
    const [inputBuffer, setInputBuffer] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [loadedWordRange, setLoadedWordRange] = useState<string | null>(null);
    const [level, setLevel] = useState(1);
    const [freezeSecondsLeft, setFreezeSecondsLeft] = useState(0);
    const [slowSecondsLeft, setSlowSecondsLeft] = useState(0);
    const [legendOpen, setLegendOpen] = useState(false);

    /* ── refs ── */
    const animFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const spawnTimerRef = useRef<number>(0);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const wordsRef = useRef<FallingWord[]>([]);
    const livesRef = useRef(5);
    const scoreRef = useRef(0);
    const comboRef = useRef(0);
    const activeWordIdRef = useRef<number | null>(null);
    const gameStateRef = useRef<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
    const elapsedRef = useRef(0);
    const startTimeRef = useRef(0);
    const wordPoolRef = useRef<string[]>([]);
    const fetchingWordsRef = useRef(false);
    const wordPoolGenRef = useRef(0);
    const wordsCompletedRef = useRef(0);
    const levelRef = useRef(1);
    const frozenUntilRef = useRef(0);
    const slowUntilRef = useRef(0);
    const freezeShownRef = useRef(0);
    const slowShownRef = useRef(0);

    const config = useMemo(() => DIFFICULTY_CONFIGS[difficulty], [difficulty]);

    /**
     * Words fall faster and spawn closer together the further you get: every
     * `wordsPerLevel` completed words bumps the level, which scales the fall
     * speed of *every* word on screen (not just newly spawned ones) and shrinks
     * the spawn interval, both capped so the game stays playable.
     */
    const speedMultiplierFor = useCallback((lvl: number) => (
        Math.min(config.maxSpeedMultiplier, 1 + (lvl - 1) * config.speedStep)
    ), [config]);

    const spawnIntervalFor = useCallback((lvl: number) => (
        Math.max(config.minSpawnInterval, config.spawnInterval - (lvl - 1) * config.spawnStep)
    ), [config]);

    const speedMultiplier = speedMultiplierFor(level);

    /* ── sync refs ── */
    useEffect(() => { wordsRef.current = words; }, [words]);
    useEffect(() => { livesRef.current = lives; }, [lives]);
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { comboRef.current = combo; }, [combo]);
    useEffect(() => { activeWordIdRef.current = activeWordId; }, [activeWordId]);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { wordsCompletedRef.current = wordsCompleted; }, [wordsCompleted]);
    useEffect(() => { levelRef.current = level; }, [level]);

    /* ── word pool (fetched from the English word library) ── */
    const wordRange = `${config.minLength}-${config.maxLength}`;
    /** True once the pool holds words for the *current* difficulty's length range. */
    const poolReady = loadedWordRange === wordRange;

    const fetchWordBatch = useCallback(async (reset: boolean) => {
        // A refill may be skipped while one is in flight; a reset never is.
        if (fetchingWordsRef.current && !reset) return;
        fetchingWordsRef.current = true;

        const range = `${config.minLength}-${config.maxLength}`;
        const generation = reset ? ++wordPoolGenRef.current : wordPoolGenRef.current;

        let batch: string[];
        try {
            const res = await fetch(
                `/api/typing-words?count=${WORD_BATCH_SIZE}&min=${config.minLength}&max=${config.maxLength}`
            );
            if (!res.ok) throw new Error(`Word API responded ${res.status}`);
            const data: { words?: unknown } = await res.json();
            const incoming = Array.isArray(data.words) ? (data.words as string[]) : [];
            if (incoming.length === 0) throw new Error('Word API returned an empty batch');
            batch = incoming;
        } catch {
            // Offline or API down — fall back to the bundled list so the game still runs.
            const inRange = FALLBACK_WORDS.filter(
                w => w.length >= config.minLength && w.length <= config.maxLength
            );
            batch = inRange.length > 0 ? inRange : FALLBACK_WORDS;
        } finally {
            fetchingWordsRef.current = false;
        }

        // A newer reset (difficulty change) superseded this request.
        if (generation !== wordPoolGenRef.current) return;

        wordPoolRef.current = reset ? batch : [...wordPoolRef.current, ...batch];
        setLoadedWordRange(range);
    }, [config.minLength, config.maxLength]);

    // Rebuild the pool whenever the difficulty (and so the word length) changes.
    useEffect(() => {
        void fetchWordBatch(true);
    }, [fetchWordBatch]);

    /** Take one unused word out of the pool, topping it up when it runs low. */
    const takeWord = useCallback((exclude: Set<string>) => {
        const pool = wordPoolRef.current;
        if (pool.length <= WORD_REFILL_THRESHOLD) void fetchWordBatch(false);
        if (pool.length === 0) return null;

        const start = Math.floor(Math.random() * pool.length);
        for (let i = 0; i < pool.length; i++) {
            const index = (start + i) % pool.length;
            if (!exclude.has(pool[index])) return pool.splice(index, 1)[0];
        }
        return null;
    }, [fetchWordBatch]);

    const spawnParticles = useCallback((
        x: number,
        y: number,
        type: 'complete' | 'mistake' | 'miss',
        palette?: string[],
    ) => {
        const colors = palette ?? (type === 'complete'
            ? ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6']
            : type === 'mistake'
                ? ['#ef4444', '#f97316', '#fbbf24']
                : ['#6b7280', '#9ca3af', '#d1d5db']);

        const newParticles: Particle[] = [];
        const count = type === 'complete' ? 16 : 8;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 2 + Math.random() * 4;
            newParticles.push({
                id: particleIdCounter++,
                x,
                y,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: type === 'complete' ? 4 + Math.random() * 6 : 3 + Math.random() * 4,
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed - 2,
                life: 1,
                type: type === 'complete'
                    ? (['spark', 'star', 'ring'] as const)[Math.floor(Math.random() * 3)]
                    : 'spark',
            });
        }

        setParticles(prev => [...prev, ...newParticles]);

        // Clean up after animation
        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
        }, 800);
    }, []);

    /**
     * Applies a completed word's power-up. Scoring stays at the call site; this
     * only handles the side effect (heal, freeze, slow, bomb). `bonus` is a pure
     * score multiplier and so is handled by `scoreMultiplierFor`.
     */
    const applyWordEffect = useCallback((word: FallingWord) => {
        if (word.kind === 'normal' || word.kind === 'bonus') return;
        const spec = POWER_UPS[word.kind];

        const burst = () => {
            if (!gameAreaRef.current) return;
            const rect = gameAreaRef.current.getBoundingClientRect();
            spawnParticles((word.x / 100) * rect.width + 40, word.y, 'complete', spec.particle);
        };

        switch (word.kind) {
            case 'heal':
                setLives(prev => Math.min(config.maxLives, prev + 1));
                burst();
                break;

            case 'freeze':
                frozenUntilRef.current = Date.now() + spec.durationMs;
                burst();
                break;

            case 'slow':
                slowUntilRef.current = Date.now() + spec.durationMs;
                burst();
                break;

            case 'bomb': {
                // Wipe every other word on screen; the bomb word itself is
                // removed by the normal completion path.
                const cleared = wordsRef.current.filter(w => w.id !== word.id && !w.isCompleted);
                if (cleared.length > 0) {
                    setScore(prev => prev + cleared.length * BOMB_POINTS_PER_WORD);
                    setWordsCompleted(prev => prev + cleared.length);
                }
                wordsRef.current = wordsRef.current
                    .filter(w => w.id === word.id)
                    .map(w => ({ ...w, typedIndex: w.text.length, isCompleted: true }));
                setWords(wordsRef.current);

                if (gameAreaRef.current) {
                    const rect = gameAreaRef.current.getBoundingClientRect();
                    cleared.forEach(w => {
                        spawnParticles((w.x / 100) * rect.width + 40, w.y, 'complete', spec.particle);
                    });
                    burst();
                }
                break;
            }
        }
    }, [config.maxLives, spawnParticles]);

    /** Bonus words are worth triple. */
    const scoreMultiplierFor = useCallback((word: FallingWord) => (
        word.kind === 'bonus' ? 3 : 1
    ), []);

    const spawnWord = useCallback(() => {
        const currentWords = wordsRef.current;

        if (currentWords.length >= config.maxWords) return;

        // Avoid duplicate words on screen
        const onScreenTexts = new Set(currentWords.map(w => w.text));
        const text = takeWord(onScreenTexts);
        if (!text) return;

        // Calculate x position avoiding overlap
        const existingXs = currentWords.map(w => w.x);
        let x: number;
        let attempts = 0;
        do {
            x = 5 + Math.random() * 80;
            attempts++;
        } while (
            attempts < 20 &&
            existingXs.some(ex => Math.abs(ex - x) < 12)
        );

        const speed = config.baseSpeed + (Math.random() - 0.5) * 2 * config.speedVariation;

        const newWord: FallingWord = {
            id: wordIdCounter++,
            text,
            kind: rollWordKind(),
            x,
            y: -30,
            speed: Math.max(0.15, speed),
            typedIndex: 0,
            isActive: false,
            isCompleted: false,
            createdAt: Date.now(),
        };

        // Keep the ref in step synchronously. React commits `setWords` later, and
        // a stale ref here is what let the same word spawn twice: the next
        // spawn's duplicate check would not see this word yet.
        wordsRef.current = [...currentWords, newWord];
        setWords(wordsRef.current);
    }, [takeWord, config]);

    /* ── Game Loop ── */
    const gameLoop = useCallback((timestamp: number) => {
        if (gameStateRef.current !== 'playing') return;

        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const delta = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        // Update elapsed time
        elapsedRef.current += delta;
        if (Math.floor(elapsedRef.current / 1000) !== Math.floor((elapsedRef.current - delta) / 1000)) {
            setElapsedTime(Math.floor(elapsedRef.current / 1000));
        }

        // Advance the level as words are cleared — drives speed and spawn rate.
        const targetLevel = 1 + Math.floor(wordsCompletedRef.current / config.wordsPerLevel);
        if (targetLevel !== levelRef.current) {
            levelRef.current = targetLevel;
            setLevel(targetLevel);
        }

        // Spawn new words (interval tightens with the level). While frozen the
        // board is held completely still, so skip spawning too.
        if (Date.now() >= frozenUntilRef.current) spawnTimerRef.current += delta;
        if (spawnTimerRef.current >= spawnIntervalFor(levelRef.current)) {
            spawnTimerRef.current = 0;
            spawnWord();
        }

        // Power-up timers: freeze halts the fall entirely, slow scales it down.
        const now = Date.now();
        const freezeLeft = Math.max(0, frozenUntilRef.current - now);
        const slowLeft = Math.max(0, slowUntilRef.current - now);

        const freezeSeconds = Math.ceil(freezeLeft / 1000);
        if (freezeSeconds !== freezeShownRef.current) {
            freezeShownRef.current = freezeSeconds;
            setFreezeSecondsLeft(freezeSeconds);
        }
        const slowSeconds = Math.ceil(slowLeft / 1000);
        if (slowSeconds !== slowShownRef.current) {
            slowShownRef.current = slowSeconds;
            setSlowSecondsLeft(slowSeconds);
        }

        const effectMultiplier = freezeLeft > 0 ? 0 : slowLeft > 0 ? SLOW_FACTOR : 1;

        // Update word positions
        const gameAreaHeight = gameAreaRef.current?.clientHeight ?? 600;
        const currentSpeedMultiplier = speedMultiplierFor(levelRef.current) * effectMultiplier;

        setWords(prev => {
            let lostLife = false;
            const updated = prev
                .map(word => {
                    if (word.isCompleted) return word;
                    const newY = word.y + word.speed * currentSpeedMultiplier * (delta / 16);

                    // Word reached the bottom
                    if (newY > gameAreaHeight) {
                        lostLife = true;
                        // If this was the active word, deactivate it
                        if (word.id === activeWordIdRef.current) {
                            setActiveWordId(null);
                            setInputBuffer('');
                        }
                        return null;
                    }

                    return { ...word, y: newY };
                })
                .filter(Boolean) as FallingWord[];

            if (lostLife) {
                setLives(prev => {
                    const newLives = prev - 1;
                    if (newLives <= 0) {
                        setGameState('gameover');
                    }
                    return Math.max(0, newLives);
                });
                setCombo(0);
                setShakeScreen(true);
                setFlashRed(true);
                setTimeout(() => setShakeScreen(false), 400);
                setTimeout(() => setFlashRed(false), 300);

                // Spawn miss particles at bottom
                const missedWord = prev.find(w => !w.isCompleted && w.y + w.speed * (delta / 16) > gameAreaHeight);
                if (missedWord && gameAreaRef.current) {
                    const rect = gameAreaRef.current.getBoundingClientRect();
                    spawnParticles(
                        (missedWord.x / 100) * rect.width,
                        rect.height - 20,
                        'miss'
                    );
                }
            }

            return updated;
        });

        // Update particles
        setParticles(prev => prev.map(p => ({
            ...p,
            x: p.x + p.velocityX,
            y: p.y + p.velocityY,
            velocityY: p.velocityY + 0.1,
            life: p.life - 0.02,
        })).filter(p => p.life > 0));

        animFrameRef.current = requestAnimationFrame(gameLoop);
    }, [config, spawnWord, spawnParticles, speedMultiplierFor, spawnIntervalFor]);

    /* ── Start / Reset ── */
    const startGame = useCallback(() => {
        wordIdCounter = 0;
        particleIdCounter = 0;
        setWords([]);
        setScore(0);
        setLives(config.maxLives);
        setCombo(0);
        setMaxCombo(0);
        setWordsCompleted(0);
        setTotalMistakes(0);
        setLevel(1);
        levelRef.current = 1;
        wordsCompletedRef.current = 0;
        frozenUntilRef.current = 0;
        slowUntilRef.current = 0;
        freezeShownRef.current = 0;
        slowShownRef.current = 0;
        setFreezeSecondsLeft(0);
        setSlowSecondsLeft(0);
        wordsRef.current = [];
        setParticles([]);
        setActiveWordId(null);
        setInputBuffer('');
        setElapsedTime(0);
        elapsedRef.current = 0;
        lastTimeRef.current = 0;
        spawnTimerRef.current = config.spawnInterval; // >= level-1 interval, so spawn immediately
        livesRef.current = config.maxLives;
        scoreRef.current = 0;
        comboRef.current = 0;
        activeWordIdRef.current = null;
        gameStateRef.current = 'playing';
        setGameState('playing');
    }, [config]);

    /* ── Run game loop ── */
    useEffect(() => {
        if (gameState === 'playing') {
            lastTimeRef.current = 0;
            animFrameRef.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
            }
        };
    }, [gameState, gameLoop]);

    /* ── Keyboard Input ── */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameStateRef.current !== 'playing') return;
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            const key = e.key;

            // Esc / Backspace releases the word you are locked onto, with no
            // penalty — needed when several words share a first letter and the
            // auto-pick grabbed the wrong one.
            if (key === 'Escape' || key === 'Backspace') {
                e.preventDefault();
                const lockedId = activeWordIdRef.current;
                if (lockedId === null) return;
                setActiveWordId(null);
                setInputBuffer('');
                wordsRef.current = wordsRef.current.map(w =>
                    w.id === lockedId && !w.isCompleted
                        ? { ...w, typedIndex: 0, isActive: false }
                        : w
                );
                setWords(wordsRef.current);
                return;
            }

            // Ignore non-character keys
            if (key.length !== 1) return;

            e.preventDefault();
            const lowerKey = key.toLowerCase();
            const currentWords = wordsRef.current;
            const currentActiveId = activeWordIdRef.current;

            // If we have an active word, continue typing it
            if (currentActiveId !== null) {
                const activeWord = currentWords.find(w => w.id === currentActiveId);
                if (!activeWord || activeWord.isCompleted) {
                    setActiveWordId(null);
                    setInputBuffer('');
                    return;
                }

                const expectedChar = activeWord.text[activeWord.typedIndex]?.toLowerCase();

                if (lowerKey === expectedChar) {
                    // Correct character
                    const newTypedIndex = activeWord.typedIndex + 1;
                    const isNowComplete = newTypedIndex >= activeWord.text.length;

                    setWords(prev => prev.map(w => {
                        if (w.id !== currentActiveId) return w;
                        return {
                            ...w,
                            typedIndex: newTypedIndex,
                            isCompleted: isNowComplete,
                        };
                    }));

                    setInputBuffer(prev => prev + lowerKey);

                    if (isNowComplete) {
                        // Word completed!
                        const newCombo = comboRef.current + 1;
                        const comboMultiplier = Math.min(1 + newCombo * 0.5, 5);
                        const baseScore = activeWord.text.length * 10;
                        const speedBonus = Math.floor(activeWord.speed * speedMultiplierFor(levelRef.current) * 20);
                        const points = Math.floor(
                            (baseScore + speedBonus) * comboMultiplier * scoreMultiplierFor(activeWord)
                        );

                        setScore(prev => prev + points);
                        setCombo(newCombo);
                        setMaxCombo(prev => Math.max(prev, newCombo));
                        setWordsCompleted(prev => prev + 1);
                        setActiveWordId(null);
                        setInputBuffer('');

                        // Remove completed word after short delay for animation
                        setTimeout(() => {
                            setWords(prev => prev.filter(w => w.id !== currentActiveId));
                        }, 400);

                        // Spawn completion particles
                        if (gameAreaRef.current) {
                            const rect = gameAreaRef.current.getBoundingClientRect();
                            spawnParticles(
                                (activeWord.x / 100) * rect.width + 40,
                                activeWord.y,
                                'complete'
                            );
                        }

                        applyWordEffect(activeWord);
                    }
                } else {
                    // Wrong character - penalty
                    setTotalMistakes(prev => prev + 1);
                    setLives(prev => {
                        const newLives = prev - config.mistakePenalty;
                        if (newLives <= 0) {
                            setGameState('gameover');
                        }
                        return Math.max(0, newLives);
                    });
                    setCombo(0);
                    setShakeScreen(true);
                    setFlashRed(true);
                    setTimeout(() => setShakeScreen(false), 300);
                    setTimeout(() => setFlashRed(false), 200);

                    // Spawn mistake particles
                    if (gameAreaRef.current) {
                        const rect = gameAreaRef.current.getBoundingClientRect();
                        spawnParticles(
                            (activeWord.x / 100) * rect.width + 40,
                            activeWord.y,
                            'mistake'
                        );
                    }
                }
            } else {
                // No active word — try to match first character of any visible word
                // Find words whose first untyped char matches, pick the lowest (closest to bottom)
                const matchingWords = currentWords
                    .filter(w => {
                        if (w.isCompleted) return false;
                        if (w.typedIndex > 0) return false; // shouldn't happen if no active word
                        const firstChar = w.text[0]?.toLowerCase();
                        return firstChar === lowerKey;
                    })
                    .sort((a, b) => b.y - a.y); // pick lowest first (most urgent)

                if (matchingWords.length > 0) {
                    const targetWord = matchingWords[0];
                    const newTypedIndex = 1;
                    const isNowComplete = newTypedIndex >= targetWord.text.length;

                    setActiveWordId(targetWord.id);
                    setInputBuffer(lowerKey);

                    setWords(prev => prev.map(w => {
                        if (w.id !== targetWord.id) return w;
                        return {
                            ...w,
                            typedIndex: newTypedIndex,
                            isActive: true,
                            isCompleted: isNowComplete,
                        };
                    }));

                    if (isNowComplete) {
                        const newCombo = comboRef.current + 1;
                        const comboMultiplier = Math.min(1 + newCombo * 0.5, 5);
                        const points = Math.floor(10 * comboMultiplier * scoreMultiplierFor(targetWord));
                        setScore(prev => prev + points);
                        setCombo(newCombo);
                        setMaxCombo(prev => Math.max(prev, newCombo));
                        setWordsCompleted(prev => prev + 1);
                        setActiveWordId(null);
                        setInputBuffer('');

                        setTimeout(() => {
                            setWords(prev => prev.filter(w => w.id !== targetWord.id));
                        }, 400);

                        if (gameAreaRef.current) {
                            const rect = gameAreaRef.current.getBoundingClientRect();
                            spawnParticles(
                                (targetWord.x / 100) * rect.width + 40,
                                targetWord.y,
                                'complete'
                            );
                        }

                        applyWordEffect(targetWord);
                    }
                } else {
                    // No matching word — mistake
                    setTotalMistakes(prev => prev + 1);
                    setLives(prev => {
                        const newLives = prev - config.mistakePenalty;
                        if (newLives <= 0) {
                            setGameState('gameover');
                        }
                        return Math.max(0, newLives);
                    });
                    setCombo(0);
                    setShakeScreen(true);
                    setFlashRed(true);
                    setTimeout(() => setShakeScreen(false), 300);
                    setTimeout(() => setFlashRed(false), 200);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [config, spawnParticles, speedMultiplierFor, applyWordEffect, scoreMultiplierFor]);

    /* ── Format time ── */
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    /* ── Render ── */
    return (
        <div
            className="relative overflow-hidden select-none"
            style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#111827] to-[#0f172a]">
                {/* Animated grid */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
                        backgroundSize: '50px 50px',
                    }}
                />
                {/* Glow orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-600/8 rounded-full blur-[80px] pointer-events-none" />
            </div>

            {/* Red flash overlay on mistake */}
            <AnimatePresence>
                {flashRed && (
                    <motion.div
                        className="absolute inset-0 bg-red-500/20 pointer-events-none z-50"
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </AnimatePresence>

            {/* ─── MENU SCREEN ─── */}
            <AnimatePresence mode="wait">
                {gameState === 'menu' && (
                    <motion.div
                        key="menu"
                        className="absolute inset-0 z-40 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="max-w-lg w-full mx-4 space-y-6">
                            {/* Title */}
                            <motion.div
                                className="text-center space-y-3"
                                initial={{ y: -30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                            >
                                <h1 className="text-5xl font-black text-white">
                                    Typing{' '}
                                    <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                        Fall
                                    </span>
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    Gõ nhanh — tiêu diệt từ vựng trước khi chúng chạm đáy!
                                </p>
                            </motion.div>

                            {/* Settings card */}
                            <motion.div
                                className="bg-card/60 backdrop-blur-xl border border-border rounded-2xl p-6 space-y-5"
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                {/* Difficulty */}
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        Độ khó
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {([
                                            { value: 'easy' as Difficulty, label: 'Dễ', color: 'emerald' },
                                            { value: 'medium' as Difficulty, label: 'Trung bình', color: 'amber' },
                                            { value: 'hard' as Difficulty, label: 'Khó', color: 'red' },
                                        ]).map(opt => {
                                            const colorMap: Record<string, string> = {
                                                emerald: difficulty === opt.value ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : '',
                                                amber: difficulty === opt.value ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : '',
                                                red: difficulty === opt.value ? 'bg-red-500/20 border-red-500/40 text-red-300' : '',
                                            };
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setDifficulty(opt.value)}
                                                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${difficulty === opt.value
                                                        ? colorMap[opt.color]
                                                        : 'bg-card/50 border-border text-muted-foreground hover:bg-card/80 hover:text-foreground'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="bg-background/50 rounded-xl p-3 space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Heart className="w-3.5 h-3.5 text-red-400" />
                                        <span>{config.maxLives} mạng</span>
                                        <span className="text-border mx-1">•</span>
                                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                        <span>Tốc độ: {config.baseSpeed < 0.4 ? 'Chậm' : config.baseSpeed < 0.7 ? 'Vừa' : 'Nhanh'}</span>
                                        <span className="text-border mx-1">•</span>
                                        <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>{config.minLength}–{config.maxLength} ký tự</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground/60">
                                        Gõ chữ cái đầu tiên để bắt đầu từ, hoàn thành trước khi chuyển sang từ khác
                                    </p>
                                    <p className="text-[11px] text-muted-foreground/60">
                                        Từ vựng tiếng Anh ngẫu nhiên từ thư viện ~275.000 từ
                                    </p>
                                    <p className="text-[11px] text-muted-foreground/60">
                                        Mỗi {config.wordsPerLevel} từ hoàn thành sẽ lên 1 level — từ rơi nhanh hơn và xuất hiện dày hơn (tối đa x{config.maxSpeedMultiplier})
                                    </p>
                                </div>
                            </motion.div>

                            {/* Power-up legend (collapsible) */}
                            <motion.div
                                className="bg-card/60 backdrop-blur-xl border border-border rounded-2xl overflow-hidden"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.28, duration: 0.5 }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setLegendOpen(open => !open)}
                                    aria-expanded={legendOpen}
                                    aria-controls="power-up-legend"
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-card/80 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Từ đặc biệt
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                                            {POWER_UP_KINDS.length}
                                        </span>
                                    </span>

                                    <span className="flex items-center gap-2">
                                        {/* Icon preview stays visible while collapsed */}
                                        {!legendOpen && (
                                            <span className="flex items-center gap-1">
                                                {POWER_UP_KINDS.map(kind => {
                                                    const spec = POWER_UPS[kind];
                                                    const Icon = spec.icon;
                                                    return (
                                                        <span
                                                            key={kind}
                                                            className={`flex items-center justify-center w-5 h-5 rounded-full bg-background border border-current ${spec.text}`}
                                                            title={spec.label}
                                                        >
                                                            <Icon className="w-3 h-3" />
                                                        </span>
                                                    );
                                                })}
                                            </span>
                                        )}
                                        <motion.span
                                            animate={{ rotate: legendOpen ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-muted-foreground"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </motion.span>
                                    </span>
                                </button>

                                <AnimatePresence initial={false}>
                                    {legendOpen && (
                                        <motion.div
                                            id="power-up-legend"
                                            key="legend"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 space-y-2.5 border-t border-border/40 pt-3">
                                                {POWER_UP_KINDS.map(kind => {
                                                    const spec = POWER_UPS[kind];
                                                    const Icon = spec.icon;
                                                    return (
                                                        <div key={kind} className="flex items-start gap-2.5">
                                                            <div
                                                                className={`shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-background border border-current ${spec.text}`}
                                                            >
                                                                <Icon className="w-3 h-3" />
                                                            </div>
                                                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                                                <span className={`font-semibold ${spec.text}`}>{spec.label}</span>
                                                                {' — '}
                                                                {spec.description}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Play button */}
                            <motion.div
                                className="text-center"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.35, duration: 0.5 }}
                            >
                                <button
                                    onClick={startGame}
                                    disabled={!poolReady}
                                    className="group relative px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-wait disabled:hover:scale-100"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Keyboard className="w-5 h-5" />
                                        {poolReady ? 'Bắt đầu chơi' : 'Đang tải từ vựng…'}
                                    </span>
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── GAME PLAYING ─── */}
            {(gameState === 'playing' || gameState === 'gameover') && (
                <div className={`absolute inset-0 flex flex-col ${shakeScreen ? 'animate-shake' : ''}`}>
                    {/* HUD — portalled into the global header so there is only one bar */}
                    <GameHud>
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                        {/* Lives */}
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: config.maxLives }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        scale: i < lives ? [1, 1.2, 1] : 1,
                                        opacity: i < lives ? 1 : 0.2,
                                    }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Heart
                                        className={`w-4 h-4 ${i < lives
                                            ? 'text-red-400 fill-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]'
                                            : 'text-gray-600'
                                            }`}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Score + Combo */}
                        <div className="flex items-center gap-4">
                            {combo > 1 && (
                                <motion.div
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    key={combo}
                                >
                                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-xs font-bold text-amber-300">x{combo}</span>
                                </motion.div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                <motion.span
                                    className="text-lg font-bold text-white tabular-nums"
                                    key={score}
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {score.toLocaleString()}
                                </motion.span>
                            </div>
                        </div>

                        {/* Timer + Stats */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {freezeSecondsLeft > 0 && (
                                <motion.span
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-semibold"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <Snowflake className="w-3.5 h-3.5" />
                                    {freezeSecondsLeft}s
                                </motion.span>
                            )}
                            {slowSecondsLeft > 0 && freezeSecondsLeft === 0 && (
                                <motion.span
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/40 text-violet-300 font-semibold"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                >
                                    <Hourglass className="w-3.5 h-3.5" />
                                    {slowSecondsLeft}s
                                </motion.span>
                            )}
                            <motion.span
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold"
                                key={level}
                                initial={{ scale: 0.8, opacity: 0.6 }}
                                animate={{ scale: [1.25, 1], opacity: 1 }}
                                transition={{ duration: 0.35 }}
                                title={`Tốc độ x${speedMultiplier.toFixed(2)}`}
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                Lv.{level}
                            </motion.span>
                            <span className="flex items-center gap-1">
                                <Timer className="w-3.5 h-3.5" />
                                {formatTime(elapsedTime)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 text-emerald-400" />
                                {wordsCompleted}
                            </span>
                            </div>
                        </div>
                    </GameHud>

                    {/* Game area */}
                    <div ref={gameAreaRef} className="flex-1 relative overflow-hidden">
                        {/* Freeze overlay */}
                        {freezeSecondsLeft > 0 && (
                            <motion.div
                                className="absolute inset-0 z-20 pointer-events-none bg-sky-400/10 border-2 border-sky-400/30"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            />
                        )}
                        {/* Bottom danger zone */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-red-900/30 to-transparent pointer-events-none z-10">
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]" />
                        </div>

                        {/* Falling words */}
                        <AnimatePresence>
                            {words.map(word => {
                                const spec = word.kind === 'normal' ? null : POWER_UPS[word.kind];
                                const PowerIcon = spec?.icon;
                                const isActiveWord = word.id === activeWordId;
                                return (
                                    <motion.div
                                        key={word.id}
                                        className="absolute"
                                        style={{
                                            left: `${word.x}%`,
                                            top: word.y,
                                        }}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{
                                            opacity: word.isCompleted ? 0 : 1,
                                            scale: word.isCompleted ? 1.5 : 1,
                                        }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div
                                            className={`relative px-3 py-1.5 rounded-xl border font-mono text-base tracking-wider whitespace-nowrap transition-all duration-200 ${spec
                                                ? (isActiveWord ? spec.activePill : spec.pill)
                                                : isActiveWord
                                                    ? 'bg-indigo-500/20 border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-110'
                                                    : 'bg-card/60 border-border/40 backdrop-blur-sm'
                                                } ${word.isCompleted ? 'border-emerald-400/50 bg-emerald-500/20' : ''}`}
                                        >
                                            {/* Power-up badge */}
                                            {PowerIcon && spec && (
                                                <div
                                                    className={`absolute -top-2 -left-2 flex items-center justify-center w-5 h-5 rounded-full bg-background border border-current ${spec.text}`}
                                                    title={spec.label}
                                                >
                                                    <PowerIcon className="w-3 h-3" />
                                                </div>
                                            )}

                                            {/* Speed indicator */}
                                            {!spec && word.speed > config.baseSpeed + config.speedVariation * 0.5 && (
                                                <div className="absolute -top-1 -right-1">
                                                    <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                </div>
                                            )}

                                            {/* Word characters */}
                                            <span className="relative">
                                                {word.text.split('').map((char, i) => {
                                                    const isTyped = i < word.typedIndex;
                                                    const isNext = i === word.typedIndex && isActiveWord;
                                                    return (
                                                        <span
                                                            key={i}
                                                            className={`relative transition-all duration-150 ${isTyped
                                                                ? 'text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                                                                : isNext
                                                                    ? 'text-white underline decoration-2 decoration-indigo-400 underline-offset-4 animate-pulse'
                                                                    : 'text-gray-400'
                                                                }`}
                                                        >
                                                            {char}
                                                            {isTyped && (
                                                                <motion.span
                                                                    className="absolute inset-0 text-cyan-300 blur-sm"
                                                                    initial={{ opacity: 1 }}
                                                                    animate={{ opacity: 0 }}
                                                                    transition={{ duration: 0.5 }}
                                                                >
                                                                    {char}
                                                                </motion.span>
                                                            )}
                                                        </span>
                                                    );
                                                })}
                                            </span>

                                            {/* Active indicator bar */}
                                            {isActiveWord && (
                                                <motion.div
                                                    className="absolute -bottom-0.5 left-1 right-1 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full"
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: word.typedIndex / word.text.length }}
                                                    transition={{ duration: 0.12 }}
                                                    style={{ transformOrigin: 'left' }}
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Particles */}
                        {particles.map(p => (
                            <div
                                key={p.id}
                                className="absolute pointer-events-none"
                                style={{
                                    left: p.x,
                                    top: p.y,
                                    width: p.size,
                                    height: p.size,
                                    backgroundColor: p.type === 'ring' ? 'transparent' : p.color,
                                    borderRadius: p.type === 'star' ? '2px' : '50%',
                                    border: p.type === 'ring' ? `2px solid ${p.color}` : 'none',
                                    opacity: p.life,
                                    transform: `rotate(${p.type === 'star' ? '45deg' : '0deg'}) scale(${p.life})`,
                                    boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                                    transition: 'none',
                                }}
                            />
                        ))}

                        {/* Currently typing indicator at bottom */}
                        {activeWordId !== null && inputBuffer && (
                            <motion.div
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-card/80 backdrop-blur border border-indigo-500/30"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                            >
                                <Keyboard className="w-4 h-4 text-indigo-400" />
                                <span className="font-mono text-sm text-cyan-300 tracking-widest font-bold">{inputBuffer}</span>
                                <span className="w-0.5 h-4 bg-indigo-400 animate-pulse" />
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── GAME OVER OVERLAY ─── */}
            <AnimatePresence>
                {gameState === 'gameover' && (
                    <motion.div
                        key="gameover"
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="max-w-md w-full mx-4 bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-8 space-y-6"
                            initial={{ scale: 0.8, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                        >
                            {/* Header */}
                            <div className="text-center space-y-2">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring' }}
                                >
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30">
                                        <X className="w-8 h-8 text-red-400" />
                                    </div>
                                </motion.div>
                                <h2 className="text-2xl font-black text-white">Trò chơi kết thúc!</h2>
                                <p className="text-sm text-muted-foreground">
                                    Bạn đã hoàn thành {wordsCompleted} từ trong {formatTime(elapsedTime)}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: Trophy, label: 'Điểm số', value: score.toLocaleString(), color: 'text-yellow-400' },
                                    { icon: Target, label: 'Từ đã gõ', value: wordsCompleted.toString(), color: 'text-emerald-400' },
                                    { icon: Flame, label: 'Combo tối đa', value: `x${maxCombo}`, color: 'text-amber-400' },
                                    { icon: Zap, label: 'Số lỗi', value: totalMistakes.toString(), color: 'text-red-400' },
                                    { icon: TrendingUp, label: 'Level đạt được', value: `Lv.${level}`, color: 'text-cyan-400', wide: true },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        className={`bg-background/50 rounded-xl p-3 text-center space-y-1 border border-border/30 ${stat.wide ? 'col-span-2' : ''}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                    >
                                        <stat.icon className={`w-4 h-4 mx-auto ${stat.color}`} />
                                        <p className="text-lg font-bold text-white">{stat.value}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Accuracy */}
                            <div className="bg-background/50 rounded-xl p-3 border border-border/30">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                                    <span>Độ chính xác</span>
                                    <span className="font-bold text-white">
                                        {wordsCompleted + totalMistakes > 0
                                            ? Math.round(
                                                (wordsCompleted /
                                                    (wordsCompleted + totalMistakes)) * 100
                                            )
                                            : 0}%
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${wordsCompleted + totalMistakes > 0
                                                ? (wordsCompleted /
                                                    (wordsCompleted + totalMistakes)) * 100
                                                : 0}%`
                                        }}
                                        transition={{ delay: 0.5, duration: 0.8 }}
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setGameState('menu')}
                                    className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-muted/50 transition-all active:scale-[0.98]"
                                >
                                    Menu
                                </button>
                                <button
                                    onClick={startGame}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Chơi lại
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CSS for shake animation */}
            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                    20%, 40%, 60%, 80% { transform: translateX(3px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
}
