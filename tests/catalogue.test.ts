import { describe, expect, it } from 'vitest';
import { CATEGORY_NAMES, categorySummaries, listNames, searchIndexFor } from '@/components/catalogue/catalogue-data';
import {
  SYNONYMS,
  buildSearchIndex,
  categoryNoun,
  describeResults,
  displayQuery,
  filterEntries,
  matchesQuery,
  normalizeText,
  sortByRecentlyAdded,
  type SearchableGame,
} from '@/components/catalogue/search';
import { CATEGORIES, CATEGORY_IDS, GAMES, gamesInCategory, type GameCategory, type GameId } from '@/config/games';
import { CATEGORY_CONTENT } from '@/content/categories';

const FIXTURE: SearchableGame[] = [
  { id: 'neon-dash', name: 'Neon Dash', tagline: 'One button. Endless neon.', genre: 'Endless runner', tags: ['One-button', 'Reflexes'], categories: ['arcade'] },
  { id: 'solitaire', name: 'Classic Solitaire', tagline: 'Build every suit from Ace to King.', genre: 'Card game (Klondike)', tags: ['Klondike', 'Relaxing'], categories: ['card'] },
  { id: 'freecell', name: 'FreeCell', tagline: 'Every card face up.', genre: 'Card game', tags: ['Skill', 'Undo'], categories: ['card'] },
  { id: 'sudoku', name: 'Sudoku', tagline: 'Fill the grid with 1 to 9.', genre: 'Logic puzzle', tags: ['Logic', 'Notes'], categories: ['puzzle'] },
  { id: 'match-3', name: 'Match-3 Puzzle', tagline: 'Swap gems and set off cascades.', genre: 'Match-three puzzle', tags: ['Swap', 'Cascades'], categories: ['puzzle', 'arcade'] },
  { id: 'daily-word', name: 'Daily Word Puzzle', tagline: 'Six guesses to find the word.', genre: 'Word puzzle', tags: ['Daily', 'Five letters'], categories: ['word', 'puzzle'] },
  { id: 'crossword-mini', name: 'Crossword Mini', tagline: 'A small crossword.', genre: 'Mini crossword', tags: ['Quick', 'Clues'], categories: ['word', 'puzzle'] },
  { id: 'chess', name: 'Chess vs Computer', tagline: 'A full game of chess.', genre: 'Strategy board game', tags: ['Strategy', 'Vs computer'], categories: ['board'] },
  { id: 'mini-golf', name: 'Mini Golf', tagline: 'Bank shots, ramps and tricky walls.', genre: 'Mini golf', tags: ['Physics', 'Aim & power'], categories: ['sports'] },
  { id: 'car-racing', name: 'Car Racing Time Trial', tagline: 'Three laps, one clock.', genre: 'Top-down racing', tags: ['Time trial', 'Laps'], categories: ['racing'] },
  { id: 'memory-match', name: 'Memory Card Match', tagline: 'Flip two cards at a time.', genre: 'Memory game', tags: ['Memory', 'Pairs'], categories: ['puzzle'] },
];
const NAMES: Record<GameCategory, string> = {
  arcade: 'Arcade',
  puzzle: 'Puzzle',
  card: 'Card Games',
  board: 'Board Games',
  word: 'Word Games',
  sports: 'Sports',
  racing: 'Racing',
};
const INDEX = buildSearchIndex(FIXTURE, NAMES);
const ALL = FIXTURE.map((g) => g.id);
const search = (query: string, category: GameCategory | null = null): GameId[] => filterEntries(INDEX, { query, category });

describe('normalizeText()', () => {
  it('lowercases, strips accents and punctuation and collapses whitespace', () => {
    expect(normalizeText('  Mini   GOLF!  ')).toBe('mini golf');
    expect(normalizeText('Match-3')).toBe('match 3');
    expect(normalizeText('Solitaire Café')).toBe('solitaire cafe');
    expect(normalizeText('\t\n')).toBe('');
  });

  it('keeps the visible query readable', () => {
    expect(displayQuery('  mini    golf ')).toBe('mini golf');
  });
});

