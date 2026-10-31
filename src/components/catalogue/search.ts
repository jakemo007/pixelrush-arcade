import type { GameCategory, GameId } from '@/config/games';

export interface SearchableGame {
  id: GameId;
  name: string;
  tagline: string;
  genre: string;
  tags: readonly string[];
  categories: readonly GameCategory[];
}

export interface SearchEntry {
  id: GameId;
  categories: readonly GameCategory[];
  words: readonly string[];
  text: string;
}

export interface CatalogueFilters {
  query: string;
  category: GameCategory | null;
}

export const SYNONYMS: Readonly<Record<string, readonly GameCategory[]>> = {
  action: ['arcade'],
  retro: ['arcade'],
  arcade: ['arcade'],
  card: ['card'],
  cards: ['card'],
  patience: ['card'],
  board: ['board'],
  boards: ['board'],
  puzzle: ['puzzle'],
  puzzles: ['puzzle'],
  brain: ['puzzle'],
  word: ['word'],
  words: ['word'],
  letter: ['word'],
  letters: ['word'],
  spelling: ['word'],
  vocabulary: ['word'],
  sport: ['sports'],
  sports: ['sports'],
  race: ['racing'],
  races: ['racing'],
  racing: ['racing'],
  car: ['racing'],
  cars: ['racing'],
  driving: ['racing'],
};

const STOPWORDS = new Set(['a', 'an', 'and', 'the', 'of', 'for', 'to', 'in', 'on', 'with', 'game', 'games', 'play', 'free', 'online']);

export function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function displayQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

export function buildSearchEntry(game: SearchableGame, categoryNames: Readonly<Record<GameCategory, string>>): SearchEntry {
  const fields = [game.name, game.tagline, game.genre, ...game.tags, ...game.categories.map((c) => categoryNames[c])].map(normalizeText);
  const words = [...new Set(fields.flatMap((f) => f.split(' ')).filter(Boolean))];
  return { id: game.id, categories: [...game.categories], words, text: fields.join(' | ') };
}

export function buildSearchIndex(
  games: readonly SearchableGame[],
  categoryNames: Readonly<Record<GameCategory, string>>,
): SearchEntry[] {
  return games.map((g) => buildSearchEntry(g, categoryNames));
}

function variantsOf(term: string): string[] {
  const forms = [term];
  if (term.length > 3 && term.endsWith('s')) forms.push(term.slice(0, -1));
  if (term.length > 4 && term.endsWith('es')) forms.push(term.slice(0, -2));
  return forms;
}

function termMatches(entry: SearchEntry, term: string): boolean {
  const forms = variantsOf(term);
  const synonymCategories = forms.flatMap((f) => SYNONYMS[f] ?? []);
  if (synonymCategories.length > 0) {
    if (synonymCategories.some((c) => entry.categories.includes(c))) return true;
    return entry.words.some((w) => forms.includes(w) || forms.some((f) => w === `${f}s`));
  }
  return entry.words.some((w) => forms.some((f) => w.startsWith(f)));
}

export function matchesQuery(entry: SearchEntry, query: string): boolean {
  const phrase = normalizeText(query);
  if (!phrase) return true;
  if (phrase.includes(' ') && ` ${entry.text}`.includes(` ${phrase}`)) return true;
  const terms = phrase.split(' ').filter((t) => !STOPWORDS.has(t));
  if (terms.length === 0) return true;
  return terms.every((t) => termMatches(entry, t));
}

export function filterEntries(entries: readonly SearchEntry[], { query, category }: CatalogueFilters): GameId[] {
  return entries.filter((e) => (category === null || e.categories.includes(category)) && matchesQuery(e, query)).map((e) => e.id);
}

export function categoryNoun(categoryName: string, count: number): string {
  const base = categoryName.toLowerCase().replace(/\s*games?$/, '');
  return `${base} ${count === 1 ? 'game' : 'games'}`;
}

export function describeResults({
  count,
  total,
  query,
  categoryName,
}: {
  count: number;
  total: number;
  query: string;
  categoryName: string | null;
}): string {
  const q = displayQuery(query);
  const noun = (n: number) => (categoryName ? categoryNoun(categoryName, n) : n === 1 ? 'game' : 'games');
  if (!normalizeText(q)) {
    if (!categoryName) return `Showing all ${total} games`;
    return count === 0 ? `No ${noun(0)} yet` : `${count} ${noun(count)}`;
  }
  if (count === 0) return `No ${noun(0)} match “${q}”`;
  return `${count} ${noun(count)} ${count === 1 ? 'matches' : 'match'} “${q}”`;
}

export function sortByRecentlyAdded<T extends { added: string }>(games: readonly T[]): T[] {
  return games
    .map((game, index) => ({ game, index }))
    .sort((a, b) => (a.game.added === b.game.added ? b.index - a.index : a.game.added < b.game.added ? 1 : -1))
    .map((x) => x.game);
}
