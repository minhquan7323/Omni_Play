import {
    ANSWERS,
    MAX_GUESSES,
    VALID_GUESSES,
    WORD_LENGTH,
    answerFor,
    currentPuzzleId,
    msUntilNextPuzzle,
    puzzleDate,
    scoreGuess,
} from './wordle';

/**
 * Guesses are scored on the server so the answer is never in the client bundle.
 * The route stays stateless: the daily puzzle is derived from the date, and a
 * practice game carries its own `seed`, which the client keeps for the session.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
    const puzzleId = currentPuzzleId();
    return Response.json({
        puzzleId,
        date: puzzleDate(puzzleId),
        wordLength: WORD_LENGTH,
        maxGuesses: MAX_GUESSES,
        answerCount: ANSWERS.length,
        msUntilNext: msUntilNextPuzzle(),
    });
}

interface GuessBody {
    guess?: unknown;
    /** Omit (or null) for today's daily puzzle; any number starts a practice game. */
    seed?: unknown;
    /** 1-based. Used only to decide whether the answer may be revealed. */
    guessNumber?: unknown;
}

export async function POST(request: Request) {
    let body: GuessBody;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Body phải là JSON' }, { status: 400 });
    }

    const guess = typeof body.guess === 'string' ? body.guess.trim().toLowerCase() : '';

    if (guess.length !== WORD_LENGTH || !/^[a-z]+$/.test(guess)) {
        return Response.json({
            valid: false,
            reason: 'length',
            message: `Từ phải có đúng ${WORD_LENGTH} chữ cái a-z`,
        });
    }

    if (!VALID_GUESSES.has(guess)) {
        return Response.json({
            valid: false,
            reason: 'not-a-word',
            message: 'Không có từ này trong từ điển',
        });
    }

    const seed = typeof body.seed === 'number' && Number.isFinite(body.seed)
        ? Math.floor(body.seed)
        : currentPuzzleId();

    const answer = answerFor(seed);
    const result = scoreGuess(guess, answer);
    const isWin = guess === answer;

    const guessNumber = typeof body.guessNumber === 'number' && Number.isFinite(body.guessNumber)
        ? Math.floor(body.guessNumber)
        : 1;
    const isLastGuess = guessNumber >= MAX_GUESSES;

    return Response.json({
        valid: true,
        result,
        isWin,
        // Only revealed once the game is over, so a mid-game response cannot spoil it.
        ...(isWin || isLastGuess ? { answer } : {}),
    });
}
