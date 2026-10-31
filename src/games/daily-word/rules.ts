import { FIVE_LETTER_WORDS } from '@/games/words/five-letter';
import { ANSWERS } from './answers';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;
const MS_PER_DAY = 86_400_000;

export const DAILY_EPOCH = '2026-10-24';

export type LetterState = 'correct' | 'present' | 'absent';

let guessSet: Set<string> | null = null;
function validGuesses(): Set<string> {
  guessSet ??= new Set(FIVE_LETTER_WORDS);
  return guessSet;
}

export function isValidGuess(word: string): boolean {
  return validGuesses().has(word.toLowerCase());
}

export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  if (g.length !== a.length) throw new Error('Guess and answer must have the same length');
  const result: LetterState[] = new Array<LetterState>(g.length).fill('absent');
  const unmatched = new Map<string, number>();
  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) result[i] = 'correct';
    else unmatched.set(a[i]!, (unmatched.get(a[i]!) ?? 0) + 1);
  }
  for (let i = 0; i < g.length; i++) {
    if (result[i] === 'correct') continue;
    const left = unmatched.get(g[i]!) ?? 0;
    if (left > 0) {
      result[i] = 'present';
      unmatched.set(g[i]!, left - 1);
    }
  }
  return result;
}

const RANK: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 };

export function keyboardStates(guesses: readonly string[], answer: string): Record<string, LetterState> {
  const states: Record<string, LetterState> = {};
  for (const guess of guesses) {
    const evaluation = evaluateGuess(guess, answer);
    evaluation.forEach((state, i) => {
      const letter = guess[i]!.toLowerCase();
      const prev = states[letter];
      if (!prev || RANK[state] > RANK[prev]) states[letter] = state;
    });
  }
  return states;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export function statusOf(guesses: readonly string[], answer: string): GameStatus {
  if (guesses.some((g) => g.toLowerCase() === answer.toLowerCase())) return 'won';
  return guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
}

export function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function utcDayNumber(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}

function dateKeyToDayNumber(key: string): number {
  return Math.floor(Date.parse(`${key}T00:00:00Z`) / MS_PER_DAY);
}

const EPOCH_DAY = dateKeyToDayNumber(DAILY_EPOCH);

export interface DailyPuzzle {
  dateKey: string;
  dayNumber: number;
  puzzleNumber: number;
  answer: string;
}

export function getDailyPuzzle(date: Date = new Date()): DailyPuzzle {
  const dayNumber = utcDayNumber(date);
  const index = dayNumber - EPOCH_DAY;
  const n = ANSWERS.length;
  return {
    dateKey: toUtcDateKey(date),
    dayNumber,
    puzzleNumber: index + 1,
    answer: ANSWERS[((index % n) + n) % n]!,
  };
}

export function msUntilNextWord(now: Date = new Date()): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime();
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export interface DailySave {
  version: 1;
  dateKey: string;
  guesses: string[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function dailySaveValidator(answer: string) {
  return (value: unknown): value is DailySave => {
    if (!isRecord(value) || value.version !== 1 || typeof value.dateKey !== 'string') return false;
    const guesses = value.guesses;
    if (!Array.isArray(guesses) || guesses.length > MAX_GUESSES) return false;
    for (let i = 0; i < guesses.length; i++) {
      const g: unknown = guesses[i];
      if (typeof g !== 'string' || !/^[a-z]{5}$/.test(g) || !isValidGuess(g)) return false;
      if (g === answer && i !== guesses.length - 1) return false;
    }
    return true;
  };
}

export interface WordStats {
  version: 1;
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
  lastPlayedDay: number | null;
  lastWonDay: number | null;
}

export function emptyStats(): WordStats {
  return {
    version: 1,
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
    lastPlayedDay: null,
    lastWonDay: null,
  };
}

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1e7;
const isDayOrNull = (v: unknown): v is number | null => v === null || isCount(v);

export function isWordStats(value: unknown): value is WordStats {
  if (!isRecord(value) || value.version !== 1) return false;
  const { played, wins, currentStreak, maxStreak, distribution, lastPlayedDay, lastWonDay } = value;
  if (![played, wins, currentStreak, maxStreak].every(isCount)) return false;
  if (!Array.isArray(distribution) || distribution.length !== MAX_GUESSES || !distribution.every(isCount)) return false;
  if (!isDayOrNull(lastPlayedDay) || !isDayOrNull(lastWonDay)) return false;
  const w = wins as number;
  return w <= (played as number) && (currentStreak as number) <= (maxStreak as number) && (distribution as number[]).reduce((a, b) => a + b, 0) === w;
}

export function recordDailyResult(stats: WordStats, dayNumber: number, won: boolean, guessCount: number): WordStats {
  if (stats.lastPlayedDay !== null && dayNumber <= stats.lastPlayedDay) return stats;
  const next: WordStats = { ...stats, distribution: [...stats.distribution], played: stats.played + 1, lastPlayedDay: dayNumber };
  if (won) {
    const slot = Math.min(MAX_GUESSES, Math.max(1, guessCount)) - 1;
    next.wins += 1;
    next.distribution[slot] = (next.distribution[slot] ?? 0) + 1;
    next.currentStreak = stats.lastWonDay === dayNumber - 1 ? stats.currentStreak + 1 : 1;
    next.maxStreak = Math.max(next.maxStreak, next.currentStreak);
    next.lastWonDay = dayNumber;
  } else {
    next.currentStreak = 0;
  }
  return next;
}

export function displayedStreak(stats: WordStats, today: number): number {
  if (stats.lastWonDay === null) return 0;
  return today - stats.lastWonDay <= 1 ? stats.currentStreak : 0;
}

export function winPercent(stats: WordStats): number {
  return stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
}

const EMOJI: Record<LetterState, string> = { correct: '\u{1F7E9}', present: '\u{1F7E8}', absent: '⬛' };

export function shareText(puzzleNumber: number, guesses: readonly string[], answer: string): string {
  const won = statusOf(guesses, answer) === 'won';
  const rows = guesses.map((g) =>
    evaluateGuess(g, answer)
      .map((s) => EMOJI[s])
      .join(''),
  );
  return [`PixelRush Daily Word #${puzzleNumber} ${won ? guesses.length : 'X'}/${MAX_GUESSES}`, ...rows].join('\n');
}

export function winTitle(guessCount: number): string {
  return ['Incredible!', 'Brilliant!', 'Excellent!', 'Nicely done!', 'Good save!', 'Phew, just in time!'][guessCount - 1] ?? 'Solved!';
}
