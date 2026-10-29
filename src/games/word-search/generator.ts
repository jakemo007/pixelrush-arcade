import { createRng, deriveSeed, type Rng } from '@/lib/utils/random';
import { THEMES, type Theme } from './themes';

export type VariantId = 'easy' | 'medium' | 'hard';

export interface Direction {
  dr: number;
  dc: number;
}

export const ALL_DIRECTIONS: readonly Direction[] = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: -1, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: -1, dc: 0 },
  { dr: -1, dc: -1 },
  { dr: 1, dc: -1 },
];

export interface VariantConfig {
  size: number;
  wordCount: number;
  directions: readonly Direction[];
}

export const VARIANTS: Record<VariantId, VariantConfig> = {
  easy: { size: 10, wordCount: 8, directions: ALL_DIRECTIONS.slice(0, 2) },
  medium: { size: 12, wordCount: 10, directions: ALL_DIRECTIONS.slice(0, 4) },
  hard: { size: 14, wordCount: 12, directions: ALL_DIRECTIONS },
};

export interface Placement {
  word: string;
  row: number;
  col: number;
  dr: number;
  dc: number;
  cells: number[];
}

export interface WordSearchPuzzle {
  size: number;
  letters: string[];
  theme: Theme;
  placements: Placement[];
}

const FILL_LETTERS = 'EEEEEEEEEEEETTTTTTTTTAAAAAAAAOOOOOOOIIIIIIINNNNNNNSSSSSSRRRRRRHHHHHLLLLDDDDCCCUUUMMMFFPPGGWWYYBBVKJXQZ';

export function isPalindrome(word: string): boolean {
  return word === [...word].reverse().join('');
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

export function chooseWords(theme: Theme, count: number, maxLength: number, rng: Rng): string[] {
  const pool = shuffle(
    theme.words.filter((w) => w.length <= maxLength && !isPalindrome(w)),
    rng,
  );
  const chosen: string[] = [];
  for (const word of pool) {
    if (chosen.length === count) break;
    const reversed = [...word].reverse().join('');
    const clash = chosen.some((other) => other.includes(word) || word.includes(other) || other.includes(reversed) || reversed.includes(other));
    if (!clash) chosen.push(word);
  }
  return chosen;
}

export function countOccurrences(letters: readonly string[], size: number, word: string): number {
  let count = 0;
  const n = word.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (letters[r * size + c] !== word[0]) continue;
      for (const { dr, dc } of ALL_DIRECTIONS) {
        const er = r + dr * (n - 1);
        const ec = c + dc * (n - 1);
        if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
        let ok = true;
        for (let i = 1; i < n; i++) {
          if (letters[(r + dr * i) * size + (c + dc * i)] !== word[i]) {
            ok = false;
            break;
          }
        }
        if (ok) count++;
      }
    }
  }
  return count;
}

function tryPlace(words: readonly string[], config: VariantConfig, rng: Rng): { grid: (string | null)[]; placements: Placement[] } | null {
  const { size, directions } = config;
  const grid: (string | null)[] = new Array(size * size).fill(null);
  const placements: Placement[] = [];
  const ordered = [...words].sort((a, b) => b.length - a.length);
  for (const word of ordered) {
    const options: Placement[] = [];
    for (const { dr, dc } of directions) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const er = r + dr * (word.length - 1);
          const ec = c + dc * (word.length - 1);
          if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
          const cells: number[] = [];
          let fits = true;
          let overlap = 0;
          for (let i = 0; i < word.length; i++) {
            const cell = (r + dr * i) * size + (c + dc * i);
            const existing = grid[cell];
            if (existing !== null && existing !== word[i]) {
              fits = false;
              break;
            }
            if (existing !== null) overlap++;
            cells.push(cell);
          }
          if (fits && overlap < word.length) options.push({ word, row: r, col: c, dr, dc, cells });
        }
      }
    }
    if (options.length === 0) return null;
    const choice = options[Math.floor(rng() * options.length)]!;
    choice.cells.forEach((cell, i) => {
      grid[cell] = word[i]!;
    });
    placements.push(choice);
  }
  return { grid, placements };
}

export function generatePuzzle(seed: number, variant: VariantId): WordSearchPuzzle {
  const config = VARIANTS[variant];
  const rng = createRng(deriveSeed(seed, `word-search:${variant}`));
  for (let attempt = 0; attempt < 200; attempt++) {
    const theme = THEMES[Math.floor(rng() * THEMES.length)]!;
    const words = chooseWords(theme, config.wordCount, config.size, rng);
    if (words.length < config.wordCount) continue;
    const placed = tryPlace(words, config, rng);
    if (!placed) continue;
    for (let fillTry = 0; fillTry < 30; fillTry++) {
      const letters = placed.grid.map((ch) => ch ?? FILL_LETTERS[Math.floor(rng() * FILL_LETTERS.length)]!);
      if (placed.placements.every((p) => countOccurrences(letters, config.size, p.word) === 1)) {
        const order = new Map(words.map((w, i) => [w, i]));
        const placements = [...placed.placements].sort((a, b) => order.get(a.word)! - order.get(b.word)!);
        return { size: config.size, letters, theme, placements };
      }
    }
  }
  throw new Error('Could not generate a word search');
}

export function snapEnd(start: number, target: number, size: number): number {
  const r0 = Math.floor(start / size);
  const c0 = start % size;
  const dr = Math.floor(target / size) - r0;
  const dc = (target % size) - c0;
  if (dr === 0 && dc === 0) return start;
  const octant = Math.round(Math.atan2(dr, dc) / (Math.PI / 4));
  const sr = Math.round(Math.sin((octant * Math.PI) / 4));
  const sc = Math.round(Math.cos((octant * Math.PI) / 4));
  let len = sr !== 0 && sc !== 0 ? Math.round((Math.abs(dr) + Math.abs(dc)) / 2) : Math.max(Math.abs(dr), Math.abs(dc));
  while (len > 0) {
    const er = r0 + sr * len;
    const ec = c0 + sc * len;
    if (er >= 0 && er < size && ec >= 0 && ec < size) return er * size + ec;
    len--;
  }
  return start;
}

export function lineCells(start: number, end: number, size: number): number[] | null {
  const r0 = Math.floor(start / size);
  const c0 = start % size;
  const r1 = Math.floor(end / size);
  const c1 = end % size;
  const dr = r1 - r0;
  const dc = c1 - c0;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  return Array.from({ length: steps + 1 }, (_, i) => (r0 + sr * i) * size + (c0 + sc * i));
}

export function matchSelection(placements: readonly Placement[], cells: readonly number[], found: ReadonlySet<string>): Placement | null {
  if (cells.length < 2) return null;
  const forward = cells.join(',');
  const backward = [...cells].reverse().join(',');
  for (const p of placements) {
    if (found.has(p.word)) continue;
    const key = p.cells.join(',');
    if (key === forward || key === backward) return p;
  }
  return null;
}

export function readCells(letters: readonly string[], cells: readonly number[]): string {
  return cells.map((c) => letters[c] ?? '').join('');
}
