import { ALL_DIGITS, BOX_UNITS, CELLS, COL_UNITS, PEERS, ROW_UNITS, UNITS, boxOf, colOf, popcount, rowOf, type Grid } from './solver';

export type Technique =
  | 'naked-single'
  | 'hidden-single'
  | 'pointing'
  | 'box-line'
  | 'naked-pair'
  | 'hidden-pair'
  | 'naked-triple'
  | 'hidden-triple'
  | 'x-wing'
  | 'xy-wing'
  | 'swordfish'
  | 'naked-quad'
  | 'hidden-quad';

export type Level = 1 | 2 | 3;

export const TECHNIQUE_LEVEL: Record<Technique, Level> = {
  'naked-single': 1,
  'hidden-single': 1,
  pointing: 2,
  'box-line': 2,
  'naked-pair': 2,
  'hidden-pair': 2,
  'naked-triple': 3,
  'hidden-triple': 3,
  'x-wing': 3,
  'xy-wing': 3,
  swordfish: 3,
  'naked-quad': 3,
  'hidden-quad': 3,
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export const LEVEL_DIFFICULTY: Record<Level, Difficulty> = { 1: 'easy', 2: 'medium', 3: 'hard' };

export interface GradeResult {
  solved: boolean;
  level: 0 | Level;
  difficulty: Difficulty | null;
  uses: Partial<Record<Technique, number>>;
  steps: number;
  grid: Grid;
}

export function candidatesOf(values: readonly number[]): number[] {
  const cand = new Array<number>(CELLS).fill(0);
  for (let cell = 0; cell < CELLS; cell++) {
    if (values[cell]) continue;
    let used = 0;
    for (const p of PEERS[cell]!) used |= 1 << values[p]!;
    cand[cell] = ALL_DIGITS & ~used;
  }
  return cand;
}

class Board {
  values: number[];
  cand: number[];
  broken = false;

  constructor(grid: readonly number[]) {
    this.values = [...grid];
    this.cand = candidatesOf(grid);
  }

  get solved(): boolean {
    return this.values.every((v) => v !== 0);
  }

  place(cell: number, digit: number): void {
    this.values[cell] = digit;
    this.cand[cell] = 0;
    const bit = 1 << digit;
    for (const p of PEERS[cell]!) {
      if (this.values[p] === digit) this.broken = true;
      this.cand[p]! &= ~bit;
    }
  }

  eliminate(cell: number, mask: number): boolean {
    if (this.values[cell] || !(this.cand[cell]! & mask)) return false;
    this.cand[cell]! &= ~mask;
    if (this.cand[cell] === 0) this.broken = true;
    return true;
  }

  cellsWith(unit: readonly number[], digit: number): number[] {
    const bit = 1 << digit;
    return unit.filter((c) => !this.values[c] && this.cand[c]! & bit);
  }

  unitHas(unit: readonly number[], digit: number): boolean {
    return unit.some((c) => this.values[c] === digit);
  }
}

function* combinations<T>(items: readonly T[], k: number, start = 0, prefix: T[] = []): Generator<T[]> {
  if (prefix.length === k) {
    yield prefix;
    return;
  }
  for (let i = start; i <= items.length - (k - prefix.length); i++) {
    yield* combinations(items, k, i + 1, [...prefix, items[i]!]);
  }
}

function nakedSingle(b: Board): boolean {
  for (let cell = 0; cell < CELLS; cell++) {
    if (b.values[cell]) continue;
    const mask = b.cand[cell]!;
    if (popcount(mask) === 1) {
      b.place(cell, Math.log2(mask));
      return true;
    }
  }
  return false;
}

function hiddenSingle(b: Board): boolean {
  for (const unit of UNITS) {
    for (let d = 1; d <= 9; d++) {
      if (b.unitHas(unit, d)) continue;
      const cells = b.cellsWith(unit, d);
      if (cells.length === 1) {
        b.place(cells[0]!, d);
        return true;
      }
    }
  }
  return false;
}

function pointing(b: Board): boolean {
  for (const box of BOX_UNITS) {
    for (let d = 1; d <= 9; d++) {
      const cells = b.cellsWith(box, d);
      if (cells.length < 2) continue;
      const bit = 1 << d;
      const r = rowOf(cells[0]!);
      if (cells.every((c) => rowOf(c) === r)) {
        let changed = false;
        for (const c of ROW_UNITS[r]!) if (!box.includes(c)) changed = b.eliminate(c, bit) || changed;
        if (changed) return true;
      }
      const col = colOf(cells[0]!);
      if (cells.every((c) => colOf(c) === col)) {
        let changed = false;
        for (const c of COL_UNITS[col]!) if (!box.includes(c)) changed = b.eliminate(c, bit) || changed;
        if (changed) return true;
      }
    }
  }
  return false;
}

function boxLine(b: Board): boolean {
  for (const line of [...ROW_UNITS, ...COL_UNITS]) {
    for (let d = 1; d <= 9; d++) {
      const cells = b.cellsWith(line, d);
      if (cells.length < 2) continue;
      const box = boxOf(cells[0]!);
      if (!cells.every((c) => boxOf(c) === box)) continue;
      let changed = false;
      for (const c of BOX_UNITS[box]!) if (!line.includes(c)) changed = b.eliminate(c, 1 << d) || changed;
      if (changed) return true;
    }
  }
  return false;
}

function nakedSubset(b: Board, k: number): boolean {
  for (const unit of UNITS) {
    const open = unit.filter((c) => !b.values[c] && popcount(b.cand[c]!) >= 2 && popcount(b.cand[c]!) <= k);
    if (open.length < k) continue;
    for (const combo of combinations(open, k)) {
      let union = 0;
      for (const c of combo) union |= b.cand[c]!;
      if (popcount(union) !== k) continue;
      let changed = false;
      for (const c of unit) if (!combo.includes(c)) changed = b.eliminate(c, union) || changed;
      if (changed) return true;
    }
  }
  return false;
}

function hiddenSubset(b: Board, k: number): boolean {
  for (const unit of UNITS) {
    const digits: number[] = [];
    for (let d = 1; d <= 9; d++) {
      if (b.unitHas(unit, d)) continue;
      const n = b.cellsWith(unit, d).length;
      if (n >= 1 && n <= k) digits.push(d);
    }
    if (digits.length < k) continue;
    for (const combo of combinations(digits, k)) {
      const cells = new Set<number>();
      let mask = 0;
      for (const d of combo) {
        mask |= 1 << d;
        for (const c of b.cellsWith(unit, d)) cells.add(c);
      }
      if (cells.size !== k) continue;
      let changed = false;
      for (const c of cells) changed = b.eliminate(c, ALL_DIGITS & ~mask) || changed;
      if (changed) return true;
    }
  }
  return false;
}

function fish(b: Board, n: number): boolean {
  for (const [bases, covers, coverIndex] of [
    [ROW_UNITS, COL_UNITS, colOf],
    [COL_UNITS, ROW_UNITS, rowOf],
  ] as const) {
    for (let d = 1; d <= 9; d++) {
      const lines: { index: number; positions: Set<number> }[] = [];
      bases.forEach((line, index) => {
        const cells = b.cellsWith(line, d);
        if (cells.length >= 2 && cells.length <= n) lines.push({ index, positions: new Set(cells.map(coverIndex)) });
      });
      if (lines.length < n) continue;
      for (const combo of combinations(lines, n)) {
        const positions = new Set<number>();
        for (const line of combo) for (const p of line.positions) positions.add(p);
        if (positions.size !== n) continue;
        const baseRows = new Set(combo.map((l) => l.index));
        let changed = false;
        for (const p of positions) {
          for (const c of covers[p]!) {
            const baseIndex = bases === ROW_UNITS ? rowOf(c) : colOf(c);
            if (!baseRows.has(baseIndex)) changed = b.eliminate(c, 1 << d) || changed;
          }
        }
        if (changed) return true;
      }
    }
  }
  return false;
}

const sees = (a: number, c: number) => a !== c && PEERS[a]!.includes(c);

function xyWing(b: Board): boolean {
  const bivalue = [];
  for (let cell = 0; cell < CELLS; cell++) if (!b.values[cell] && popcount(b.cand[cell]!) === 2) bivalue.push(cell);
  for (const pivot of bivalue) {
    const pm = b.cand[pivot]!;
    const wings = bivalue.filter((c) => sees(pivot, c) && popcount(b.cand[c]! & pm) === 1);
    for (let i = 0; i < wings.length; i++) {
      for (let j = i + 1; j < wings.length; j++) {
        const x = wings[i]!;
        const y = wings[j]!;
        const xm = b.cand[x]!;
        const ym = b.cand[y]!;
        const sharedWithPivotX = xm & pm;
        const sharedWithPivotY = ym & pm;
        if (sharedWithPivotX === sharedWithPivotY) continue;
        const c = xm & ym & ~pm;
        if (popcount(c) !== 1 || (xm & ~pm) !== c || (ym & ~pm) !== c) continue;
        let changed = false;
        for (let cell = 0; cell < CELLS; cell++) {
          if (cell === pivot || cell === x || cell === y) continue;
          if (sees(cell, x) && sees(cell, y)) changed = b.eliminate(cell, c) || changed;
        }
        if (changed) return true;
      }
    }
  }
  return false;
}

const STEPS: readonly [Technique, (b: Board) => boolean][] = [
  ['naked-single', nakedSingle],
  ['hidden-single', hiddenSingle],
  ['pointing', pointing],
  ['box-line', boxLine],
  ['naked-pair', (b) => nakedSubset(b, 2)],
  ['hidden-pair', (b) => hiddenSubset(b, 2)],
  ['naked-triple', (b) => nakedSubset(b, 3)],
  ['hidden-triple', (b) => hiddenSubset(b, 3)],
  ['x-wing', (b) => fish(b, 2)],
  ['xy-wing', xyWing],
  ['swordfish', (b) => fish(b, 3)],
  ['naked-quad', (b) => nakedSubset(b, 4)],
  ['hidden-quad', (b) => hiddenSubset(b, 4)],
];

export function grade(puzzle: readonly number[], maxLevel: Level = 3): GradeResult {
  const b = new Board(puzzle);
  const uses: Partial<Record<Technique, number>> = {};
  let level: 0 | Level = 0;
  let steps = 0;
  let guard = 0;
  while (!b.solved && !b.broken && guard++ < 2000) {
    let progressed = false;
    for (const [name, step] of STEPS) {
      const lvl = TECHNIQUE_LEVEL[name];
      if (lvl > maxLevel) break;
      if (step(b)) {
        uses[name] = (uses[name] ?? 0) + 1;
        if (lvl > level) level = lvl;
        steps++;
        progressed = true;
        break;
      }
    }
    if (!progressed) break;
  }
  const solved = b.solved && !b.broken;
  if (solved && level === 0 && puzzle.some((v) => v === 0)) level = 1;
  return {
    solved,
    level,
    difficulty: solved && level > 0 ? LEVEL_DIFFICULTY[level as Level] : solved ? 'easy' : null,
    uses,
    steps,
    grid: b.values,
  };
}

export function findSingle(values: readonly number[]): { cell: number; digit: number; kind: 'naked-single' | 'hidden-single' } | null {
  const b = new Board(values);
  for (let cell = 0; cell < CELLS; cell++) {
    if (!b.values[cell] && popcount(b.cand[cell]!) === 1) return { cell, digit: Math.log2(b.cand[cell]!), kind: 'naked-single' };
  }
  for (const unit of UNITS) {
    for (let d = 1; d <= 9; d++) {
      if (b.unitHas(unit, d)) continue;
      const cells = b.cellsWith(unit, d);
      if (cells.length === 1) return { cell: cells[0]!, digit: d, kind: 'hidden-single' };
    }
  }
  return null;
}
