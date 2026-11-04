'use client';

import { HEADER_HEIGHT } from '@/constants/layout.constant';
import { GameHud } from '@/contexts/GameHudContext';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Check, Copy, Delete, Flame, Loader2, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ─────────────────────── Types & constants ─────────────────────── */

type TileState = 'correct' | 'present' | 'absent';
type GameStatus = 'playing' | 'won' | 'lost';
type Mode = 'daily' | 'practice';

interface Row {
    guess: string;
    result: TileState[];
}

interface PuzzleMeta {
    puzzleId: number;
    date: string;
    wordLength: number;
    maxGuesses: number;
    answerCount: number;
    msUntilNext: number;
}

interface Stats {
    played: number;
    won: number;
    streak: number;
    maxStreak: number;
    /** Index 0 = solved in 1 guess. */
    distribution: number[];
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const EMPTY_STATS: Stats = {
    played: 0,
    won: 0,
    streak: 0,
    maxStreak: 0,
    distribution: Array(MAX_GUESSES).fill(0),
};

const STATS_KEY = 'omniplay:wordle:stats';
const dailyKey = (puzzleId: number) => `omniplay:wordle:daily:${puzzleId}`;

const KEYBOARD_ROWS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
];

const TILE_CLASS: Record<TileState, string> = {
    correct: 'bg-emerald-600 border-emerald-600 text-white',
    present: 'bg-amber-500 border-amber-500 text-white',
    absent: 'bg-muted border-muted text-muted-foreground',
};

const KEY_CLASS: Record<TileState, string> = {
    correct: 'bg-emerald-600 border-emerald-600 text-white',
    present: 'bg-amber-500 border-amber-500 text-white',
    absent: 'bg-background border-border text-muted-foreground/50',
};

const SHARE_EMOJI: Record<TileState, string> = {
    correct: '🟩',
    present: '🟨',
    absent: '⬜',
};

/* ─────────────────────── Helpers ─────────────────────── */

function readStats(): Stats {
    if (typeof window === 'undefined') return EMPTY_STATS;
    try {
        const raw = window.localStorage.getItem(STATS_KEY);
        if (!raw) return EMPTY_STATS;
        const parsed = JSON.parse(raw) as Partial<Stats>;
        return {
            ...EMPTY_STATS,
            ...parsed,
            distribution: Array.isArray(parsed.distribution) && parsed.distribution.length === MAX_GUESSES
                ? parsed.distribution
                : EMPTY_STATS.distribution,
        };
    } catch {
        return EMPTY_STATS;
    }
}