describe('search matching', () => {
  it('returns everything for an empty or whitespace query', () => {
    expect(search('')).toEqual(ALL);
    expect(search('   ')).toEqual(ALL);
    expect(search('!!!')).toEqual(ALL);
  });

  it('finds games by name, ignoring case and extra whitespace', () => {
    expect(search('sudoku')).toEqual(['sudoku']);
    expect(search('  SUDOKU ')).toEqual(['sudoku']);
    expect(search('FreeCell')).toEqual(['freecell']);
    expect(search('free cell')).toEqual([]);
  });

  it('matches word prefixes, so results narrow while typing', () => {
    expect(search('sol')).toEqual(['solitaire']);
    expect(search('neo')).toEqual(['neon-dash']);
    expect(search('cross')).toEqual(['crossword-mini']);
  });

  it('matches multi-word phrases and punctuation-insensitive names', () => {
    expect(search('mini go')).toEqual(['mini-golf']);
    expect(search('match-3')).toEqual(['match-3']);
    expect(search('match 3')).toEqual(['match-3']);
    expect(search('car racing')).toEqual(['car-racing']);
  });

  it('requires every word to match', () => {
    expect(search('daily word')).toEqual(['daily-word']);
    expect(search('word clues')).toEqual(['crossword-mini']);
    expect(search('sudoku chess')).toEqual([]);
  });

  it('matches taglines, genres and tags', () => {
    expect(search('cascades')).toEqual(['match-3']);
    expect(search('klondike')).toEqual(['solitaire']);
    expect(search('runner')).toEqual(['neon-dash']);
    expect(search('strategy')).toEqual(['chess']);
  });

  it('matches category names and simple plurals', () => {
    expect(search('arcade')).toEqual(['neon-dash', 'match-3']);
    expect(search('puzzles')).toEqual(['sudoku', 'match-3', 'daily-word', 'crossword-mini', 'memory-match']);
    expect(search('board games')).toEqual(['chess']);
    expect(search('sports')).toEqual(['mini-golf']);
  });

  it('understands a few everyday synonyms', () => {
    expect(search('cards')).toEqual(['solitaire', 'freecell', 'memory-match']);
    expect(search('words')).toEqual(['daily-word', 'crossword-mini']);
    expect(search('letters')).toEqual(['daily-word', 'crossword-mini']);
    expect(search('patience')).toEqual(['solitaire', 'freecell']);
    expect(search('driving')).toEqual(['car-racing']);
    expect(search('race')).toEqual(['car-racing']);
  });

  it('matches synonym words as whole words only', () => {
    expect(search('car')).toEqual(['car-racing']);
    expect(search('card')).toEqual(['solitaire', 'freecell', 'memory-match']);
  });

  it('ignores filler words', () => {
    expect(search('free card games')).toEqual(search('card'));
    expect(search('play sudoku online')).toEqual(['sudoku']);
    expect(search('games')).toEqual(ALL);
  });

  it('does not match nonsense', () => {
    for (const q of ['qzxv', 'zzzz', 'xylophone', 'solitairez', '12345', 'neon zebra']) expect(search(q), q).toEqual([]);
  });

  it('combines the query with a category filter', () => {
    expect(search('', 'card')).toEqual(['solitaire', 'freecell']);
    expect(search('free', 'card')).toEqual(['solitaire', 'freecell']);
    expect(search('freecell', 'card')).toEqual(['freecell']);
    expect(search('sudoku', 'card')).toEqual([]);
    expect(search('puzzle', 'word')).toEqual(['daily-word', 'crossword-mini']);
  });

  it('only maps synonyms to real categories', () => {
    for (const categories of Object.values(SYNONYMS)) for (const c of categories) expect(CATEGORY_IDS).toContain(c);
  });

  it('exposes a per-entry predicate', () => {
    const sudoku = INDEX.find((e) => e.id === 'sudoku')!;
    expect(matchesQuery(sudoku, 'LOGIC')).toBe(true);
    expect(matchesQuery(sudoku, 'golf')).toBe(false);
  });
});

