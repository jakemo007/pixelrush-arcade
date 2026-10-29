export type Grid = number[];

export const SIZE = 9;
export const CELLS = 81;
export const ALL_DIGITS = 0x3fe;

export const rowOf = (cell: number) => Math.floor(cell / 9);
export const colOf = (cell: number) => cell % 9;
export const boxOf = (cell: number) => Math.floor(rowOf(cell) / 3) * 3 + Math.floor(colOf(cell) / 3);

export const UNITS: readonly (readonly number[])[] = (() => {
  const units: number[][] = [];
  for (let r = 0; r < 9; r++) units.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) units.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let b = 0; b < 9; b++) {
    const r0 = Math.floor(b / 3) * 3;
    const c0 = (b % 3) * 3;
    units.push(Array.from({ length: 9 }, (_, i) => (r0 + Math.floor(i / 3)) * 9 + c0 + (i % 3)));
  }
  return units;
})();

export const ROW_UNITS = UNITS.slice(0, 9);
export const COL_UNITS = UNITS.slice(9, 18);
export const BOX_UNITS = UNITS.slice(18, 27);

export const PEERS: readonly (readonly number[])[] = Array.from({ length: CELLS }, (_, cell) => {
  const set = new Set<number>();
  for (const unit of [ROW_UNITS[rowOf(cell)]!, COL_UNITS[colOf(cell)]!, BOX_UNITS[boxOf(cell)]!]) {
    for (const other of unit) if (other !== cell) set.add(other);
  }
  return [...set];
});

export function popcount(mask: number): number {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}

export function digitsOf(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & (1 << d)) out.push(d);
  return out;
}

export function parseGrid(text: string): Grid | null {
  const clean = text.replace(/\s+/g, '');
  if (!/^[0-9.]{81}$/.test(clean)) return null;
  return [...clean].map((ch) => (ch === '.' ? 0 : Number(ch)));
}

export function gridToString(grid: readonly number[]): string {
  return grid.map((v) => (v === 0 ? '.' : String(v))).join('');
}

export function isConsistent(grid: readonly number[]): boolean {
  if (grid.length !== CELLS) return false;
  for (const unit of UNITS) {
    let seen = 0;
    for (const cell of unit) {
      const v = grid[cell]!;
      if (v === 0) continue;
      if (!Number.isInteger(v) || v < 0 || v > 9) return false;
      const bit = 1 << v;
      if (seen & bit) return false;
      seen |= bit;
    }
  }
  return true;
}

export function isSolvedGrid(grid: readonly number[]): boolean {
  return grid.length === CELLS && grid.every((v) => v >= 1 && v <= 9) && isConsistent(grid);
}

interface SearchState {
  grid: number[];
  rows: number[];
  cols: number[];
  boxes: number[];
}

function initState(grid: readonly number[]): SearchState | null {
  if (!isConsistent(grid)) return null;
  const state: SearchState = { grid: [...grid], rows: new Array(9).fill(0), cols: new Array(9).fill(0), boxes: new Array(9).fill(0) };
  for (let cell = 0; cell < CELLS; cell++) {
    const v = grid[cell]!;
    if (!v) continue;
    const bit = 1 << v;
    state.rows[rowOf(cell)]! |= bit;
    state.cols[colOf(cell)]! |= bit;
    state.boxes[boxOf(cell)]! |= bit;
  }
  return state;
}

export function countSolutions(grid: readonly number[], limit = 2, onSolution?: (solution: Grid) => void): number {
  const s = initState(grid);
  if (!s) return 0;
  let found = 0;

  const search = (): boolean => {
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let cell = 0; cell < CELLS; cell++) {
      if (s.grid[cell]) continue;
      const mask = ALL_DIGITS & ~(s.rows[rowOf(cell)]! | s.cols[colOf(cell)]! | s.boxes[boxOf(cell)]!);
      const count = popcount(mask);
      if (count < bestCount) {
        best = cell;
        bestMask = mask;
        bestCount = count;
        if (count <= 1) break;
      }
    }
    if (best === -1) {
      found++;
      onSolution?.([...s.grid]);
      return found >= limit;
    }
    if (bestCount === 0) return false;
    const r = rowOf(best);
    const c = colOf(best);
    const b = boxOf(best);
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      if (!(bestMask & bit)) continue;
      s.grid[best] = d;
      s.rows[r]! |= bit;
      s.cols[c]! |= bit;
      s.boxes[b]! |= bit;
      const stop = search();
      s.grid[best] = 0;
      s.rows[r]! &= ~bit;
      s.cols[c]! &= ~bit;
      s.boxes[b]! &= ~bit;
      if (stop) return true;
    }
    return false;
  };

  search();
  return found;
}

export function solveUnique(grid: readonly number[]): Grid | null {
  let solution: Grid | null = null;
  const count = countSolutions(grid, 2, (s) => {
    solution ??= s;
  });
  return count === 1 ? solution : null;
}

export function randomSolution(rng: () => number): Grid {
  const grid = new Array<number>(CELLS).fill(0);
  const rows = new Array<number>(9).fill(0);
  const cols = new Array<number>(9).fill(0);
  const boxes = new Array<number>(9).fill(0);
  const fill = (cell: number): boolean => {
    if (cell === CELLS) return true;
    const r = rowOf(cell);
    const c = colOf(cell);
    const b = boxOf(cell);
    const digits = digitsOf(ALL_DIGITS & ~(rows[r]! | cols[c]! | boxes[b]!));
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [digits[i], digits[j]] = [digits[j]!, digits[i]!];
    }
    for (const d of digits) {
      const bit = 1 << d;
      grid[cell] = d;
      rows[r]! |= bit;
      cols[c]! |= bit;
      boxes[b]! |= bit;
      if (fill(cell + 1)) return true;
      rows[r]! &= ~bit;
      cols[c]! &= ~bit;
      boxes[b]! &= ~bit;
    }
    grid[cell] = 0;
    return false;
  };
  fill(0);
  return grid;
}
