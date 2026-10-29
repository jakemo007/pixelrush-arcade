export type Side = 'dark' | 'light';
export type Piece = -2 | -1 | 0 | 1 | 2;

export interface CheckersState {
  readonly board: readonly number[];
  readonly turn: Side;
  readonly quietPlies: number;
  readonly plies: number;
}

export interface CheckersMove {
  readonly from: number;
  readonly path: readonly number[];
  readonly captures: readonly number[];
  readonly crowns: boolean;
}

export const DRAW_QUIET_PLIES = 80;

export const row = (sq: number) => sq >> 3;
export const col = (sq: number) => sq & 7;
export const isDarkSquare = (sq: number) => ((row(sq) + col(sq)) & 1) === 1;
export const sideOf = (piece: number): Side | null => (piece > 0 ? 'dark' : piece < 0 ? 'light' : null);
export const isKing = (piece: number) => piece === 2 || piece === -2;
export const opponent = (side: Side): Side => (side === 'dark' ? 'light' : 'dark');

const DIRS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

function dirsFor(piece: number): readonly (readonly [number, number])[] {
  if (isKing(piece)) return DIRS;
  return piece > 0 ? DIRS.slice(0, 2) : DIRS.slice(2);
}

function step(sq: number, d: readonly [number, number], n: number): number {
  const r = row(sq) + d[0] * n;
  const c = col(sq) + d[1] * n;
  return r >= 0 && r < 8 && c >= 0 && c < 8 ? r * 8 + c : -1;
}

const crownRow = (piece: number) => (piece > 0 ? 0 : 7);

export function initialState(): CheckersState {
  const board = new Array<number>(64).fill(0);
  for (let sq = 0; sq < 64; sq++) {
    if (!isDarkSquare(sq)) continue;
    if (row(sq) <= 2) board[sq] = -1;
    else if (row(sq) >= 5) board[sq] = 1;
  }
  return { board, turn: 'dark', quietPlies: 0, plies: 0 };
}

export function fromDiagram(rows: readonly string[], turn: Side = 'dark'): CheckersState {
  const board = new Array<number>(64).fill(0);
  rows.forEach((line, r) => {
    [...line.replace(/\s/g, '')].forEach((ch, c) => {
      const piece = ch === 'd' ? 1 : ch === 'D' ? 2 : ch === 'l' ? -1 : ch === 'L' ? -2 : 0;
      if (piece !== 0 && !isDarkSquare(r * 8 + c)) throw new Error(`Piece on a light square at ${r},${c}`);
      board[r * 8 + c] = piece;
    });
  });
  return { board, turn, quietPlies: 0, plies: 0 };
}

function captureSequences(board: number[], from: number, piece: number, out: CheckersMove[], origin: number, path: number[], captured: number[]): void {
  let extended = false;
  for (const d of dirsFor(piece)) {
    const mid = step(from, d, 1);
    const land = step(from, d, 2);
    if (mid < 0 || land < 0) continue;
    const victim = board[mid]!;
    if (victim === 0 || Math.sign(victim) === Math.sign(piece) || board[land] !== 0) continue;
    extended = true;
    const nextPath = [...path, land];
    const nextCaptured = [...captured, mid];
    if (!isKing(piece) && row(land) === crownRow(piece)) {
      out.push({ from: origin, path: nextPath, captures: nextCaptured, crowns: true });
      continue;
    }
    board[from] = 0;
    board[mid] = 0;
    board[land] = piece;
    captureSequences(board, land, piece, out, origin, nextPath, nextCaptured);
    board[land] = 0;
    board[mid] = victim;
    board[from] = piece;
  }
  if (!extended && path.length > 0) out.push({ from: origin, path, captures: captured, crowns: false });
}

export function capturesFrom(state: CheckersState, from: number): CheckersMove[] {
  const piece = state.board[from]!;
  if (piece === 0) return [];
  const out: CheckersMove[] = [];
  captureSequences(state.board.slice(), from, piece, out, from, [], []);
  return out;
}

export function legalMoves(state: CheckersState): CheckersMove[] {
  const sign = state.turn === 'dark' ? 1 : -1;
  const captures: CheckersMove[] = [];
  const board = state.board.slice();
  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq]!;
    if (piece * sign > 0) captureSequences(board, sq, piece, captures, sq, [], []);
  }
  if (captures.length > 0) return captures;
  const simple: CheckersMove[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const piece = board[sq]!;
    if (piece * sign <= 0) continue;
    for (const d of dirsFor(piece)) {
      const to = step(sq, d, 1);
      if (to >= 0 && board[to] === 0) simple.push({ from: sq, path: [to], captures: [], crowns: !isKing(piece) && row(to) === crownRow(piece) });
    }
  }
  return simple;
}

export function destination(move: CheckersMove): number {
  return move.path[move.path.length - 1]!;
}

export function applyMove(state: CheckersState, move: CheckersMove): CheckersState {
  const board = state.board.slice();
  const piece = board[move.from]!;
  board[move.from] = 0;
  for (const c of move.captures) board[c] = 0;
  board[destination(move)] = move.crowns ? piece * 2 : piece;
  const resets = move.captures.length > 0 || !isKing(piece);
  return {
    board,
    turn: opponent(state.turn),
    quietPlies: resets ? 0 : state.quietPlies + 1,
    plies: state.plies + 1,
  };
}

export function sameMove(a: CheckersMove, b: CheckersMove): boolean {
  return a.from === b.from && a.path.length === b.path.length && a.path.every((sq, i) => sq === b.path[i]);
}

export type GameStatus = { kind: 'playing' } | { kind: 'won'; winner: Side; reason: 'no-pieces' | 'no-moves' } | { kind: 'draw' };

export function countPieces(state: CheckersState, side: Side): { men: number; kings: number } {
  const sign = side === 'dark' ? 1 : -1;
  let men = 0;
  let kings = 0;
  for (const p of state.board) {
    if (p === sign) men++;
    else if (p === sign * 2) kings++;
  }
  return { men, kings };
}

export function gameStatus(state: CheckersState): GameStatus {
  const own = countPieces(state, state.turn);
  if (own.men + own.kings === 0) return { kind: 'won', winner: opponent(state.turn), reason: 'no-pieces' };
  if (legalMoves(state).length === 0) return { kind: 'won', winner: opponent(state.turn), reason: 'no-moves' };
  if (state.quietPlies >= DRAW_QUIET_PLIES) return { kind: 'draw' };
  return { kind: 'playing' };
}

export function squareName(sq: number): string {
  return `${'abcdefgh'[col(sq)]}${8 - row(sq)}`;
}

export function continuations(moves: readonly CheckersMove[], from: number, partial: readonly number[]): CheckersMove[] {
  return moves.filter((m) => m.from === from && partial.every((sq, i) => m.path[i] === sq) && m.path.length > partial.length);
}
