import { describe, expect, it } from 'vitest';
import { BANK } from '@/games/sudoku/bank';
import {
  applyHint,
  chooseHint,
  digitCounts,
  findConflicts,
  findMistakes,
  initialState,
  isComplete,
  isEditable,
  setValue,
  toggleNote,
} from '@/games/sudoku/game';
import { DIFFICULTY_LEVEL, bankPuzzle, dealPuzzle, generatePuzzle } from '@/games/sudoku/generator';
import { grade, type Difficulty } from '@/games/sudoku/logic';
import { PEERS, countSolutions, gridToString, isConsistent, isSolvedGrid, parseGrid, solveUnique } from '@/games/sudoku/solver';
import { IDENTITY, applyTransform, randomTransform } from '@/games/sudoku/transform';
import { createRng } from '@/lib/utils/random';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const SOLVED = parseGrid('534678912672195348198342567859761423426853791713924856961537284287419635345286179')!;

const BEYOND_LOGIC = '.....54...73.1....8..7........47...8..7...6..9.8...25.3.65..8......2.....5...132.';

describe('solver', () => {
  it('parses and prints grids', () => {
    expect(parseGrid('1'.repeat(80))).toBeNull();
    expect(parseGrid('x'.repeat(81))).toBeNull();
    expect(gridToString(parseGrid('.'.repeat(81))!)).toBe('.'.repeat(81));
  });

  it('recognises complete and inconsistent grids', () => {
    expect(isSolvedGrid(SOLVED)).toBe(true);
    const broken = [...SOLVED];
    broken[1] = broken[0]!;
    expect(isConsistent(broken)).toBe(false);
    expect(isSolvedGrid(broken)).toBe(false);
  });

  it('counts solutions up to the limit', () => {
    expect(countSolutions(SOLVED)).toBe(1);
    expect(countSolutions(new Array(81).fill(0))).toBe(2);
    const loose = [...SOLVED];
    for (const c of [0, 1, 9, 10]) loose[c] = 0;
    expect(countSolutions(loose)).toBe(1);
    const swappable = [...SOLVED];
    for (let c = 0; c < 18; c++) swappable[c] = 0;
    expect(countSolutions(swappable)).toBe(2);
    const contradiction = [...SOLVED];
    contradiction[0] = 0;
    contradiction[1] = 5;
    expect(countSolutions(contradiction)).toBe(0);
  });

  it('returns the unique solution', () => {
    const puzzle = [...SOLVED];
    for (let r = 0; r < 9; r++) puzzle[r * 10] = 0;
    expect(solveUnique(puzzle)).toEqual(SOLVED);
    expect(solveUnique(new Array(81).fill(0))).toBeNull();
  });
});

describe('puzzle bank', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`every ${difficulty} puzzle has exactly one solution and the right grade`, () => {
      const list = BANK[difficulty];
      expect(list.length).toBeGreaterThanOrEqual(60);
      expect(new Set(list).size).toBe(list.length);
      for (const text of list) {
        const puzzle = parseGrid(text);
        expect(puzzle, text).not.toBeNull();
        expect(isConsistent(puzzle!)).toBe(true);
        expect(countSolutions(puzzle!, 2), text).toBe(1);
        const solution = solveUnique(puzzle!)!;
        const g = grade(puzzle!);
        expect(g.solved, text).toBe(true);
        expect(g.difficulty, text).toBe(difficulty);
        expect(g.grid).toEqual(solution);
        puzzle!.forEach((v, i) => v && expect(solution[i]).toBe(v));
      }
    });
  }

  it('keeps easy puzzles generous and harder ones sparser', () => {
    const avg = (d: Difficulty) => BANK[d].reduce((s, t) => s + [...t].filter((ch) => ch !== '.').length, 0) / BANK[d].length;
    expect(avg('easy')).toBeGreaterThanOrEqual(36);
    expect(avg('medium')).toBeLessThan(avg('easy'));
    expect(avg('hard')).toBeLessThan(avg('easy'));
  });
});

