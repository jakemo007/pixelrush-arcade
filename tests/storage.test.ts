import { describe, expect, it } from 'vitest';
import {
  DAILY_HISTORY_LIMIT,
  DAILY_PROGRESS_KEY,
  getDailyEntry,
  loadDailyProgress,
  updateDailyEntry,
} from '@/lib/storage/daily-progress';
import { createGameStorage, gameDataKey } from '@/lib/storage/game-data';
import {
  isBetterResult,
  isNewPersonalBest,
  isValidScore,
  isValidVariant,
  loadBest,
  loadPersonalBest,
  MAX_SCORE,
  personalBestKey,
  recordBest,
  recordScore,
} from '@/lib/storage/high-scores';
import { getBrowserStorage, readJson, STORAGE_PREFIX, writeJson } from '@/lib/storage/safe-storage';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, SETTINGS_KEY } from '@/lib/storage/settings';
import { MemoryStore, ThrowingStore } from './helpers';

describe('score validation', () => {
  it('accepts only whole, non-negative, plausible scores', () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(1234)).toBe(true);
    expect(isValidScore(MAX_SCORE)).toBe(true);
    for (const bad of [-1, 1.5, NaN, Infinity, MAX_SCORE + 1, '100', null, undefined, {}]) {
      expect(isValidScore(bad)).toBe(false);
    }
  });

  it('only counts strictly higher, positive scores as a new personal best', () => {
    expect(isNewPersonalBest(10, 0)).toBe(true);
    expect(isNewPersonalBest(10, 10)).toBe(false);
    expect(isNewPersonalBest(9, 10)).toBe(false);
    expect(isNewPersonalBest(0, 0)).toBe(false);
    expect(isNewPersonalBest(-5, 0)).toBe(false);
  });
});

describe('personal bests', () => {
  it('saves a new best and keeps the higher score', () => {
    const store = new MemoryStore();
    expect(loadPersonalBest('neon-dash', store)).toBe(0);
    expect(recordScore('neon-dash', 500, store)).toEqual({ best: 500, isNewBest: true, persisted: true });
    expect(recordScore('neon-dash', 300, store)).toEqual({ best: 500, isNewBest: false, persisted: true });
    expect(recordScore('neon-dash', 800, store).isNewBest).toBe(true);
    expect(loadPersonalBest('neon-dash', store)).toBe(800);
    expect(loadPersonalBest('brick-breaker', store)).toBe(0);
    expect(personalBestKey('neon-dash').startsWith(STORAGE_PREFIX)).toBe(true);
  });

  it('ignores corrupt or tampered data', () => {
    const store = new MemoryStore();
    const key = personalBestKey('space-survival');
    for (const raw of ['not json', '{"score":"999"}', '{"score":-4,"achievedAt":"x"}', '{"score":1e12,"achievedAt":"x"}', '[1,2]', 'null']) {
      store.setItem(key, raw);
      expect(loadPersonalBest('space-survival', store)).toBe(0);
    }
    expect(recordScore('space-survival', 50, store).isNewBest).toBe(true);
    expect(loadPersonalBest('space-survival', store)).toBe(50);
  });

  it('never throws when storage is unavailable or full', () => {
    const throwing = new ThrowingStore();
    expect(loadPersonalBest('neon-dash', throwing)).toBe(0);
    expect(recordScore('neon-dash', 100, throwing)).toEqual({ best: 100, isNewBest: true, persisted: false });
    expect(recordScore('neon-dash', 100, null)).toEqual({ best: 100, isNewBest: true, persisted: false });
    expect(readJson(throwing, 'k', (v): v is number => typeof v === 'number')).toBeNull();
    expect(writeJson(throwing, 'k', 1)).toBe(false);
  });

  it('reports no storage outside the browser', () => {
    expect(getBrowserStorage()).toBeNull();
  });
});

