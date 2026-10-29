import { describe, expect, it } from 'vitest';
import {
  buildPuzzle,
  deriveEntries,
  entryIndexAt,
  firstEmptyCell,
  isFilled,
  isSolved,
  moveCell,
  numberGrid,
  stepEntry,
  validatePuzzle,
  whiteCells,
  wrongCells,
  type CrosswordPuzzle,
} from '@/games/crossword-mini/grid';
import { PUZZLES } from '@/games/crossword-mini/puzzles';
import { crosswordLexicon } from '@/games/words/lexicon';

function referenceNumbers(grid: readonly string[]): Map<string, number> {
  const h = grid.length;
  const w = grid[0]!.length;
  const white = (r: number, c: number) => r >= 0 && r < h && c >= 0 && c < w && grid[r]![c] !== '#';
  const out = new Map<string, number>();
  let n = 0;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!white(r, c)) continue;
      const across = !white(r, c - 1) && white(r, c + 1);
      const down = !white(r - 1, c) && white(r + 1, c);
      if (across) out.set(`A${r},${c}`, n + 1);
      if (down) out.set(`D${r},${c}`, n + 1);
      if (across || down) n++;
    }
  }
  return out;
}

describe('crossword puzzles', () => {
  it('has at least 15 puzzles with unique ids and titles', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(15);
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    expect(new Set(PUZZLES.map((p) => p.title)).size).toBe(PUZZLES.length);
  });

  for (const puzzle of PUZZLES) {
    describe(`${puzzle.id} ${puzzle.title}`, () => {
      it('has a square grid of A-Z and black squares, with 180-degree symmetry', () => {
        const n = puzzle.grid.length;
        expect([5, 6, 7]).toContain(n);
        for (const row of puzzle.grid) {
          expect(row).toHaveLength(n);
          expect(row).toMatch(/^[A-Z#]+$/);
        }
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            expect(puzzle.grid[r]![c] === '#').toBe(puzzle.grid[n - 1 - r]![n - 1 - c] === '#');
          }
        }
      });

      it('passes full validation (numbering, answers, one clue per entry, checked squares, no repeats)', () => {
        expect(validatePuzzle(puzzle)).toEqual([]);
      });

      it('lists exactly the entries in the grid, with standard numbers', () => {
        const derived = deriveEntries(puzzle.grid);
        const ref = referenceNumbers(puzzle.grid);
        const w = puzzle.grid[0]!.length;
        expect(puzzle.across.map((c) => [c.number, c.answer])).toEqual(derived.across.map((e) => [e.number, e.answer]));
        expect(puzzle.down.map((c) => [c.number, c.answer])).toEqual(derived.down.map((e) => [e.number, e.answer]));
        for (const e of derived.across) expect(ref.get(`A${Math.floor(e.cells[0]! / w)},${e.cells[0]! % w}`)).toBe(e.number);
        for (const e of derived.down) expect(ref.get(`D${Math.floor(e.cells[0]! / w)},${e.cells[0]! % w}`)).toBe(e.number);
        let runs = 0;
        for (const line of [...puzzle.grid, ...Array.from({ length: w }, (_, c) => puzzle.grid.map((row) => row[c]).join(''))]) {
          runs += line.split('#').filter((seg) => seg.length >= 2).length;
        }
        expect(derived.across.length + derived.down.length).toBe(runs);
      });

      it('reads each clue’s answer letter by letter from the grid', () => {
        const built = buildPuzzle(puzzle);
        for (const e of built.entries) {
          expect(e.cells.map((c) => built.solution[c]).join('')).toBe(e.answer);
          expect(e.clue.length).toBeGreaterThan(2);
          expect(e.clue.toUpperCase().split(/[^A-Z]+/)).not.toContain(e.answer);
        }
      });

      it('uses only words from the word list, and only real 3+ letter entries', () => {
        const lexicon = crosswordLexicon();
        for (const c of [...puzzle.across, ...puzzle.down]) {
          expect(c.answer.length).toBeGreaterThanOrEqual(3);
          expect(lexicon.has(c.answer.toLowerCase()), c.answer).toBe(true);
        }
      });
    });
  }
});

