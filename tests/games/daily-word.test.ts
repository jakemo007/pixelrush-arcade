import { describe, expect, it } from 'vitest';
import { ANSWERS, ANSWER_SOURCE } from '@/games/daily-word/answers';
import {
  DAILY_EPOCH,
  MAX_GUESSES,
  dailySaveValidator,
  displayedStreak,
  emptyStats,
  evaluateGuess,
  formatCountdown,
  getDailyPuzzle,
  isValidGuess,
  isWordStats,
  keyboardStates,
  msUntilNextWord,
  recordDailyResult,
  shareText,
  statusOf,
  winPercent,
  type WordStats,
} from '@/games/daily-word/rules';
import { FIVE_LETTER_WORDS } from '@/games/words/five-letter';
import { createGameStorage } from '@/lib/storage/game-data';
import { MemoryStore } from '../helpers';

const code = (guess: string, answer: string) =>
  evaluateGuess(guess, answer)
    .map((s) => (s === 'correct' ? 'G' : s === 'present' ? 'Y' : '.'))
    .join('');

describe('evaluateGuess', () => {
  it('marks exact, misplaced and missing letters', () => {
    expect(code('crane', 'crane')).toBe('GGGGG');
    expect(code('trace', 'crane')).toBe('.GGYG');
    expect(code('react', 'crane')).toBe('YYGY.');
    expect(code('ghost', 'crane')).toBe('.....');
  });

  it('handles duplicate letters with the two-pass rule (hand-checked cases)', () => {
    const cases: [guess: string, answer: string, expected: string][] = [
      ['geese', 'crane', '....G'],
      ['eerie', 'lever', 'YGY..'],
      ['bobby', 'abbey', 'Y.G.G'],
      ['kebab', 'abbey', '.YGYY'],
      ['speed', 'abide', '..Y.Y'],
      ['speed', 'erase', 'Y.YY.'],
      ['lolly', 'hello', '.YGG.'],
      ['hello', 'lolly', '..GGY'],
      ['mamma', 'llama', '.Y.GG'],
      ['sassy', 'class', 'YY.G.'],
      ['allee', 'apple', 'GY..G'],
    ];
    for (const [guess, answer, expected] of cases) {
      expect(code(guess, answer), `${guess} vs ${answer}`).toBe(expected);
    }
  });

  it('is case-insensitive and rejects length mismatches', () => {
    expect(code('CRANE', 'crane')).toBe('GGGGG');
    expect(() => evaluateGuess('cran', 'crane')).toThrow();
  });

  it('keeps the best known state of each letter for the keyboard', () => {
    const states = keyboardStates(['stare', 'crane'], 'crane');
    expect(states.c).toBe('correct');
    expect(states.r).toBe('correct');
    expect(states.a).toBe('correct');
    expect(states.s).toBe('absent');
    expect(states.t).toBe('absent');
    expect(states.e).toBe('correct');
    expect(keyboardStates(['react', 'crane'], 'crane').r).toBe('correct');
    expect(keyboardStates(['crane', 'react'], 'crane').r).toBe('correct');
  });

  it('derives the game status', () => {
    expect(statusOf([], 'crane')).toBe('playing');
    expect(statusOf(['stare', 'crane'], 'crane')).toBe('won');
    expect(statusOf(Array(MAX_GUESSES).fill('stare'), 'crane')).toBe('lost');
  });
});

