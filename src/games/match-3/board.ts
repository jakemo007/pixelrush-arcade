import type { Rng } from '@/lib/utils/random';

export const SIZE = 8;
export const CELLS = SIZE * SIZE;
export const GEM_TYPES = 6;
export const EMPTY = -1;
export const MAX_CASCADES = 20;
const RESHUFFLE_ATTEMPTS = 200;

export type Board = number[];

export interface Run {
  cells: number[];
  dir: 'h' | 'v';
}

export interface MatchResult {
  cells: number[];
  runs: Run[];
}

export interface Move {
  a: number;
  b: number;
}

export const index = (row: number, col: number): number => row * SIZE + col;
export const rowOf = (i: number): number => Math.floor(i / SIZE);
export const colOf = (i: number): number => i % SIZE;

export function isAdjacent(a: number, b: number): boolean {
  const dr = Math.abs(rowOf(a) - rowOf(b));
  const dc = Math.abs(colOf(a) - colOf(b));
  return dr + dc === 1;
}

export function neighbor(i: number, dRow: number, dCol: number): number {
  const r = rowOf(i) + dRow;
  const c = colOf(i) + dCol;
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE ? index(r, c) : -1;
}

function at(board: Board, r: number, c: number): number {
  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return EMPTY;
  return board[index(r, c)] ?? EMPTY;
}

function runLengths(board: Board, r: number, c: number, type: number): [number, number] {
  let h = 1;
  for (let x = c - 1; at(board, r, x) === type; x--) h++;
  for (let x = c + 1; at(board, r, x) === type; x++) h++;
  let v = 1;
  for (let y = r - 1; at(board, y, c) === type; y--) v++;
  for (let y = r + 1; at(board, y, c) === type; y++) v++;
  return [h, v];
}

export function createsMatchAt(board: Board, r: number, c: number, type: number): boolean {
  if (type === EMPTY) return false;
  const [h, v] = runLengths(board, r, c, type);
  return h >= 3 || v >= 3;
}

function safeType(board: Board, r: number, c: number, rng: Rng): number {
  const start = Math.floor(rng() * GEM_TYPES);
  for (let k = 0; k < GEM_TYPES; k++) {
    const type = (start + k) % GEM_TYPES;
    if (!createsMatchAt(board, r, c, type)) return type;
  }
  return start;
}

export function findMatches(board: Board): MatchResult {
  const runs: Run[] = [];
  const marked = new Set<number>();
  for (let r = 0; r < SIZE; r++) {
    let c = 0;
    while (c < SIZE) {
      const type = at(board, r, c);
      let end = c + 1;
      while (type !== EMPTY && end < SIZE && at(board, r, end) === type) end++;
      if (type !== EMPTY && end - c >= 3) {
        const cells: number[] = [];
        for (let x = c; x < end; x++) cells.push(index(r, x));
        runs.push({ cells, dir: 'h' });
      }
      c = end;
    }
  }
  for (let c = 0; c < SIZE; c++) {
    let r = 0;
    while (r < SIZE) {
      const type = at(board, r, c);
      let end = r + 1;
      while (type !== EMPTY && end < SIZE && at(board, end, c) === type) end++;
      if (type !== EMPTY && end - r >= 3) {
        const cells: number[] = [];
        for (let y = r; y < end; y++) cells.push(index(y, c));
        runs.push({ cells, dir: 'v' });
      }
      r = end;
    }
  }
  for (const run of runs) for (const i of run.cells) marked.add(i);
  return { cells: [...marked].sort((a, b) => a - b), runs };
}

export function inMatch(board: Board, i: number): boolean {
  const type = board[i] ?? EMPTY;
  if (type === EMPTY) return false;
  const [h, v] = runLengths(board, rowOf(i), colOf(i), type);
  return h >= 3 || v >= 3;
}

export function swap(board: Board, a: number, b: number): void {
  const t = board[a]!;
  board[a] = board[b]!;
  board[b] = t;
}

export function swapMakesMatch(board: Board, a: number, b: number): boolean {
  if (!isAdjacent(a, b) || board[a] === board[b] || board[a] === EMPTY || board[b] === EMPTY) return false;
  swap(board, a, b);
  const ok = inMatch(board, a) || inMatch(board, b);
  swap(board, a, b);
  return ok;
}

