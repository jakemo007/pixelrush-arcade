/**
 * Personal-best scores, stored only in the player's own browser.
 * Nothing here is sent anywhere or verified by a server.
 */

import { isGameId, type GameId } from '@/config/games';
import {
  getBrowserStorage,
  isPlainObject,
  readJson,
  storageKey,
  writeJson,
  type KeyValueStore,
} from './safe-storage';

/** Scores above this are treated as corrupt/hand-edited rather than real. */
export const MAX_SCORE = 10_000_000;

export interface PersonalBestRecord {
  score: number;
  /** ISO timestamp of when the record was set. */
  achievedAt: string;
}

export function isValidScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_SCORE;
}

export function isPersonalBestRecord(value: unknown): value is PersonalBestRecord {
  return isPlainObject(value) && isValidScore(value.score) && typeof value.achievedAt === 'string';
}

/** A run only counts as a new personal best if it strictly beats the old one. */
export function isNewPersonalBest(score: number, previousBest: number): boolean {
  return isValidScore(score) && score > 0 && score > previousBest;
}

export function personalBestKey(gameId: GameId): string {
  return storageKey(`best:${gameId}`);
}

export function loadPersonalBest(gameId: GameId, store: KeyValueStore | null = getBrowserStorage()): number {
  if (!isGameId(gameId)) return 0;
  return readJson(store, personalBestKey(gameId), isPersonalBestRecord)?.score ?? 0;
}

export interface SaveResult {
  /** The best score after this run (old or new). */
  best: number;
  isNewBest: boolean;
  /** False when the browser refused the write (private mode, full storage...). */
  persisted: boolean;
}

export function recordScore(
  gameId: GameId,
  score: number,
  store: KeyValueStore | null = getBrowserStorage(),
  now: Date = new Date(),
): SaveResult {
  const previous = loadPersonalBest(gameId, store);
  if (!isNewPersonalBest(score, previous)) {
    return { best: previous, isNewBest: false, persisted: store !== null };
  }
  const record: PersonalBestRecord = { score, achievedAt: now.toISOString() };
  const persisted = writeJson(store, personalBestKey(gameId), record);
  return { best: score, isNewBest: true, persisted };
}
