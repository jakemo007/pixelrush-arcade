import type { Rng } from '@/lib/utils/random';
import { CELLS, COLS, CONNECT, ROWS, cellIndex, connectedLine, dropRow, legalColumns, type DropState, type Player } from './rules';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultySettings {
  depth: number;
  randomRate: number;
}

export const DIFFICULTIES: Readonly<Record<Difficulty, DifficultySettings>> = {
  easy: { depth: 2, randomRate: 0.3 },
  medium: { depth: 4, randomRate: 0 },
  hard: { depth: 6, randomRate: 0 },
};

const WIN = 100000;
const COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6] as const;

const WINDOWS: readonly (readonly number[])[] = (() => {
  const windows: number[][] = [];
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of dirs) {
        const endR = r + dr! * (CONNECT - 1);
        const endC = c + dc! * (CONNECT - 1);
        if (endR < 0 || endR >= ROWS || endC < 0 || endC >= COLS) continue;
        windows.push(Array.from({ length: CONNECT }, (_, k) => cellIndex(r + dr! * k, c + dc! * k)));
      }
    }
  }
  return windows;
})();

const WINDOW_SCORE = [0, 1, 4, 16] as const;

export function evaluate(board: Int8Array, player: Player): number {
  let score = 0;
  for (let r = 0; r < ROWS; r++) {
    const centre = board[cellIndex(r, 3)];
    if (centre === player) score += 3;
    else if (centre !== 0) score -= 3;
  }
  for (const w of WINDOWS) {
    let mine = 0;
    let theirs = 0;
    for (const i of w) {
      const v = board[i];
      if (v === player) mine++;
      else if (v !== 0) theirs++;
    }
    if (mine > 0 && theirs === 0) score += WINDOW_SCORE[mine]!;
    else if (theirs > 0 && mine === 0) score -= WINDOW_SCORE[theirs]!;
  }
  return score;
}

interface Search {
  board: Int8Array;
  nodes: number;
}

function negamax(s: Search, depth: number, alpha: number, beta: number, player: Player, ply: number): number {
  s.nodes++;
  let moved = false;
  let best = -Infinity;
  for (const col of COLUMN_ORDER) {
    const row = dropRow(s.board, col);
    if (row < 0) continue;
    moved = true;
    const index = cellIndex(row, col);
    s.board[index] = player;
    let score: number;
    if (connectedLine(s.board, index)) score = WIN - ply;
    else if (depth <= 1) score = -evaluate(s.board, player === 1 ? 2 : 1);
    else score = -negamax(s, depth - 1, -beta, -alpha, player === 1 ? 2 : 1, ply + 1);
    s.board[index] = 0;
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return moved ? best : 0;
}

export interface ChooseOptions extends DifficultySettings {
  rng?: Rng;
}

export interface ColumnScore {
  col: number;
  score: number;
}

export function scoreColumns(state: DropState, depth: number): ColumnScore[] {
  const s: Search = { board: state.board.slice(), nodes: 0 };
  const results: ColumnScore[] = [];
  const player = state.turn;
  for (const col of COLUMN_ORDER) {
    const row = dropRow(s.board, col);
    if (row < 0) continue;
    const index = cellIndex(row, col);
    s.board[index] = player;
    let score: number;
    if (connectedLine(s.board, index)) score = WIN;
    else if (state.moves + 1 >= CELLS) score = 0;
    else if (depth <= 1) score = -evaluate(s.board, player === 1 ? 2 : 1);
    else score = -negamax(s, depth - 1, -Infinity, Infinity, player === 1 ? 2 : 1, 1);
    s.board[index] = 0;
    results.push({ col, score });
  }
  return results;
}

export function chooseColumn(state: DropState, options: ChooseOptions): number {
  const legal = legalColumns(state);
  if (legal.length === 0) return -1;
  const scores = scoreColumns(state, Math.max(1, options.depth));
  const winning = scores.find((s) => s.score >= WIN);
  if (winning) return winning.col;
  const rng = options.rng;
  if (rng && options.randomRate > 0 && rng() < options.randomRate) {
    return legal[Math.floor(rng() * legal.length)]!;
  }
  const top = Math.max(...scores.map((s) => s.score));
  const best = scores.filter((s) => s.score === top);
  if (rng && best.length > 1) return best[Math.floor(rng() * best.length)]!.col;
  return best[0]!.col;
}
