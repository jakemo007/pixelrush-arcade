export const BS_WIDTH = 480;
export const BS_HEIGHT = 720;
export const RADIUS = 20;
export const DIAMETER = RADIUS * 2;
export const COLS = 12;
export const ROW_H = RADIUS * Math.sqrt(3);
export const TOP = 8;
export const DANGER_Y = 596;
export const MAX_ROWS = Math.floor((DANGER_Y - TOP - DIAMETER) / ROW_H) + 1;
export const EMPTY = -1;

export interface Cell {
  row: number;
  col: number;
}

export class BubbleGrid {
  rows: number[][] = [];
  topShift: 0 | 1 = 0;

  static fromRows(rows: readonly (readonly number[])[], topShift: 0 | 1 = 0): BubbleGrid {
    const grid = new BubbleGrid();
    grid.topShift = topShift;
    grid.rows = rows.map((row, r) => {
      const out = new Array<number>(COLS).fill(EMPTY);
      const len = grid.rowLength(r);
      for (let c = 0; c < len; c++) out[c] = row[c] ?? EMPTY;
      return out;
    });
    grid.trim();
    return grid;
  }

  clone(): BubbleGrid {
    const g = new BubbleGrid();
    g.topShift = this.topShift;
    g.rows = this.rows.map((r) => r.slice());
    return g;
  }

  isShifted(row: number): boolean {
    return ((row + this.topShift) & 1) === 1;
  }

  rowLength(row: number): number {
    return this.isShifted(row) ? COLS - 1 : COLS;
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && col >= 0 && col < this.rowLength(row);
  }

  get(row: number, col: number): number {
    if (!this.inBounds(row, col)) return EMPTY;
    return this.rows[row]?.[col] ?? EMPTY;
  }

  set(row: number, col: number, color: number): void {
    if (!this.inBounds(row, col)) return;
    while (this.rows.length <= row) this.rows.push(new Array<number>(COLS).fill(EMPTY));
    this.rows[row]![col] = color;
  }

  trim(): void {
    while (this.rows.length > 0 && this.rows[this.rows.length - 1]!.every((c) => c === EMPTY)) this.rows.pop();
  }

  cellX(row: number, col: number): number {
    return RADIUS + col * DIAMETER + (this.isShifted(row) ? RADIUS : 0);
  }

  static cellY(row: number): number {
    return TOP + RADIUS + row * ROW_H;
  }

  neighbors(row: number, col: number): Cell[] {
    const out: Cell[] = [];
    const add = (r: number, c: number) => {
      if (this.inBounds(r, c)) out.push({ row: r, col: c });
    };
    add(row, col - 1);
    add(row, col + 1);
    const [a, b] = this.isShifted(row) ? [col, col + 1] : [col - 1, col];
    for (const r of [row - 1, row + 1]) {
      add(r, a);
      add(r, b);
    }
    return out;
  }

  count(): number {
    let n = 0;
    for (const row of this.rows) for (const c of row) if (c !== EMPTY) n++;
    return n;
  }

  colors(): number[] {
    const seen = new Set<number>();
    for (const row of this.rows) for (const c of row) if (c !== EMPTY) seen.add(c);
    return [...seen].sort((a, b) => a - b);
  }

  cluster(row: number, col: number): Cell[] {
    const color = this.get(row, col);
    if (color === EMPTY) return [];
    const seen = new Set<number>([row * COLS + col]);
    const out: Cell[] = [{ row, col }];
    for (let i = 0; i < out.length; i++) {
      const cell = out[i]!;
      for (const n of this.neighbors(cell.row, cell.col)) {
        const key = n.row * COLS + n.col;
        if (seen.has(key) || this.get(n.row, n.col) !== color) continue;
        seen.add(key);
        out.push(n);
      }
    }
    return out;
  }

  floating(): Cell[] {
    const anchored = new Set<number>();
    const queue: Cell[] = [];
    const top = this.rows[0];
    if (top) {
      for (let c = 0; c < this.rowLength(0); c++) {
        if (top[c] !== EMPTY) {
          anchored.add(c);
          queue.push({ row: 0, col: c });
        }
      }
    }
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i]!;
      for (const n of this.neighbors(cell.row, cell.col)) {
        const key = n.row * COLS + n.col;
        if (anchored.has(key) || this.get(n.row, n.col) === EMPTY) continue;
        anchored.add(key);
        queue.push(n);
      }
    }
    const out: Cell[] = [];
    this.rows.forEach((row, r) => {
      for (let c = 0; c < this.rowLength(r); c++) {
        if (row[c] !== EMPTY && !anchored.has(r * COLS + c)) out.push({ row: r, col: c });
      }
    });
    return out;
  }

  canAttach(row: number, col: number): boolean {
    if (!this.inBounds(row, col) || this.get(row, col) !== EMPTY) return false;
    if (row === 0) return true;
    return this.neighbors(row, col).some((n) => this.get(n.row, n.col) !== EMPTY);
  }

  snap(x: number, y: number): Cell | null {
    const approxRow = Math.max(0, Math.round((y - TOP - RADIUS) / ROW_H));
    let best: Cell | null = null;
    let bestD = Infinity;
    const consider = (r: number, c: number) => {
      if (!this.canAttach(r, c)) return;
      const dx = this.cellX(r, c) - x;
      const dy = BubbleGrid.cellY(r) - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = { row: r, col: c };
      }
    };
    for (let r = Math.max(0, approxRow - 1); r <= approxRow + 1; r++) {
      for (let c = 0; c < this.rowLength(r); c++) consider(r, c);
    }
    if (best) return best;
    const maxRow = Math.max(this.rows.length, approxRow + 1);
    for (let r = 0; r <= maxRow; r++) for (let c = 0; c < this.rowLength(r); c++) consider(r, c);
    return best;
  }

  pushRow(colors: readonly number[]): void {
    this.topShift = this.topShift === 0 ? 1 : 0;
    const row = new Array<number>(COLS).fill(EMPTY);
    const len = this.rowLength(0);
    for (let c = 0; c < len; c++) row[c] = colors[c] ?? EMPTY;
    this.rows.unshift(row);
    this.trim();
  }

  lowestRow(): number {
    for (let r = this.rows.length - 1; r >= 0; r--) {
      if (this.rows[r]!.some((c) => c !== EMPTY)) return r;
    }
    return -1;
  }

  crossesDanger(): boolean {
    const low = this.lowestRow();
    return low >= 0 && BubbleGrid.cellY(low) + RADIUS > DANGER_Y;
  }

  remove(cells: readonly Cell[]): void {
    for (const c of cells) {
      const row = this.rows[c.row];
      if (row) row[c.col] = EMPTY;
    }
    this.trim();
  }
}
