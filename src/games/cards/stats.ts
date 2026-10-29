import type { GameStorage } from '@/games/dom/types';

export interface WinStats {
  played: number;
  won: number;
}

export type StatsByVariant = Record<string, WinStats>;

export const STATS_KEY = 'stats';

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 1e9;

export function isWinStats(value: unknown): value is WinStats {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return isCount(v.played) && isCount(v.won) && v.won <= v.played;
}

export function isStatsByVariant(value: unknown): value is StatsByVariant {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).every(isWinStats);
}

export function emptyStats(): WinStats {
  return { played: 0, won: 0 };
}

export function statsFor(all: StatsByVariant | null, variant: string): WinStats {
  return all?.[variant] ?? emptyStats();
}

export function bumpStats(all: StatsByVariant | null, variant: string, field: 'played' | 'won'): StatsByVariant {
  const current = statsFor(all, variant);
  const next: WinStats = field === 'played' ? { ...current, played: current.played + 1 } : { ...current, won: Math.min(current.played, current.won + 1) };
  return { ...(all ?? {}), [variant]: next };
}

export function loadStats(storage: GameStorage): StatsByVariant {
  return storage.read(STATS_KEY, isStatsByVariant) ?? {};
}

export function recordStat(storage: GameStorage, variant: string, field: 'played' | 'won'): WinStats {
  const next = bumpStats(loadStats(storage), variant, field);
  storage.write(STATS_KEY, next);
  return statsFor(next, variant);
}

export function formatWinStats(stats: WinStats): string {
  if (stats.played === 0) return 'No games played yet in this browser';
  const pct = Math.round((stats.won / stats.played) * 100);
  return `Played ${stats.played} · Won ${stats.won} (${pct}%)`;
}
