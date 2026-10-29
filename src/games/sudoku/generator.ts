import { createRng, type Rng } from '@/lib/utils/random';
import { BANK } from './bank';
import { grade, type Difficulty, type Level } from './logic';
import { CELLS, countSolutions, parseGrid, randomSolution, solveUnique, type Grid } from './solver';
import { applyTransform, randomTransform } from './transform';

export const DIFFICULTY_LEVEL: Record<Difficulty, Level> = { easy: 1, medium: 2, hard: 3 };

const MIN_GIVENS: Record<Difficulty, number> = { easy: 36, medium: 24, hard: 22 };

export interface Puzzle {
  puzzle: Grid;
  solution: Grid;
  difficulty: Difficulty;
  givens: number;
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

export function tryGenerate(rng: Rng, difficulty: Difficulty): Puzzle | null {
  const target = DIFFICULTY_LEVEL[difficulty];
  const solution = randomSolution(rng);
  const puzzle = [...solution];
  let givens = CELLS;
  const pairs = shuffle(
    Array.from({ length: 41 }, (_, i) => i),
    rng,
  );
  for (const cell of pairs) {
    const mate = 80 - cell;
    const removing = cell === mate ? 1 : 2;
    if (givens - removing < MIN_GIVENS[difficulty]) continue;
    const saved = [puzzle[cell]!, puzzle[mate]!];
    puzzle[cell] = 0;
    puzzle[mate] = 0;
    let keep = countSolutions(puzzle, 2) === 1;
    if (keep) {
      const g = grade(puzzle, target);
      keep = g.solved;
    }
    if (keep) givens -= removing;
    else {
      puzzle[cell] = saved[0]!;
      puzzle[mate] = saved[1]!;
    }
  }
  const g = grade(puzzle);
  if (!g.solved || g.level !== target) return null;
  return { puzzle, solution, difficulty, givens };
}

export function generatePuzzle(seed: number, difficulty: Difficulty, maxAttempts = 400): Puzzle | null {
  const rng = createRng(seed);
  for (let i = 0; i < maxAttempts; i++) {
    const p = tryGenerate(rng, difficulty);
    if (p) return p;
  }
  return null;
}

export function bankPuzzle(difficulty: Difficulty, index: number): Puzzle {
  const list = BANK[difficulty];
  const text = list[((index % list.length) + list.length) % list.length]!;
  const puzzle = parseGrid(text);
  if (!puzzle) throw new Error(`Bad bank entry ${difficulty}#${index}`);
  const solution = solveUnique(puzzle);
  if (!solution) throw new Error(`Bank entry ${difficulty}#${index} is not unique`);
  return { puzzle, solution, difficulty, givens: puzzle.filter(Boolean).length };
}

export function dealPuzzle(seed: number, difficulty: Difficulty): Puzzle {
  const rng = createRng(seed);
  const index = Math.floor(rng() * BANK[difficulty].length);
  const base = bankPuzzle(difficulty, index);
  const t = randomTransform(rng);
  const puzzle = applyTransform(base.puzzle, t);
  const solution = applyTransform(base.solution, t);
  if (countSolutions(puzzle, 2) === 1) {
    const g = grade(puzzle);
    if (g.solved && g.level === DIFFICULTY_LEVEL[difficulty]) return { puzzle, solution, difficulty, givens: base.givens };
  }
  return base;
}
