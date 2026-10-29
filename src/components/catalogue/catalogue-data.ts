import { CATEGORIES, GAMES, categoryPath, gamesInCategory, type GameCategory, type GameInfo } from '@/config/games';
import { CATEGORY_CONTENT } from '@/content/categories';
import { buildSearchIndex, type SearchEntry } from './search';

export const CATEGORY_NAMES = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name])) as Record<GameCategory, string>;

export function searchIndexFor(games: readonly GameInfo[] = GAMES): SearchEntry[] {
  return buildSearchIndex(games, CATEGORY_NAMES);
}

export interface CategorySummary {
  id: GameCategory;
  name: string;
  heading: string;
  blurb: string;
  href: string;
  count: number;
}

export function categorySummaries(): CategorySummary[] {
  return CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    heading: CATEGORY_CONTENT[c.id].heading,
    blurb: CATEGORY_CONTENT[c.id].blurb,
    href: categoryPath(c.id),
    count: gamesInCategory(c.id).length,
  }));
}

export function listNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