describe('result descriptions', () => {
  it('describes the unfiltered list', () => {
    expect(describeResults({ count: 23, total: 23, query: '', categoryName: null })).toBe('Showing all 23 games');
  });

  it('describes search results with correct grammar', () => {
    expect(describeResults({ count: 1, total: 23, query: ' sudoku ', categoryName: null })).toBe('1 game matches “sudoku”');
    expect(describeResults({ count: 3, total: 23, query: 'sol', categoryName: null })).toBe('3 games match “sol”');
    expect(describeResults({ count: 0, total: 23, query: 'qzx', categoryName: null })).toBe('No games match “qzx”');
  });

  it('describes category filters', () => {
    expect(describeResults({ count: 3, total: 23, query: '', categoryName: 'Card Games' })).toBe('3 card games');
    expect(describeResults({ count: 1, total: 23, query: '', categoryName: 'Racing' })).toBe('1 racing game');
    expect(describeResults({ count: 2, total: 23, query: 'run', categoryName: 'Arcade' })).toBe('2 arcade games match “run”');
    expect(describeResults({ count: 0, total: 23, query: 'x', categoryName: 'Sports' })).toBe('No sports games match “x”');
  });

  it('turns category names into countable nouns', () => {
    expect(categoryNoun('Card Games', 2)).toBe('card games');
    expect(categoryNoun('Puzzle', 1)).toBe('puzzle game');
  });
});

describe('sortByRecentlyAdded()', () => {
  it('puts the newest first and breaks ties by later catalogue position', () => {
    const games = [
      { id: 'a', added: '2026-01-01' },
      { id: 'b', added: '2026-03-01' },
      { id: 'c', added: '2026-01-01' },
      { id: 'd', added: '2026-03-01' },
      { id: 'e', added: '2025-12-31' },
    ];
    expect(sortByRecentlyAdded(games).map((g) => g.id)).toEqual(['d', 'b', 'c', 'a', 'e']);
    expect(games.map((g) => g.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});

describe('the real catalogue', () => {
  const index = searchIndexFor(GAMES);
  const real = (query: string, category: GameCategory | null = null) => filterEntries(index, { query, category });

  it('finds every game by its full name', () => {
    for (const game of GAMES) expect(real(game.name), game.name).toContain(game.id);
  });

  it('finds every game in a category by the category name', () => {
    for (const c of CATEGORIES) {
      const found = real(c.name);
      for (const g of gamesInCategory(c.id)) expect(found, `${c.name} -> ${g.id}`).toContain(g.id);
    }
  });

  it('returns the whole catalogue for an empty query, and nothing for nonsense', () => {
    expect(real('')).toEqual(GAMES.map((g) => g.id));
    expect(real('qzxvqzxv')).toEqual([]);
  });

  it('filters by category exactly like gamesInCategory()', () => {
    for (const c of CATEGORY_IDS) expect(real('', c)).toEqual(gamesInCategory(c).map((g) => g.id));
  });

  it('builds category names from the registry', () => {
    for (const c of CATEGORIES) expect(CATEGORY_NAMES[c.id]).toBe(c.name);
  });
});

describe('category pages', () => {
  it('have content for every category, with unique, well-sized metadata', () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const c of CATEGORY_IDS) {
      const content = CATEGORY_CONTENT[c];
      expect(content, c).toBeDefined();
      expect(content.heading.trim()).not.toBe('');
      expect(content.metaTitle.length, c).toBeLessThanOrEqual(60);
      expect(content.metaDescription.length, c).toBeGreaterThanOrEqual(120);
      expect(content.metaDescription.length, c).toBeLessThanOrEqual(160);
      expect(content.intro.length).toBeGreaterThan(0);
      titles.add(content.metaTitle);
      descriptions.add(content.metaDescription);
    }
    expect(titles.size).toBe(CATEGORY_IDS.length);
    expect(descriptions.size).toBe(CATEGORY_IDS.length);
  });

  it('only name games that are actually in that category', () => {
    for (const c of CATEGORY_IDS) {
      const content = CATEGORY_CONTENT[c];
      const text = [content.metaTitle, content.metaDescription, content.blurb, ...content.intro].join(' ');
      for (const game of GAMES) {
        if (game.name.length >= 4 && text.includes(game.name)) expect(game.categories, `${c} copy mentions ${game.name}`).toContain(c);
      }
    }
  });

  it('summaries carry the right counts and links', () => {
    const summaries = categorySummaries();
    expect(summaries.map((s) => s.id)).toEqual([...CATEGORY_IDS]);
    for (const s of summaries) {
      expect(s.count).toBe(gamesInCategory(s.id).length);
      expect(s.href).toBe(`/categories/${CATEGORIES.find((c) => c.id === s.id)!.slug}/`);
    }
  });
});

describe('listNames()', () => {
  it('joins names in the site style', () => {
    expect(listNames([])).toBe('');
    expect(listNames(['A'])).toBe('A');
    expect(listNames(['A', 'B'])).toBe('A and B');
    expect(listNames(['A', 'B', 'C'])).toBe('A, B and C');
  });
});