describe('word lists', () => {
  it('has a large, clean valid-guess list', () => {
    expect(FIVE_LETTER_WORDS.length).toBeGreaterThan(3000);
    expect(new Set(FIVE_LETTER_WORDS).size).toBe(FIVE_LETTER_WORDS.length);
    for (const w of FIVE_LETTER_WORDS) expect(w).toMatch(/^[a-z]{5}$/);
  });

  it('has enough unique answers for over two years, all valid guesses', () => {
    expect(ANSWER_SOURCE.length).toBeGreaterThanOrEqual(730);
    expect(new Set(ANSWER_SOURCE).size).toBe(ANSWER_SOURCE.length);
    const guesses = new Set(FIVE_LETTER_WORDS);
    for (const w of ANSWER_SOURCE) {
      expect(w).toMatch(/^[a-z]{5}$/);
      expect(guesses.has(w), w).toBe(true);
      expect(isValidGuess(w)).toBe(true);
    }
  });

  it('orders answers with a fixed shuffle that is a permutation and not alphabetical', () => {
    expect([...ANSWER_SOURCE].sort()).toEqual([...ANSWER_SOURCE]);
    expect([...ANSWERS].sort()).toEqual([...ANSWER_SOURCE]);
    expect(ANSWERS).not.toEqual(ANSWER_SOURCE);
    expect(ANSWERS.slice(0, 3)).toEqual(['fifty', 'groom', 'condo']);
    expect(ANSWERS.length).toBe(ANSWER_SOURCE.length);
  });

  it('rejects non-words', () => {
    expect(isValidGuess('xqzzv')).toBe(false);
    expect(isValidGuess('abcde')).toBe(false);
    expect(isValidGuess('CRANE')).toBe(true);
  });
});

describe('daily puzzle', () => {
  it('gives the same word all through one UTC day and changes at 00:00 UTC', () => {
    const start = getDailyPuzzle(new Date('2026-11-03T00:00:00.000Z'));
    const noon = getDailyPuzzle(new Date('2026-11-03T12:34:56.000Z'));
    const end = getDailyPuzzle(new Date('2026-11-03T23:59:59.999Z'));
    const next = getDailyPuzzle(new Date('2026-11-04T00:00:00.000Z'));
    expect(noon).toEqual(start);
    expect(end).toEqual(start);
    expect(start.dateKey).toBe('2026-11-03');
    expect(next.dateKey).toBe('2026-11-04');
    expect(next.puzzleNumber).toBe(start.puzzleNumber + 1);
    expect(next.answer).not.toBe(start.answer);
  });

  it('uses the UTC date, not the local one', () => {
    const ny = new Date('2026-11-03T23:30:00-05:00');
    expect(getDailyPuzzle(ny).dateKey).toBe('2026-11-04');
  });

  it('numbers puzzles from the epoch', () => {
    expect(getDailyPuzzle(new Date(`${DAILY_EPOCH}T08:00:00Z`)).puzzleNumber).toBe(1);
    expect(getDailyPuzzle(new Date(`${DAILY_EPOCH}T08:00:00Z`)).answer).toBe(ANSWERS[0]);
    expect(ANSWERS).toContain(getDailyPuzzle(new Date('2020-01-01T00:00:00Z')).answer);
  });

  it('never repeats an answer within two years', () => {
    const seen = new Set<string>();
    const base = Date.parse(`${DAILY_EPOCH}T12:00:00Z`);
    for (let d = 0; d < 730; d++) seen.add(getDailyPuzzle(new Date(base + d * 86_400_000)).answer);
    expect(seen.size).toBe(730);
  });

  it('counts down to the next 00:00 UTC', () => {
    expect(msUntilNextWord(new Date('2026-11-03T23:59:59.000Z'))).toBe(1000);
    expect(msUntilNextWord(new Date('2026-11-03T00:00:00.000Z'))).toBe(86_400_000);
    expect(formatCountdown(3_661_000)).toBe('1:01:01');
    expect(formatCountdown(-5)).toBe('0:00:00');
  });
});