describe('difficulty grading', () => {
  it('needs only singles for Easy', () => {
    for (const text of BANK.easy.slice(0, 20)) {
      expect(grade(parseGrid(text)!, 1).solved).toBe(true);
    }
  });

  it('cannot solve Medium with singles alone, but can with level-2 techniques', () => {
    for (const text of BANK.medium.slice(0, 20)) {
      const p = parseGrid(text)!;
      expect(grade(p, 1).solved).toBe(false);
      const g = grade(p, 2);
      expect(g.solved).toBe(true);
      const level2 = ['pointing', 'box-line', 'naked-pair', 'hidden-pair'].some((t) => (g.uses as Record<string, number>)[t]);
      expect(level2).toBe(true);
    }
  });

  it('cannot solve Hard without a level-3 technique', () => {
    for (const text of BANK.hard.slice(0, 20)) {
      const p = parseGrid(text)!;
      expect(grade(p, 2).solved).toBe(false);
      const g = grade(p, 3);
      expect(g.solved).toBe(true);
      const level3 = ['naked-triple', 'hidden-triple', 'x-wing', 'xy-wing', 'swordfish', 'naked-quad', 'hidden-quad'].some(
        (t) => (g.uses as Record<string, number>)[t],
      );
      expect(level3).toBe(true);
    }
  });

  it('grades known puzzles with pinned technique sets', () => {
    expect(grade(parseGrid(BANK.easy[0]!)!).uses).toEqual({ 'naked-single': 45 });
    expect(grade(parseGrid(BANK.medium[1]!)!).uses).toEqual({ 'naked-single': 40, 'hidden-single': 15, pointing: 4 });
    expect(grade(parseGrid(BANK.hard[1]!)!).uses).toEqual({ 'naked-single': 39, 'hidden-single': 14, pointing: 1, 'xy-wing': 1 });
  });

  it('reports puzzles that need guessing as ungraded', () => {
    const p = parseGrid(BEYOND_LOGIC)!;
    expect(countSolutions(p)).toBe(1);
    const g = grade(p);
    expect(g.solved).toBe(false);
    expect(g.difficulty).toBeNull();
  });
});

describe('transforms and dealing', () => {
  it('identity transform is a no-op', () => {
    const p = parseGrid(BANK.medium[0]!)!;
    expect(applyTransform(p, IDENTITY)).toEqual(p);
  });

  it('random transforms keep uniqueness, validity and grade', () => {
    const rng = createRng(99);
    for (const difficulty of DIFFICULTIES) {
      for (let i = 0; i < 12; i++) {
        const base = bankPuzzle(difficulty, i * 5);
        const t = randomTransform(rng);
        const puzzle = applyTransform(base.puzzle, t);
        const solution = applyTransform(base.solution, t);
        expect(isSolvedGrid(solution)).toBe(true);
        expect(countSolutions(puzzle)).toBe(1);
        expect(solveUnique(puzzle)).toEqual(solution);
        expect(grade(puzzle).level).toBe(DIFFICULTY_LEVEL[difficulty]);
      }
    }
  });

  it('deals a unique puzzle of the requested grade for many seeds', () => {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 1; seed <= 40; seed++) {
        const dealt = dealPuzzle(seed * 7919, difficulty);
        expect(countSolutions(dealt.puzzle)).toBe(1);
        expect(isSolvedGrid(dealt.solution)).toBe(true);
        expect(solveUnique(dealt.puzzle)).toEqual(dealt.solution);
        const g = grade(dealt.puzzle);
        expect(g.difficulty).toBe(difficulty);
      }
    }
  });

  it('is deterministic for a seed', () => {
    expect(dealPuzzle(42, 'hard')).toEqual(dealPuzzle(42, 'hard'));
    expect(gridToString(dealPuzzle(42, 'hard').puzzle)).not.toBe(gridToString(dealPuzzle(43, 'hard').puzzle));
  });

  it('the generator itself produces unique puzzles of each grade', () => {
    for (const difficulty of DIFFICULTIES) {
      const p = generatePuzzle(2024 + difficulty.length, difficulty);
      expect(p).not.toBeNull();
      expect(countSolutions(p!.puzzle)).toBe(1);
      expect(grade(p!.puzzle).difficulty).toBe(difficulty);
    }
  });
});

