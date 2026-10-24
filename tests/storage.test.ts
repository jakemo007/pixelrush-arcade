import { describe, expect, it } from 'vitest';
import {
  DAILY_HISTORY_LIMIT,
  DAILY_PROGRESS_KEY,
  getDailyEntry,
  loadDailyProgress,
  updateDailyEntry,
} from '@/lib/storage/daily-progress';
import {
  isNewPersonalBest,
  isValidScore,
  loadPersonalBest,
  MAX_SCORE,
  personalBestKey,
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
    // Games are stored separately under versioned keys.
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
    // A corrupt value is replaced by the next real score.
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

describe('daily progress', () => {
  it('records the best challenge score and completion per date', () => {
    const store = new MemoryStore();
    updateDailyEntry('2026-10-24', { score: 300, completed: false }, store);
    updateDailyEntry('2026-10-24', { score: 200, completed: true }, store);
    expect(getDailyEntry('2026-10-24', store)).toEqual({ best: 300, completed: true });
    // Completion is never undone by a later, worse run.
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
