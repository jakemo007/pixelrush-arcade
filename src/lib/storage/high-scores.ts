import { isGameId, type GameId } from '@/config/games';
import {
  getBrowserStorage,
  isPlainObject,
  readJson,
  storageKey,
  writeJson,
  type KeyValueStore,
} from './safe-storage';

export const MAX_SCORE = 10_000_000;

export type BestDirection = 'higher' | 'lower';

export interface PersonalBestRecord {
  score: number;
  achievedAt: string;
}

const VARIANT_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/;

export function isValidScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_SCORE;
}

export function isValidVariant(value: unknown): value is string {
  return typeof value === 'string' && VARIANT_PATTERN.test(value);
}

export function isPersonalBestRecord(value: unknown): value is PersonalBestRecord {
  return isPlainObject(value) && isValidScore(value.score) && typeof value.achievedAt === 'string';
}

export function isNewPersonalBest(score: number, previousBest: number): boolean {
  return isValidScore(score) && score > 0 && score > previousBest;
}

export function isBetterResult(value: number, previous: number | null, direction: BestDirection): boolean {
  if (!isValidScore(value) || value <= 0) return false;
  if (previous === null) return true;
  return direction === 'higher' ? value > previous : value < previous;
}

export function personalBestKey(gameId: GameId, variant?: string): string {
  return storageKey(variant ? `best:${gameId}:${variant}` : `best:${gameId}`);
}

export function loadBest(gameId: GameId, variant?: string, store: KeyValueStore | null = getBrowserStorage()): number | null {
  if (!isGameId(gameId) || (variant !== undefined && !isValidVariant(variant))) return null;
  const record = readJson(store, personalBestKey(gameId, variant), isPersonalBestRecord);
  return record && record.score > 0 ? record.score : null;
}

export function loadPersonalBest(gameId: GameId, store: KeyValueStore | null = getBrowserStorage()): number {
  return loadBest(gameId, undefined, store) ?? 0;
}

export interface SaveResult {
  best: number;
  isNewBest: boolean;
  persisted: boolean;
}

export interface RecordBestOptions {
  direction: BestDirection;
  variant?: string;
  store?: KeyValueStore | null;
  now?: Date;
}

export function recordBest(gameId: GameId, value: number, options: RecordBestOptions): SaveResult {
  const store = options.store === undefined ? getBrowserStorage() : options.store;
  const variant = options.variant !== undefined && isValidVariant(options.variant) ? options.variant : undefined;
  const previous = loadBest(gameId, variant, store);
  if (!isBetterResult(value, previous, options.direction)) {
    return { best: previous ?? 0, isNewBest: false, persisted: store !== null };
  }
  const record: PersonalBestRecord = { score: value, achievedAt: (options.now ?? new Date()).toISOString() };
  const persisted = writeJson(store, personalBestKey(gameId, variant), record);
  return { best: value, isNewBest: true, persisted };
}

export function recordScore(
  gameId: GameId,
  score: number,
  store: KeyValueStore | null = getBrowserStorage(),
  now: Date = new Date(),
): SaveResult {
  return recordBest(gameId, score, { direction: 'higher', store, now });
}
