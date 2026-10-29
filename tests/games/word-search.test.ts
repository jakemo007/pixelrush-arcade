import { describe, expect, it } from 'vitest';
import {
  ALL_DIRECTIONS,
  VARIANTS,
  chooseWords,
  countOccurrences,
  generatePuzzle,
  isPalindrome,
  lineCells,
  matchSelection,
  readCells,
  snapEnd,
  type VariantId,
} from '@/games/word-search/generator';
import { THEMES } from '@/games/word-search/themes';
import { createRng } from '@/lib/utils/random';

const VARIANT_IDS: VariantId[] = ['easy', 'medium', 'hard'];

describe('themes', () => {
  it('has at least 12 themes with 12+ clean words each', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(12);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
    for (const theme of THEMES) {
      expect(theme.words.length, theme.id).toBeGreaterThanOrEqual(12);
      expect(new Set(theme.words).size, theme.id).toBe(theme.words.length);
      for (const w of theme.words) {
        expect(w, theme.id).toMatch(/^[A-Z]{3,10}$/);
        expect(isPalindrome(w), w).toBe(false);
      }
    }
  });

  it('chooses words that never contain each other', () => {
    const rng = createRng(5);
    for (const theme of THEMES) {
      const words = chooseWords(theme, 12, 14, rng);
      for (const a of words) {
        for (const b of words) {
          if (a === b) continue;
          expect(a.includes(b) || a.includes([...b].reverse().join(''))).toBe(false);
        }
      }
    }
  });
});

describe('generator', () => {
  for (const variant of VARIANT_IDS) {
    it(`places every ${variant} word exactly once, in bounds and in allowed directions, for many seeds`, () => {
      const config = VARIANTS[variant];
      const allowed = new Set(config.directions.map((d) => `${d.dr},${d.dc}`));
      for (let seed = 1; seed <= 150; seed++) {
        const p = generatePuzzle(seed * 2654435761, variant);
        expect(p.size).toBe(config.size);
        expect(p.letters).toHaveLength(config.size * config.size);
        for (const ch of p.letters) expect(ch).toMatch(/^[A-Z]$/);
        expect(p.placements).toHaveLength(config.wordCount);
        expect(new Set(p.placements.map((x) => x.word)).size).toBe(config.wordCount);
        for (const pl of p.placements) {
          expect(p.theme.words).toContain(pl.word);
          expect(allowed.has(`${pl.dr},${pl.dc}`), `${pl.word} ${pl.dr},${pl.dc}`).toBe(true);
          expect(pl.cells).toHaveLength(pl.word.length);
          for (const cell of pl.cells) {
            expect(cell).toBeGreaterThanOrEqual(0);
            expect(cell).toBeLessThan(config.size * config.size);
          }
          const endRow = pl.row + pl.dr * (pl.word.length - 1);
          const endCol = pl.col + pl.dc * (pl.word.length - 1);
          expect(endRow).toBeGreaterThanOrEqual(0);
          expect(endRow).toBeLessThan(config.size);
          expect(endCol).toBeGreaterThanOrEqual(0);
          expect(endCol).toBeLessThan(config.size);
          expect(readCells(p.letters, pl.cells)).toBe(pl.word);
          expect(countOccurrences(p.letters, p.size, pl.word), `${seed} ${pl.word}`).toBe(1);
        }
      }
    });
  }

  it('is deterministic for a seed and varies between seeds', () => {
    expect(generatePuzzle(77, 'hard')).toEqual(generatePuzzle(77, 'hard'));
    expect(generatePuzzle(77, 'hard').letters.join('')).not.toBe(generatePuzzle(78, 'hard').letters.join(''));
  });

  it('counts occurrences in every direction', () => {
    const letters = ['C', 'A', 'T', 'A', 'X', 'A', 'T', 'A', 'C'];
    expect(countOccurrences(letters, 3, 'CAT')).toBe(4);
    expect(countOccurrences(letters, 3, 'TAC')).toBe(4);
    expect(countOccurrences(letters, 3, 'CXC')).toBe(2);
    expect(countOccurrences(letters, 3, 'DOG')).toBe(0);
  });
});

describe('selection', () => {
  const size = 10;
  const at = (r: number, c: number) => r * size + c;

  it('builds straight lines in all eight directions and rejects bent ones', () => {
    expect(lineCells(at(2, 2), at(2, 5), size)).toEqual([at(2, 2), at(2, 3), at(2, 4), at(2, 5)]);
    expect(lineCells(at(2, 5), at(2, 2), size)).toEqual([at(2, 5), at(2, 4), at(2, 3), at(2, 2)]);
    expect(lineCells(at(1, 1), at(4, 4), size)).toEqual([at(1, 1), at(2, 2), at(3, 3), at(4, 4)]);
    expect(lineCells(at(4, 1), at(1, 4), size)).toEqual([at(4, 1), at(3, 2), at(2, 3), at(1, 4)]);
    expect(lineCells(at(5, 5), at(2, 5), size)).toEqual([at(5, 5), at(4, 5), at(3, 5), at(2, 5)]);
    expect(lineCells(at(5, 5), at(5, 5), size)).toEqual([at(5, 5)]);
    expect(lineCells(at(0, 0), at(1, 2), size)).toBeNull();
  });

  it('snaps drags to the nearest of the eight directions and stays inside the grid', () => {
    expect(snapEnd(at(5, 5), at(5, 9), size)).toBe(at(5, 9));
    expect(snapEnd(at(5, 5), at(6, 9), size)).toBe(at(5, 9));
    expect(snapEnd(at(5, 5), at(8, 9), size)).toBe(at(9, 9));
    expect(snapEnd(at(5, 5), at(1, 4), size)).toBe(at(1, 5));
    expect(snapEnd(at(1, 1), at(9, 9), size)).toBe(at(9, 9));
    expect(snapEnd(at(8, 8), at(0, 0), size)).toBe(at(0, 0));
    expect(snapEnd(at(2, 2), at(2, 2), size)).toBe(at(2, 2));
    for (let s = 0; s < 100; s++) {
      for (let t = 0; t < 100; t += 7) {
        const end = snapEnd(s, t, size);
        expect(end).toBeGreaterThanOrEqual(0);
        expect(end).toBeLessThan(100);
        expect(lineCells(s, end, size)).not.toBeNull();
      }
    }
  });

  it('matches a selection to a word forwards or backwards, in every direction', () => {
    const p = generatePuzzle(4242, 'hard');
    const found = new Set<string>();
    for (const pl of p.placements) {
      const start = pl.cells[0]!;
      const end = pl.cells[pl.cells.length - 1]!;
      expect(matchSelection(p.placements, lineCells(start, end, p.size)!, found)?.word).toBe(pl.word);
      expect(matchSelection(p.placements, lineCells(end, start, p.size)!, found)?.word).toBe(pl.word);
      expect(matchSelection(p.placements, pl.cells.slice(0, -1), found)?.word).not.toBe(pl.word);
    }
    const first = p.placements[0]!;
    found.add(first.word);
    expect(matchSelection(p.placements, first.cells, found)).toBeNull();
    expect(matchSelection(p.placements, [first.cells[0]!], new Set())).toBeNull();
  });

  it('covers every direction across generated hard puzzles', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) for (const pl of generatePuzzle(seed, 'hard').placements) seen.add(`${pl.dr},${pl.dc}`);
    expect(seen.size).toBe(ALL_DIRECTIONS.length);
  });
});