describe('statistics and streaks', () => {
  it('records wins, losses and the guess distribution', () => {
    let s = emptyStats();
    s = recordDailyResult(s, 100, true, 3);
    s = recordDailyResult(s, 101, true, 4);
    s = recordDailyResult(s, 102, false, 6);
    expect(s.played).toBe(3);
    expect(s.wins).toBe(2);
    expect(s.distribution).toEqual([0, 0, 1, 1, 0, 0]);
    expect(s.currentStreak).toBe(0);
    expect(s.maxStreak).toBe(2);
    expect(winPercent(s)).toBe(67);
    expect(isWordStats(s)).toBe(true);
  });

  it('extends streaks on consecutive days and restarts after a gap', () => {
    let s = emptyStats();
    s = recordDailyResult(s, 10, true, 2);
    s = recordDailyResult(s, 11, true, 2);
    s = recordDailyResult(s, 12, true, 5);
    expect(s.currentStreak).toBe(3);
    s = recordDailyResult(s, 14, true, 1);
    expect(s.currentStreak).toBe(1);
    expect(s.maxStreak).toBe(3);
  });

  it('counts each day only once', () => {
    let s = recordDailyResult(emptyStats(), 50, true, 2);
    const again = recordDailyResult(s, 50, true, 2);
    expect(again).toBe(s);
    s = recordDailyResult(s, 49, true, 2);
    expect(s.played).toBe(1);
  });

  it('shows a broken streak as zero once a day is missed', () => {
    const s = recordDailyResult(recordDailyResult(emptyStats(), 20, true, 3), 21, true, 3);
    expect(displayedStreak(s, 21)).toBe(2);
    expect(displayedStreak(s, 22)).toBe(2);
    expect(displayedStreak(s, 23)).toBe(0);
    expect(displayedStreak(emptyStats(), 5)).toBe(0);
  });
});

describe('persistence', () => {
  const answer = 'crane';
  const validate = dailySaveValidator(answer);

  it('accepts a well-formed board', () => {
    expect(validate({ version: 1, dateKey: '2026-11-03', guesses: [] })).toBe(true);
    expect(validate({ version: 1, dateKey: '2026-11-03', guesses: ['stare', 'crane'] })).toBe(true);
  });

  it('rejects malformed or impossible boards', () => {
    const bad: unknown[] = [
      null,
      'crane',
      [],
      { version: 2, dateKey: '2026-11-03', guesses: [] },
      { version: 1, guesses: [] },
      { version: 1, dateKey: '2026-11-03', guesses: 'stare' },
      { version: 1, dateKey: '2026-11-03', guesses: ['STARE'] },
      { version: 1, dateKey: '2026-11-03', guesses: ['xqzzv'] },
      { version: 1, dateKey: '2026-11-03', guesses: ['star'] },
      { version: 1, dateKey: '2026-11-03', guesses: [42] },
      { version: 1, dateKey: '2026-11-03', guesses: Array(7).fill('stare') },
      { version: 1, dateKey: '2026-11-03', guesses: ['crane', 'stare'] },
    ];
    for (const value of bad) expect(validate(value), JSON.stringify(value)).toBe(false);
  });

  it('rejects malformed stats', () => {
    const good: WordStats = recordDailyResult(emptyStats(), 1, true, 2);
    expect(isWordStats(good)).toBe(true);
    const bad: unknown[] = [
      null,
      { ...good, version: 2 },
      { ...good, played: -1 },
      { ...good, wins: 5 },
      { ...good, distribution: [0, 1, 0] },
      { ...good, distribution: [0, 2, 0, 0, 0, 0] },
      { ...good, currentStreak: 3 },
      { ...good, lastWonDay: 'yesterday' },
      { ...good, played: 1.5 },
    ];
    for (const value of bad) expect(isWordStats(value), JSON.stringify(value)).toBe(false);
  });

  it('round-trips through namespaced game storage and ignores corrupt JSON', () => {
    const store = new MemoryStore();
    const storage = createGameStorage('daily-word', store);
    storage.write('daily', { version: 1, dateKey: '2026-11-03', guesses: ['stare'] });
    expect(storage.read('daily', validate)?.guesses).toEqual(['stare']);
    store.setItem('pixelrush:v1:game:daily-word:daily', '{not json');
    expect(storage.read('daily', validate)).toBeNull();
    store.setItem('pixelrush:v1:game:daily-word:stats', JSON.stringify({ played: 'lots' }));
    expect(storage.read('stats', isWordStats)).toBeNull();
  });
});

describe('share text', () => {
  it('summarises the board without revealing letters', () => {
    const text = shareText(7, ['stare', 'crane'], 'crane');
    expect(text.split('\n')).toHaveLength(3);
    expect(text.startsWith('PixelRush Daily Word #7 2/6')).toBe(true);
    expect(text).not.toMatch(/crane|stare/i);
    expect(shareText(7, Array(6).fill('stare'), 'crane').split('\n')[0]).toContain('X/6');
  });
});
