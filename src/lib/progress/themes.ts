import type { GameId } from '@/config/games';
import type { GameStorage } from '@/lib/storage/game-data';
import { isUnlocked, type AchievementState } from './achievements';

export const THEME_NAME = 'theme';

export type ThemeUnlock = { kind: 'default' } | { kind: 'stars'; stars: number } | { kind: 'achievement'; id: string };

export interface ThemeDef {
  id: string;
  gameId: GameId;
  name: string;
  unlock: ThemeUnlock;
}

const THEME_ID = /^[a-z0-9][a-z0-9-]{0,31}$/;

export function isThemeId(value: unknown): value is string {
  return typeof value === 'string' && THEME_ID.test(value);
}

export function isThemeUnlocked(theme: ThemeDef, stars: number, achievements: AchievementState): boolean {
  switch (theme.unlock.kind) {
    case 'default':
      return true;
    case 'stars':
      return stars >= theme.unlock.stars;
    case 'achievement':
      return isUnlocked(achievements, theme.unlock.id);
  }
}

export function themesForGame(defs: readonly ThemeDef[], gameId: GameId): ThemeDef[] {
  return defs.filter((t) => t.gameId === gameId);
}

export function validateThemes(defs: readonly ThemeDef[]): string[] {
  const problems: string[] = [];
  const byGame = new Map<GameId, ThemeDef[]>();
  const seen = new Set<string>();
  for (const theme of defs) {
    if (!isThemeId(theme.id)) problems.push(`invalid theme id: ${theme.id}`);
    const key = `${theme.gameId}:${theme.id}`;
    if (seen.has(key)) problems.push(`duplicate theme: ${key}`);
    seen.add(key);
    if (theme.unlock.kind === 'stars' && (!Number.isInteger(theme.unlock.stars) || theme.unlock.stars < 1)) problems.push(`${key}: invalid star cost`);
    byGame.set(theme.gameId, [...(byGame.get(theme.gameId) ?? []), theme]);
  }
  for (const [gameId, themes] of byGame) {
    if (themes.filter((t) => t.unlock.kind === 'default').length !== 1) problems.push(`${gameId}: needs exactly one default theme`);
  }
  return problems;
}

export function resolveTheme(defs: readonly ThemeDef[], gameId: GameId, savedId: string | null, stars: number, achievements: AchievementState): ThemeDef | null {
  const themes = themesForGame(defs, gameId);
  const fallback = themes.find((t) => t.unlock.kind === 'default') ?? null;
  const saved = themes.find((t) => t.id === savedId);
  return saved && isThemeUnlocked(saved, stars, achievements) ? saved : fallback;
}

export function loadThemeId(storage: GameStorage): string | null {
  return storage.read(THEME_NAME, isThemeId);
}

export function saveThemeId(storage: GameStorage, id: string): boolean {
  return isThemeId(id) ? storage.write(THEME_NAME, id) : false;
}