describe('validation catches broken puzzles', () => {
  const good = PUZZLES[0]!;
  const tweak = (p: Partial<CrosswordPuzzle>): CrosswordPuzzle => ({ ...good, ...p });

  it('rejects a wrong answer, a wrong number or a missing clue', () => {
    expect(validatePuzzle(tweak({ across: good.across.map((c, i) => (i === 0 ? { ...c, answer: 'POOR' } : c)) }))).not.toEqual([]);
    expect(validatePuzzle(tweak({ down: good.down.map((c, i) => (i === 1 ? { ...c, number: 9 } : c)) }))).not.toEqual([]);
    expect(validatePuzzle(tweak({ down: good.down.slice(1) }))).not.toEqual([]);
    expect(validatePuzzle(tweak({ grid: ['#POUR', 'TILDE', 'OXIDE', 'LIVED', 'DEER'] }))).not.toEqual([]);
  });

  it('rejects unchecked squares and repeated answers', () => {
    const unchecked: CrosswordPuzzle = {
      id: 'x',
      title: 'x',
      grid: ['CAT', '#O#', '#W#'],
      across: [{ number: 1, answer: 'CAT', clue: 'Pet' }],
      down: [{ number: 2, answer: 'COW', clue: 'Farm animal' }],
    };
    expect(validatePuzzle(unchecked).some((p) => p.includes('unchecked') || p.includes('in no entry'))).toBe(true);
    const repeated: CrosswordPuzzle = {
      id: 'y',
      title: 'y',
      grid: ['TOT', 'O#O', 'TOT'],
      across: [
        { number: 1, answer: 'TOT', clue: 'a' },
        { number: 4, answer: 'TOT', clue: 'b' },
      ],
      down: [
        { number: 1, answer: 'TOT', clue: 'c' },
        { number: 3, answer: 'TOT', clue: 'd' },
      ],
    };
    expect(validatePuzzle(repeated)).toContain('an answer is used twice');
  });

  it('numbers a known pattern correctly', () => {
    expect(numberGrid(['#POUR', 'TILDE', 'OXIDE', 'LIVED', 'DEER#'])).toEqual([
      0, 1, 2, 3, 4, 5, 0, 0, 0, 0, 6, 0, 0, 0, 0, 7, 0, 0, 0, 0, 8, 0, 0, 0, 0,
    ]);
  });
});

describe('play helpers', () => {
  const b = buildPuzzle(PUZZLES[0]!);

  it('finds the entry through a square, falling back to the other direction', () => {
    expect(b.entries[entryIndexAt(b, 1, 'across')]!.answer).toBe('POUR');
    expect(b.entries[entryIndexAt(b, 1, 'down')]!.answer).toBe('PIXIE');
    expect(b.entries[entryIndexAt(b, 5, 'down')]!.answer).toBe('TOLD');
  });

  it('moves with arrows, skipping black squares and stopping at the edges', () => {
    expect(moveCell(b, 5, -1, 0)).toBe(5);
    expect(moveCell(b, 1, 0, -1)).toBe(1);
    expect(moveCell(b, 1, 0, 1)).toBe(2);
    expect(moveCell(b, 23, 0, 1)).toBe(23);
  });

  it('steps through clues in order and wraps', () => {
    expect(stepEntry(b, 0, 1)).toBe(1);
    expect(stepEntry(b, 0, -1)).toBe(b.entries.length - 1);
    expect(stepEntry(b, b.entries.length - 1, 1)).toBe(0);
  });

  it('checks letters and detects a solved grid', () => {
    const letters = b.solution.map((s) => s);
    expect(isSolved(b, letters)).toBe(true);
    letters[6] = 'Q';
    expect(isSolved(b, letters)).toBe(false);
    expect(isFilled(b, letters)).toBe(true);
    expect(wrongCells(b, letters, whiteCells(b))).toEqual([6]);
    letters[6] = '';
    expect(isFilled(b, letters)).toBe(false);
    expect(wrongCells(b, letters, whiteCells(b))).toEqual([]);
    expect(firstEmptyCell(b.entries[entryIndexAt(b, 6, 'across')]!, letters)).toBe(6);
  });
});
