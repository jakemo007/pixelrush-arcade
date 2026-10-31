import type { Rng } from '@/lib/utils/random';

export type CellState = 'hidden' | 'revealed' | 'flagged';

export interface Cell {
  mine: boolean;
  adjacent: number;
  state: CellState;
  exploded?: boolean;
  wrongFlag?: boolean;
}

export interface Board {
  rows: number;
  cols: number;
  mines: number;
  cells: Cell[];
  minesPlaced: boolean;
}

export interface Difficulty {
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTIES: Readonly<Record<string, Difficulty>> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

export function difficultyFor(variant: string): Difficulty {
  return DIFFICULTIES[variant] ?? DIFFICULTIES.beginner!;
}

export function createBoard({ rows, cols, mines }: Difficulty): Board {
  return {
    rows,
    cols,
    mines,
    cells: Array.from({ length: rows * cols }, () => ({ mine: false, adjacent: 0, state: 'hidden' as const })),
    minesPlaced: false,
  };
}

export function neighbours(board: Pick<Board, 'rows' | 'cols'>, index: number): number[] {
  const r = Math.floor(index / board.cols);
  const c = index % board.cols;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols) out.push(nr * board.cols + nc);
    }
  }
  return out;
}

function cloneCells(board: Board): Board {
  return { ...board, cells: board.cells.map((c) => ({ ...c })) };
}

export function placeMines(board: Board, safeIndex: number, rng: Rng): Board {
  const next = cloneCells(board);
  const total = board.rows * board.cols;
  let excluded = new Set([safeIndex, ...neighbours(board, safeIndex)]);
  if (total - excluded.size < board.mines) excluded = new Set([safeIndex]);
  const candidates: number[] = [];
  for (let i = 0; i < total; i++) if (!excluded.has(i)) candidates.push(i);
  const count = Math.min(board.mines, candidates.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (candidates.length - i));
    const tmp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = tmp;
    next.cells[candidates[i]!]!.mine = true;
  }
  for (let i = 0; i < total; i++) {
    next.cells[i]!.adjacent = neighbours(next, i).filter((n) => next.cells[n]!.mine).length;
  }
  next.minesPlaced = true;
  return next;
}

export interface RevealResult {
  board: Board;
  revealed: number[];
  hitMine: number | null;
}

function revealFrom(board: Board, starts: readonly number[]): { revealed: number[]; hitMine: number | null } {
  const revealed: number[] = [];
  let hitMine: number | null = null;
  const queue = [...starts];
  while (queue.length > 0) {
    const i = queue.shift()!;
    const cell = board.cells[i]!;
    if (cell.state !== 'hidden') continue;
    cell.state = 'revealed';
    revealed.push(i);
    if (cell.mine) {
      hitMine ??= i;
      continue;
    }
    if (cell.adjacent === 0) {
      for (const n of neighbours(board, i)) if (board.cells[n]!.state === 'hidden') queue.push(n);
    }
  }
  return { revealed, hitMine };
}

export function reveal(board: Board, index: number, rng: Rng): RevealResult {
  const cell = board.cells[index];
  if (!cell || cell.state !== 'hidden') return { board, revealed: [], hitMine: null };
  const next = board.minesPlaced ? cloneCells(board) : placeMines(board, index, rng);
  return { board: next, ...revealFrom(next, [index]) };
}

export function flagsAround(board: Board, index: number): number {
  return neighbours(board, index).filter((n) => board.cells[n]!.state === 'flagged').length;
}

export function canChord(board: Board, index: number): boolean {
  const cell = board.cells[index];
  if (!cell || cell.state !== 'revealed' || cell.mine || cell.adjacent === 0) return false;
  if (flagsAround(board, index) !== cell.adjacent) return false;
  return neighbours(board, index).some((n) => board.cells[n]!.state === 'hidden');
}

export function chord(board: Board, index: number): RevealResult {
  if (!canChord(board, index)) return { board, revealed: [], hitMine: null };
  const next = cloneCells(board);
  const targets = neighbours(next, index).filter((n) => next.cells[n]!.state === 'hidden');
  return { board: next, ...revealFrom(next, targets) };
}

export function toggleFlag(board: Board, index: number): Board {
  const cell = board.cells[index];
  if (!cell || cell.state === 'revealed') return board;
  const next = cloneCells(board);
  next.cells[index]!.state = cell.state === 'flagged' ? 'hidden' : 'flagged';
  return next;
}

export function countFlags(board: Board): number {
  return board.cells.filter((c) => c.state === 'flagged').length;
}

export function minesLeft(board: Board): number {
  return board.mines - countFlags(board);
}

export function safeRevealed(board: Board): number {
  return board.cells.filter((c) => c.state === 'revealed' && !c.mine).length;
}

export function isWon(board: Board): boolean {
  return board.minesPlaced && board.cells.every((c) => c.mine || c.state === 'revealed');
}

export function finishWin(board: Board): Board {
  const next = cloneCells(board);
  for (const c of next.cells) if (c.mine) c.state = 'flagged';
  return next;
}

export function finishLoss(board: Board, exploded: number): Board {
  const next = cloneCells(board);
  next.cells.forEach((c, i) => {
    if (c.mine && c.state !== 'flagged') c.state = 'revealed';
    if (!c.mine && c.state === 'flagged') c.wrongFlag = true;
    if (i === exploded) c.exploded = true;
  });
  return next;
}