export function validMoves(board: Board): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < CELLS; i++) {
    const right = neighbor(i, 0, 1);
    const down = neighbor(i, 1, 0);
    if (right >= 0 && swapMakesMatch(board, i, right)) out.push({ a: i, b: right });
    if (down >= 0 && swapMakesMatch(board, i, down)) out.push({ a: i, b: down });
  }
  return out;
}

export function findValidMove(board: Board): Move | null {
  for (let i = 0; i < CELLS; i++) {
    const right = neighbor(i, 0, 1);
    const down = neighbor(i, 1, 0);
    if (right >= 0 && swapMakesMatch(board, i, right)) return { a: i, b: right };
    if (down >= 0 && swapMakesMatch(board, i, down)) return { a: i, b: down };
  }
  return null;
}

export function generateBoard(rng: Rng): Board {
  for (let attempt = 0; attempt < 50; attempt++) {
    const board: Board = new Array<number>(CELLS).fill(EMPTY);
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) board[index(r, c)] = safeType(board, r, c, rng);
    if (findMatches(board).cells.length === 0 && findValidMove(board)) return board;
  }
  return reshuffle(new Array<number>(CELLS).fill(0).map((_, i) => i % GEM_TYPES), rng);
}

export interface Fall {
  to: number;
  rows: number;
}

export function applyGravity(board: Board): Fall[] {
  const falls: Fall[] = [];
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      const type = board[index(r, c)]!;
      if (type === EMPTY) continue;
      if (write !== r) {
        board[index(write, c)] = type;
        board[index(r, c)] = EMPTY;
        falls.push({ to: index(write, c), rows: write - r });
      }
      write--;
    }
  }
  return falls;
}

export function refill(board: Board, rng: Rng): Fall[] {
  const falls: Fall[] = [];
  for (let c = 0; c < SIZE; c++) {
    let empties = 0;
    for (let r = 0; r < SIZE; r++) if (board[index(r, c)] === EMPTY) empties++;
    for (let r = empties - 1; r >= 0; r--) {
      const i = index(r, c);
      if (board[i] !== EMPTY) continue;
      board[i] = safeType(board, r, c, rng);
      falls.push({ to: i, rows: empties });
    }
  }
  return falls;
}

export function reshuffle(board: Board, rng: Rng): Board {
  const gems = board.filter((t) => t !== EMPTY);
  for (let attempt = 0; attempt < RESHUFFLE_ATTEMPTS; attempt++) {
    const next = gems.slice();
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = next[i]!;
      next[i] = next[j]!;
      next[j] = t;
    }
    if (next.length === CELLS && findMatches(next).cells.length === 0 && findValidMove(next)) return next;
  }
  const fresh: Board = new Array<number>(CELLS).fill(EMPTY);
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) fresh[index(r, c)] = safeType(fresh, r, c, rng);
  if (findValidMove(fresh)) return fresh;
  const t = fresh[0]!;
  const other = (t + 1) % GEM_TYPES;
  fresh[0] = t;
  fresh[1] = t;
  fresh[2] = other;
  fresh[3] = t;
  return fresh;
}

export const GEM_POINTS = 10;
export const RUN4_BONUS = 20;
export const RUN5_BONUS = 50;

export function clearPoints(match: MatchResult, chain: number): number {
  let base = match.cells.length * GEM_POINTS;
  for (const run of match.runs) {
    if (run.cells.length >= 5) base += RUN5_BONUS;
    else if (run.cells.length === 4) base += RUN4_BONUS;
  }
  return base * Math.max(1, chain);
}

export function clearCells(board: Board, cells: readonly number[]): void {
  for (const i of cells) board[i] = EMPTY;
}

export interface Resolution {
  steps: number;
  points: number;
  capped: boolean;
}

export function resolveBoard(board: Board, rng: Rng): Resolution {
  let steps = 0;
  let points = 0;
  for (;;) {
    const match = findMatches(board);
    if (match.cells.length === 0) return { steps, points, capped: false };
    if (steps >= MAX_CASCADES) {
      const shuffled = reshuffle(board, rng);
      for (let i = 0; i < CELLS; i++) board[i] = shuffled[i]!;
      return { steps, points, capped: true };
    }
    steps++;
    points += clearPoints(match, steps);
    clearCells(board, match.cells);
    applyGravity(board);
    refill(board, rng);
  }
}
