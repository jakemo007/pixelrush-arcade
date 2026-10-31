export const COLS = 7;
export const ROWS = 6;
export const CONNECT = 4;
export const CELLS = COLS * ROWS;

export type Player = 1 | 2;

export interface DropState {
  board: Int8Array;
  turn: Player;
  moves: number;
  last: number | null;
}

export type GameStatus = { kind: 'playing' } | { kind: 'won'; winner: Player; line: number[] } | { kind: 'draw' };

export function initialState(): DropState {
  return { board: new Int8Array(CELLS), turn: 1, moves: 0, last: null };
}

export function other(player: Player): Player {
  return player === 1 ? 2 : 1;
}

export function cellIndex(row: number, col: number): number {
  return row * COLS + col;
}

export function dropRow(board: Int8Array, col: number): number {
  if (!Number.isInteger(col) || col < 0 || col >= COLS) return -1;
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[cellIndex(row, col)] === 0) return row;
  }
  return -1;
}

export function legalColumns(state: DropState): number[] {
  const cols: number[] = [];
  for (let c = 0; c < COLS; c++) if (dropRow(state.board, c) >= 0) cols.push(c);
  return cols;
}

export function discsInColumn(board: Int8Array, col: number): number {
  let n = 0;
  for (let r = 0; r < ROWS; r++) if (board[cellIndex(r, col)] !== 0) n++;
  return n;
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

export function connectedLine(board: Int8Array, index: number): number[] | null {
  const player = board[index];
  if (!player) return null;
  const row = Math.floor(index / COLS);
  const col = index % COLS;
  for (const [dr, dc] of DIRECTIONS) {
    const line = [index];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[cellIndex(r, c)] === player) {
        line.push(cellIndex(r, c));
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= CONNECT) return line.sort((a, b) => a - b);
  }
  return null;
}

export function playColumn(state: DropState, col: number): DropState | null {
  const row = dropRow(state.board, col);
  if (row < 0) return null;
  const board = state.board.slice();
  const index = cellIndex(row, col);
  board[index] = state.turn;
  return { board, turn: other(state.turn), moves: state.moves + 1, last: index };
}

export function gameStatus(state: DropState): GameStatus {
  if (state.last !== null) {
    const line = connectedLine(state.board, state.last);
    if (line) return { kind: 'won', winner: state.board[state.last] as Player, line };
  }
  if (state.moves >= CELLS) return { kind: 'draw' };
  return { kind: 'playing' };
}

export function columnLabel(col: number): string {
  return String(col + 1);
}
