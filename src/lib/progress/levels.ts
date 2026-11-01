import type { GameStorage } from '@/lib/storage/game-data';
import { isPlainObject } from '@/lib/storage/safe-storage';

export const MAX_LEVELS = 500;
export const MAX_LEVEL_VALUE = 10_000_000;
export const PROGRESS_NAME = 'progress';

export type Stars = 0 | 1 | 2 | 3;
export type StarDirection = 'higher' | 'lower';
export type StarThresholds = readonly [number, number, number];

export interface LevelRecord {
  stars: 1 | 2 | 3;
  best: number;
  at: string;
}

export interface GameProgress {
  levels: Readonly<Record<string, LevelRecord>>;
}

export interface GateRule {
  every: number;
  starsPerGate: number;
}

const LEVEL_KEY = /^[1-9]\d{0,2}$/;

export function emptyProgress(): GameProgress {
  return { levels: {} };
}

export function isValidLevel(level: unknown): level is number {
  return typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= MAX_LEVELS;
}

export function isValidThresholds(thresholds: readonly number[], direction: StarDirection): thresholds is StarThresholds {
  if (thresholds.length !== 3) return false;
  if (!thresholds.every((t) => Number.isFinite(t))) return false;
  const [one, two, three] = thresholds as [number, number, number];
  return direction === 'higher' ? one < two && two < three : one > two && two > three;
}

export function starsFor(value: number, thresholds: StarThresholds, direction: StarDirection): Stars {
  if (!Number.isFinite(value)) return 0;
  let stars = 0;
  for (const t of thresholds) {
    if (direction === 'higher' ? value >= t : value <= t) stars++;
  }
  return stars as Stars;
}

export function isLevelRecord(value: unknown): value is LevelRecord {
  return (
    isPlainObject(value) &&
    (value.stars === 1 || value.stars === 2 || value.stars === 3) &&
    typeof value.best === 'number' &&
    Number.isInteger(value.best) &&
    value.best >= 0 &&
    value.best <= MAX_LEVEL_VALUE &&
    typeof value.at === 'string'
  );
}

export function isGameProgress(value: unknown): value is GameProgress {
  if (!isPlainObject(value) || !isPlainObject(value.levels)) return false;
  for (const [key, record] of Object.entries(value.levels)) {
    if (!LEVEL_KEY.test(key) || Number(key) > MAX_LEVELS || !isLevelRecord(record)) return false;
  }
  return true;
}

export function levelRecord(progress: GameProgress, level: number): LevelRecord | null {
  return isValidLevel(level) ? (progress.levels[String(level)] ?? null) : null;
}

export function starsForLevel(progress: GameProgress, level: number): Stars {
  return levelRecord(progress, level)?.stars ?? 0;
}

export function totalStars(progress: GameProgress): number {
  let total = 0;
  for (const record of Object.values(progress.levels)) total += record.stars;
  return total;
}

export function completedLevels(progress: GameProgress): number {
  return Object.keys(progress.levels).length;
}

export interface LevelResultOutcome {
  progress: GameProgress;
  stars: Stars;
  improved: boolean;
  firstClear: boolean;
}

export function recordLevelResult(
  progress: GameProgress,
  level: number,
  value: number,
  thresholds: StarThresholds,
  direction: StarDirection,
  now: string,
): LevelResultOutcome {
  const stars = starsFor(value, thresholds, direction);
  const unchanged = { progress, stars, improved: false, firstClear: false };
  if (!isValidLevel(level) || stars === 0) return unchanged;
  if (!Number.isInteger(value) || value < 0 || value > MAX_LEVEL_VALUE) return unchanged;

  const previous = levelRecord(progress, level);
  if (!previous) {
    const record: LevelRecord = { stars: stars as 1 | 2 | 3, best: value, at: now };
    return { progress: { levels: { ...progress.levels, [String(level)]: record } }, stars, improved: true, firstClear: true };
  }

  const betterValue = direction === 'higher' ? value > previous.best : value < previous.best;
  const betterStars = stars > previous.stars;
  if (!betterValue && !betterStars) return { ...unchanged, stars: previous.stars };
  const record: LevelRecord = {
    stars: Math.max(stars, previous.stars) as 1 | 2 | 3,
    best: betterValue ? value : previous.best,
    at: now,
  };
  return { progress: { levels: { ...progress.levels, [String(level)]: record } }, stars: record.stars, improved: true, firstClear: false };
}

export function levelLockReason(progress: GameProgress, level: number, totalLevels: number, gate?: GateRule): string | null {
  if (!isValidLevel(level) || level > totalLevels) return 'Not available';
  if (level === 1) return null;
  if (!levelRecord(progress, level - 1)) return `Clear level ${level - 1} first`;
  if (gate && gate.every > 0 && (level - 1) % gate.every === 0) {
    const needed = ((level - 1) / gate.every) * gate.starsPerGate;
    const have = totalStars(progress);
    if (have < needed) return `Needs ${needed} stars (you have ${have})`;
  }
  return null;
}

export function isLevelUnlocked(progress: GameProgress, level: number, totalLevels: number, gate?: GateRule): boolean {
  return levelLockReason(progress, level, totalLevels, gate) === null;
}

export function highestUnlockedLevel(progress: GameProgress, totalLevels: number, gate?: GateRule): number {
  let highest = 1;
  for (let level = 2; level <= Math.min(totalLevels, MAX_LEVELS); level++) {
    if (!isLevelUnlocked(progress, level, totalLevels, gate)) break;
    highest = level;
  }
  return highest;
}

export function nextLevelToPlay(progress: GameProgress, totalLevels: number, gate?: GateRule): number {
  const highest = highestUnlockedLevel(progress, totalLevels, gate);
  for (let level = 1; level <= highest; level++) {
    if (!levelRecord(progress, level)) return level;
  }
  return highest;
}

export function loadProgress(storage: GameStorage): GameProgress {
  return storage.read(PROGRESS_NAME, isGameProgress) ?? emptyProgress();
}

export function saveProgress(storage: GameStorage, progress: GameProgress): boolean {
  return storage.write(PROGRESS_NAME, progress);
}