describe('player state', () => {
  const puzzle = parseGrid(BANK.easy[3]!)!;
  const solution = solveUnique(puzzle)!;
  const empty = puzzle.findIndex((v) => v === 0);
  const given = puzzle.findIndex((v) => v !== 0);

  it('locks givens', () => {
    const s = initialState(puzzle);
    expect(isEditable(puzzle, s, given)).toBe(false);
    expect(setValue(puzzle, s, given, 1)).toBe(s);
    expect(toggleNote(puzzle, s, given, 1)).toBe(s);
  });

  it('places and clears digits, and clears matching notes in peers', () => {
    let s = initialState(puzzle);
    const peer = PEERS[empty]!.find((p) => puzzle[p] === 0)!;
    s = toggleNote(puzzle, s, peer, 4);
    s = toggleNote(puzzle, s, peer, 6);
    expect(s.notes[peer]).toBe((1 << 4) | (1 << 6));
    s = setValue(puzzle, s, empty, 4);
    expect(s.values[empty]).toBe(4);
    expect(s.notes[peer]).toBe(1 << 6);
    s = setValue(puzzle, s, empty, 0);
    expect(s.values[empty]).toBe(0);
  });

  it('only keeps notes in empty cells', () => {
    let s = setValue(puzzle, initialState(puzzle), empty, 5);
    expect(toggleNote(puzzle, s, empty, 3)).toBe(s);
    s = setValue(puzzle, s, empty, 0);
    s = toggleNote(puzzle, s, empty, 3);
    expect(s.notes[empty]).toBe(1 << 3);
    s = setValue(puzzle, s, empty, 0);
    expect(s.notes[empty]).toBe(0);
  });

  it('finds conflicts in rows, columns and boxes', () => {
    const values = new Array(81).fill(0);
    values[0] = 5;
    values[8] = 5;
    values[72] = 7;
    values[80] = 3;
    values[60] = 3;
    expect([...findConflicts(values)].sort((a, b) => a - b)).toEqual([0, 8, 60, 80]);
    expect(findConflicts(SOLVED).size).toBe(0);
  });

  it('finds mistakes against the solution and detects completion', () => {
    const s = setValue(puzzle, initialState(puzzle), empty, (solution[empty]! % 9) + 1);
    expect(findMistakes(s.values, solution).has(empty)).toBe(true);
    expect(isComplete(s.values, solution)).toBe(false);
    expect(isComplete(solution, solution)).toBe(true);
    expect(digitCounts(solution).slice(1)).toEqual([9, 9, 9, 9, 9, 9, 9, 9, 9]);
  });

  it('hints fill a correct digit, preferring the selected cell, then wrong entries', () => {
    let s = initialState(puzzle);
    const sel = puzzle.findIndex((v, i) => v === 0 && i > 40);
    const h1 = chooseHint(puzzle, s, solution, sel)!;
    expect(h1.cell).toBe(sel);
    expect(h1.digit).toBe(solution[sel]);
    const wrong = (solution[empty]! % 9) + 1;
    s = setValue(puzzle, s, empty, wrong);
    const h2 = chooseHint(puzzle, s, solution, null)!;
    expect(h2.cell).toBe(empty);
    expect(h2.digit).toBe(solution[empty]);
    s = applyHint(s, h2.cell, solution);
    expect(s.values[empty]).toBe(solution[empty]);
    expect(s.hinted[empty]).toBe(true);
    expect(isEditable(puzzle, s, empty)).toBe(false);
  });

  it('repeated hints solve the whole puzzle correctly', () => {
    let s = initialState(parseGrid(BANK.hard[0]!)!);
    const p = parseGrid(BANK.hard[0]!)!;
    const sol = solveUnique(p)!;
    let guard = 0;
    for (let h = chooseHint(p, s, sol, null); h && guard < 81; h = chooseHint(p, s, sol, null), guard++) {
      expect(h.digit).toBe(sol[h.cell]);
      s = applyHint(s, h.cell, sol);
    }
    expect(isComplete(s.values, sol)).toBe(true);
    expect(chooseHint(p, s, sol, null)).toBeNull();
  });
});