function formatCountdown(ms: number): string {
    if (ms <= 0) return '00:00:00';
    const total = Math.floor(ms / 1000);
    const h = String(Math.floor(total / 3600)).padStart(2, '0');
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const sec = String(total % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
}

/* ─────────────────────── Component ─────────────────────── */

export default function WordlePage() {
    const [meta, setMeta] = useState<PuzzleMeta | null>(null);
    const [mode, setMode] = useState<Mode>('daily');
    const [practiceSeed, setPracticeSeed] = useState<number | null>(null);

    const [rows, setRows] = useState<Row[]>([]);
    const [current, setCurrent] = useState('');
    const [status, setStatus] = useState<GameStatus>('playing');
    const [answer, setAnswer] = useState<string | null>(null);

    const [message, setMessage] = useState<string | null>(null);
    const [shakeRow, setShakeRow] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState<Stats>(EMPTY_STATS);
    const [showStats, setShowStats] = useState(false);
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState(0);
    /** Restoring a saved daily game must not re-count it in the stats. */
    const [restored, setRestored] = useState(false);

    const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const submittingRef = useRef(false);
    const statusRef = useRef<GameStatus>('playing');
    const currentRef = useRef('');
    const rowsRef = useRef<Row[]>([]);

    useEffect(() => { statusRef.current = status; }, [status]);
    useEffect(() => { currentRef.current = current; }, [current]);
    useEffect(() => { rowsRef.current = rows; }, [rows]);

    const isDaily = mode === 'daily';

    /*
     * Bootstrap: fetch today's puzzle, then read localStorage. Both reads happen
     * after an await rather than in the effect body, and restoring only runs
     * once the puzzle id is known, so there is no race between the two.
     */
    useEffect(() => {
        let cancelled = false;

        (async () => {
            let data: PuzzleMeta;
            try {
                const res = await fetch('/api/wordle');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                data = (await res.json()) as PuzzleMeta;
            } catch {
                if (!cancelled) setMessage('Không tải được câu đố, thử lại sau');
                return;
            }
            if (cancelled) return;

            setMeta(data);
            setCountdown(data.msUntilNext);
            setStats(readStats());

            // Resume a daily game left half-finished.
            try {
                const raw = window.localStorage.getItem(dailyKey(data.puzzleId));
                if (!raw) return;
                const saved = JSON.parse(raw) as {
                    rows: Row[];
                    status: GameStatus;
                    answer: string | null;
                };
                if (!Array.isArray(saved.rows) || saved.rows.length === 0) return;
                const savedStatus = saved.status ?? 'playing';
                setRows(saved.rows);
                setStatus(savedStatus);
                setAnswer(saved.answer ?? null);
                // Only an already-finished game is "restored" for stats purposes.
                // Resuming one still in progress must count when it ends.
                setRestored(savedStatus !== 'playing');
            } catch {
                /* corrupted entry — just start fresh */
            }
        })();

        return () => { cancelled = true; };
    }, []);

    /* ── persist the daily game ── */
    useEffect(() => {
        if (!meta || !isDaily || rows.length === 0) return;
        try {
            window.localStorage.setItem(
                dailyKey(meta.puzzleId),
                JSON.stringify({ rows, status, answer }),
            );
        } catch {
            /* storage full or blocked — the game still works, just not resumable */
        }
    }, [meta, isDaily, rows, status, answer]);

    /* ── countdown to the next daily puzzle ── */
    useEffect(() => {
        if (!meta) return;
        const id = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [meta]);

    const flashMessage = useCallback((text: string) => {
        setMessage(text);
        if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
        messageTimerRef.current = setTimeout(() => setMessage(null), 2000);
    }, []);

    useEffect(() => () => {
        if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    }, []);

    const recordStats = useCallback((won: boolean, guessCount: number) => {
        setStats(prev => {
            const next: Stats = {
                played: prev.played + 1,
                won: prev.won + (won ? 1 : 0),
                streak: won ? prev.streak + 1 : 0,
                maxStreak: won ? Math.max(prev.maxStreak, prev.streak + 1) : prev.maxStreak,
                distribution: prev.distribution.map((n, i) =>
                    won && i === guessCount - 1 ? n + 1 : n
                ),
            };
            try {
                window.localStorage.setItem(STATS_KEY, JSON.stringify(next));
            } catch {
                /* ignore */
            }
            return next;
        });
    }, []);

    /* ── submit a guess ── */
    const submitGuess = useCallback(async () => {
        if (submittingRef.current) return;
        if (statusRef.current !== 'playing') return;

        const guess = currentRef.current.toLowerCase();
        if (guess.length !== WORD_LENGTH) {
            flashMessage(`Cần đủ ${WORD_LENGTH} chữ cái`);
            setShakeRow(true);
            setTimeout(() => setShakeRow(false), 450);
            return;
        }

        submittingRef.current = true;
        setSubmitting(true);
        const guessNumber = rowsRef.current.length + 1;

        try {
            const res = await fetch('/api/wordle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guess,
                    seed: isDaily ? null : practiceSeed,
                    guessNumber,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (!data.valid) {
                flashMessage(data.message ?? 'Từ không hợp lệ');
                setShakeRow(true);
                setTimeout(() => setShakeRow(false), 450);
                return;
            }

            const nextRows = [...rowsRef.current, { guess, result: data.result as TileState[] }];
            setRows(nextRows);
            setCurrent('');

            if (data.isWin) {
                setStatus('won');
                setAnswer(data.answer ?? guess);
                if (!restored) recordStats(true, guessNumber);
            } else if (guessNumber >= MAX_GUESSES) {
                setStatus('lost');
                setAnswer(data.answer ?? null);
                if (!restored) recordStats(false, guessNumber);
            }
        } catch {
            flashMessage('Mất kết nối — thử lại');
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    }, [flashMessage, isDaily, practiceSeed, recordStats, restored]);

    /* ── key handling (shared by the physical and on-screen keyboards) ── */
    const handleKey = useCallback((raw: string) => {
        if (statusRef.current !== 'playing' || submittingRef.current) return;
        const key = raw.toLowerCase();

        if (key === 'enter') {
            void submitGuess();
            return;
        }
        if (key === 'backspace') {
            setCurrent(prev => prev.slice(0, -1));
            return;
        }
        if (/^[a-z]$/.test(key)) {
            setCurrent(prev => (prev.length >= WORD_LENGTH ? prev : prev + key));
        }
    }, [submitGuess]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
                handleKey(e.key);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleKey]);

    /* ── derived: best known state per letter, for the keyboard ── */
    const letterStates = useMemo(() => {
        const rank: Record<TileState, number> = { absent: 0, present: 1, correct: 2 };
        const map: Record<string, TileState> = {};
        for (const row of rows) {
            row.guess.split('').forEach((letter, i) => {
                const state = row.result[i];
                if (!map[letter] || rank[state] > rank[map[letter]]) map[letter] = state;
            });
        }
        return map;
    }, [rows]);

    const startPractice = useCallback(() => {
        setMode('practice');
        setPracticeSeed(Math.floor(Math.random() * 1_000_000));
        setRows([]);
        setCurrent('');
        setStatus('playing');
        setAnswer(null);
        setRestored(false);
        setShowStats(false);
        setCopied(false);
    }, []);

    const backToDaily = useCallback(() => {
        setMode('daily');
        setPracticeSeed(null);
        setRows([]);
        setCurrent('');
        setStatus('playing');
        setAnswer(null);
        setRestored(false);
        setShowStats(false);
        setCopied(false);
    }, []);

    const shareText = useMemo(() => {
        if (!meta || status === 'playing') return '';
        const title = isDaily
            ? `OmniPlay Wordle #${meta.puzzleId}`
            : 'OmniPlay Wordle (tự do)';
        const score = status === 'won' ? `${rows.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
        const grid = rows
            .map(row => row.result.map(state => SHARE_EMOJI[state]).join(''))
            .join('\n');
        return `${title} ${score}\n\n${grid}`;
    }, [meta, status, isDaily, rows]);

    const handleShare = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            flashMessage('Trình duyệt chặn clipboard');
        }
    }, [shareText, flashMessage]);

    const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
    const maxDistribution = Math.max(1, ...stats.distribution);

    /* ── render helpers ── */
    const renderGrid = () => {
        const gridRows = Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
            const filled = rows[rowIndex];
            const isCurrentRow = rowIndex === rows.length && status === 'playing';
            const letters = filled
                ? filled.guess.split('')
                : isCurrentRow
                    ? current.padEnd(WORD_LENGTH, ' ').split('')
                    : Array(WORD_LENGTH).fill(' ');

            return (
                <motion.div
                    key={rowIndex}
                    className="flex gap-1.5 justify-center"
                    animate={isCurrentRow && shakeRow ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {letters.map((letter, i) => {
                        const state = filled?.result[i];
                        const hasLetter = letter !== ' ';
                        return (
                            <motion.div
                                key={i}
                                className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 text-2xl font-black uppercase select-none ${state
                                    ? TILE_CLASS[state]
                                    : hasLetter
                                        ? 'bg-transparent border-muted-foreground/40 text-foreground'
                                        : 'bg-transparent border-border text-foreground'
                                    }`}
                                initial={false}
                                animate={
                                    state
                                        ? { rotateX: [90, 0], scale: 1 }
                                        : hasLetter
                                            ? { scale: [1.1, 1] }
                                            : { scale: 1 }
                                }
                                transition={
                                    state
                                        ? { duration: 0.35, delay: i * 0.12 }
                                        : { duration: 0.1 }
                                }
                            >
                                {hasLetter ? letter : ''}
                            </motion.div>
                        );
                    })}
                </motion.div>
            );
        });

        return <div className="flex flex-col gap-1.5">{gridRows}</div>;
    };

    const renderKeyboard = () => (
        <div className="flex flex-col gap-1.5 w-full max-w-lg">
            {KEYBOARD_ROWS.map((row, i) => (
                <div key={i} className="flex gap-1.5 justify-center">
                    {row.map(key => {
                        const isAction = key === 'enter' || key === 'backspace';
                        const state = letterStates[key];
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleKey(key)}
                                disabled={status !== 'playing' || submitting}
                                className={`flex items-center justify-center h-12 rounded-lg border font-semibold uppercase transition-colors disabled:opacity-50 ${isAction ? 'px-3 text-[11px] grow-0' : 'flex-1 text-sm'
                                    } ${state && !isAction
                                        ? KEY_CLASS[state]
                                        : 'bg-card border-border text-foreground hover:bg-muted'
                                    }`}
                            >
                                {key === 'backspace' ? (
                                    <Delete className="w-4 h-4" />
                                ) : key === 'enter' ? (
                                    'Enter'
                                ) : (
                                    key
                                )}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );

    /* ─────────────────────── Render ─────────────────────── */

    return (
        <div
            className="relative w-full overflow-hidden bg-background text-foreground"
            style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
        >
            {/* HUD portalled into the global header */}
            <GameHud>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Wordle</span>
                        {meta && (
                            <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                                {isDaily ? `#${meta.puzzleId}` : 'Tự do'}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                            {Math.min(rows.length + (status === 'playing' ? 1 : 0), MAX_GUESSES)}/{MAX_GUESSES}
                        </span>
                        {stats.streak > 0 && (
                            <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                <Flame className="w-3.5 h-3.5" />
                                {stats.streak}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowStats(true)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            title="Thống kê"
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </GameHud>

            <div className="h-full flex flex-col items-center justify-between gap-3 py-4 px-3">
                {/* Message banner */}
                <div className="h-8 flex items-center">
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                key={message}
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold"
                            >
                                {message}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Grid */}
                {meta ? renderGrid() : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải câu đố…
                    </div>
                )}

                {/* Result panel */}
                <div className="w-full max-w-lg min-h-[72px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {status !== 'playing' ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="w-full bg-card/70 border border-border rounded-2xl p-3 space-y-2.5"
                            >
                                <p className="text-center text-sm">
                                    {status === 'won' ? (
                                        <span className="font-bold text-emerald-400">
                                            Chính xác trong {rows.length}/{MAX_GUESSES} lượt!
                                        </span>
                                    ) : (
                                        <>
                                            <span className="font-bold text-red-400">Hết lượt. </span>
                                            Đáp án:{' '}
                                            <span className="font-mono font-black uppercase tracking-widest">
                                                {answer ?? '?????'}
                                            </span>
                                        </>
                                    )}
                                </p>

                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleShare}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? 'Đã chép!' : 'Chia sẻ kết quả'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={startPractice}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-xs font-semibold hover:bg-muted transition-colors"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Chơi tự do
                                    </button>
                                    {!isDaily && (
                                        <button
                                            type="button"
                                            onClick={backToDaily}
                                            className="px-3 py-2 rounded-xl bg-card border border-border text-xs font-semibold hover:bg-muted transition-colors"
                                        >
                                            Về câu đố hôm nay
                                        </button>
                                    )}
                                </div>

                                {isDaily && (
                                    <p className="text-center text-[11px] text-muted-foreground">
                                        Câu đố mới sau{' '}
                                        <span className="font-mono tabular-nums">{formatCountdown(countdown)}</span>
                                    </p>
                                )}
                            </motion.div>
                        ) : (
                            <motion.p
                                key="hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-[11px] text-center text-muted-foreground/70 max-w-sm leading-relaxed"
                            >
                                Đoán từ tiếng Anh {WORD_LENGTH} chữ cái trong {MAX_GUESSES} lượt.{' '}
                                <span className="text-emerald-400 font-semibold">Xanh</span> = đúng chữ đúng vị trí,{' '}
                                <span className="text-amber-400 font-semibold">vàng</span> = đúng chữ sai vị trí.
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {/* Keyboard */}
                {renderKeyboard()}
            </div>

            {/* Stats modal */}
            <AnimatePresence>
                {showStats && (
                    <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowStats(false)}
                    >
                        <motion.div
                            className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 space-y-5"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-lg font-black text-center">Thống kê</h2>

                            <div className="grid grid-cols-4 gap-2 text-center">
                                {[
                                    { label: 'Đã chơi', value: stats.played },
                                    { label: 'Thắng %', value: winRate },
                                    { label: 'Chuỗi', value: stats.streak },
                                    { label: 'Dài nhất', value: stats.maxStreak },
                                ].map(item => (
                                    <div key={item.label}>
                                        <p className="text-2xl font-black tabular-nums">{item.value}</p>
                                        <p className="text-[10px] text-muted-foreground leading-tight">{item.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Số lượt để thắng
                                </p>
                                {stats.distribution.map((count, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="w-3 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                                        <div className="flex-1 bg-muted rounded-sm h-5 overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-600 flex items-center justify-end px-1.5 text-[10px] font-bold text-white"
                                                style={{ width: `${Math.max(8, (count / maxDistribution) * 100)}%` }}
                                            >
                                                {count}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowStats(false)}
                                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Đóng
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