describe('generalised personal bests', () => {
  const now = new Date('2026-10-24T12:00:00Z');

  it('compares results in either direction and never counts zero', () => {
    expect(isBetterResult(5, null, 'higher')).toBe(true);
    expect(isBetterResult(5, null, 'lower')).toBe(true);
    expect(isBetterResult(0, null, 'lower')).toBe(false);
    expect(isBetterResult(0, null, 'higher')).toBe(false);
    expect(isBetterResult(4, 5, 'lower')).toBe(true);
    expect(isBetterResult(5, 5, 'lower')).toBe(false);
    expect(isBetterResult(6, 5, 'lower')).toBe(false);
    expect(isBetterResult(6, 5, 'higher')).toBe(true);
    expect(isBetterResult(1.5, null, 'lower')).toBe(false);
  });

  it('keeps the lowest time for lower-is-better games', () => {
    const store = new MemoryStore();
    expect(loadBest('car-racing', undefined, store)).toBeNull();
    expect(recordBest('car-racing', 95_000, { direction: 'lower', store, now })).toEqual({ best: 95_000, isNewBest: true, persisted: true });
    expect(recordBest('car-racing', 99_000, { direction: 'lower', store, now })).toEqual({ best: 95_000, isNewBest: false, persisted: true });
    expect(recordBest('car-racing', 90_500, { direction: 'lower', store, now }).isNewBest).toBe(true);
    expect(loadBest('car-racing', undefined, store)).toBe(90_500);
  });

  it('stores one best per variant, separate from the unvarianted key', () => {
    const store = new MemoryStore();
    recordBest('sudoku', 300_000, { direction: 'lower', variant: 'easy', store, now });
    recordBest('sudoku', 900_000, { direction: 'lower', variant: 'hard', store, now });
    expect(loadBest('sudoku', 'easy', store)).toBe(300_000);
    expect(loadBest('sudoku', 'hard', store)).toBe(900_000);
    expect(loadBest('sudoku', 'medium', store)).toBeNull();
    expect(loadBest('sudoku', undefined, store)).toBeNull();
    expect(personalBestKey('sudoku', 'easy')).toBe(`${STORAGE_PREFIX}best:sudoku:easy`);
  });

  it('rejects malformed variants instead of writing odd keys', () => {
    expect(isValidVariant('4x4')).toBe(true);
    expect(isValidVariant('2-suits')).toBe(true);
    for (const bad of ['', 'Hard', 'a b', '../x', '-x', 'x'.repeat(40), 3]) expect(isValidVariant(bad)).toBe(false);
    const store = new MemoryStore();
    expect(loadBest('sudoku', 'Bad Key', store)).toBeNull();
    recordBest('sudoku', 1000, { direction: 'lower', variant: 'Bad Key', store, now });
    expect([...store.data.keys()]).toEqual([personalBestKey('sudoku')]);
  });

  it('treats a stored zero as no record', () => {
    const store = new MemoryStore();
    store.setItem(personalBestKey('mini-golf'), JSON.stringify({ score: 0, achievedAt: 'x' }));
    expect(loadBest('mini-golf', undefined, store)).toBeNull();
    expect(recordBest('mini-golf', 30, { direction: 'lower', store, now }).isNewBest).toBe(true);
  });

  it('never throws for lower-is-better results when storage fails', () => {
    expect(recordBest('minesweeper', 1000, { direction: 'lower', variant: 'expert', store: new ThrowingStore(), now })).toEqual({
      best: 1000,
      isNewBest: true,
      persisted: false,
    });
  });
});

describe('per-game data storage', () => {
  it('namespaces keys by game and validates reads', () => {
    const store = new MemoryStore();
    const chess = createGameStorage('chess', store);
    const checkers = createGameStorage('checkers', store);
    const isStats = (v: unknown): v is { wins: number } =>
      typeof v === 'object' && v !== null && typeof (v as { wins?: unknown }).wins === 'number';
    expect(chess.write('stats', { wins: 3 })).toBe(true);
    expect(chess.read('stats', isStats)).toEqual({ wins: 3 });
    expect(checkers.read('stats', isStats)).toBeNull();
    expect(gameDataKey('chess', 'stats')).toBe(`${STORAGE_PREFIX}game:chess:stats`);
    store.setItem(gameDataKey('chess', 'stats'), '{"wins":"many"}');
    expect(chess.read('stats', isStats)).toBeNull();
    chess.remove('stats');
    expect(store.getItem(gameDataKey('chess', 'stats'))).toBeNull();
  });

  it('rejects invalid names and survives broken storage', () => {
    expect(() => gameDataKey('chess', 'Bad Name')).toThrow();
    const broken = createGameStorage('chess', new ThrowingStore());
    expect(broken.write('stats', { wins: 1 })).toBe(false);
    expect(broken.read('stats', (value): value is unknown => value !== undefined)).toBeNull();
    expect(() => broken.remove('stats')).not.toThrow();
    const none = createGameStorage('chess', null);
    expect(none.write('stats', 1)).toBe(false);
  });
});

describe('daily progress', () => {
  it('records the best challenge score and completion per date', () => {
    const store = new MemoryStore();
    updateDailyEntry('2026-10-24', { score: 300, completed: false }, store);
    updateDailyEntry('2026-10-24', { score: 200, completed: true }, store);
    expect(getDailyEntry('2026-10-24', store)).toEqual({ best: 300, completed: true });
    updateDailyEntry('2026-10-24', { score: 100, completed: false }, store);
    expect(getDailyEntry('2026-10-24', store)?.completed).toBe(true);
    expect(getDailyEntry('2026-10-25', store)).toBeNull();
  });

  it('keeps only the most recent days', () => {
    const store = new MemoryStore();
    for (let d = 1; d <= 30; d++) {
      updateDailyEntry(`2026-09-${String(d).padStart(2, '0')}`, { score: d, completed: false }, store);
    }
    const dates = Object.keys(loadDailyProgress(store)).sort();
    expect(dates.length).toBe(DAILY_HISTORY_LIMIT);
    expect(dates.at(-1)).toBe('2026-09-30');
  });

  it('drops malformed entries', () => {
    const store = new MemoryStore();
    store.setItem(
      DAILY_PROGRESS_KEY,
      JSON.stringify({ '2026-10-24': { best: 10, completed: true }, bogus: { best: 1, completed: true }, '2026-10-23': { best: -1, completed: 'yes' } }),
    );
    expect(loadDailyProgress(store)).toEqual({ '2026-10-24': { best: 10, completed: true } });
    store.setItem(DAILY_PROGRESS_KEY, '{{{');
    expect(loadDailyProgress(store)).toEqual({});
    expect(loadDailyProgress(new ThrowingStore())).toEqual({});
  });
});

describe('settings', () => {
  it('round-trips and falls back to defaults', () => {
    const store = new MemoryStore();
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
    saveSettings({ muted: true }, store);
    expect(loadSettings(store)).toEqual({ muted: true });
    store.setItem(SETTINGS_KEY, '{"muted":"yes"}');
    expect(loadSettings(store)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings({ muted: true }, new ThrowingStore())).toBe(false);
  });
});
