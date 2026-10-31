import {
  getBrowserStorage,
  isPlainObject,
  readJson,
  storageKey,
  writeJson,
  type KeyValueStore,
} from './safe-storage';
import { isValidScore } from './high-scores';

export const DAILY_PROGRESS_KEY = storageKey('daily');
export const DAILY_HISTORY_LIMIT = 14;

export interface DailyEntry {
  best: number;
  completed: boolean;
}

export type DailyProgress = Record<string, DailyEntry>;

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isDailyEntry(value: unknown): value is DailyEntry {
  return isPlainObject(value) && isValidScore(value.best) && typeof value.completed === 'boolean';
}

function isDailyProgressShape(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value);
}

export function loadDailyProgress(store: KeyValueStore | null = getBrowserStorage()): DailyProgress {
  const raw = readJson(store, DAILY_PROGRESS_KEY, isDailyProgressShape);
  const result: DailyProgress = {};
  if (!raw) return result;
  for (const [date, entry] of Object.entries(raw)) {
    if (DATE_KEY_PATTERN.test(date) && isDailyEntry(entry)) result[date] = entry;
  }
  return result;
}

export function getDailyEntry(dateKey: string, store: KeyValueStore | null = getBrowserStorage()): DailyEntry | null {
  return loadDailyProgress(store)[dateKey] ?? null;
}

export function updateDailyEntry(
  dateKey: string,
  update: { score: number; completed: boolean },
  store: KeyValueStore | null = getBrowserStorage(),
): DailyEntry {
  const progress = loadDailyProgress(store);
  const previous = progress[dateKey] ?? { best: 0, completed: false };
  const score = isValidScore(update.score) ? update.score : 0;
  const next: DailyEntry = {
    best: Math.max(previous.best, score),
    completed: previous.completed || update.completed,
  };
  progress[dateKey] = next;

  const trimmed: DailyProgress = {};
  for (const date of Object.keys(progress).sort().slice(-DAILY_HISTORY_LIMIT)) {
    trimmed[date] = progress[date]!;
  }
  writeJson(store, DAILY_PROGRESS_KEY, trimmed);
  return next;
}
