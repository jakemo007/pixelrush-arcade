import { candidatesOf, findSingle } from './logic';
import { CELLS, PEERS, UNITS, type Grid } from './solver';

export interface SudokuState {
  values: number[];
  notes: number[];
  hinted: boolean[];
}

export function initialState(puzzle: readonly number[]): SudokuState {
  return {
    values: [...puzzle],
    notes: new Array<number>(CELLS).fill(0),
    hinted: new Array<boolean>(CELLS).fill(false),
  };
}

export function isEditable(puzzle: readonly number[], state: SudokuState, cell: number): boolean {
  return puzzle[cell] === 0 && !state.hinted[cell];
}

export function setValue(puzzle: readonly number[], state: SudokuState, cell: number, digit: number): SudokuState {
  if (!isEditable(puzzle, state, cell)) return state;
  if (state.values[cell] === digit && (digit !== 0 || state.notes[cell] === 0)) return state;
  const values = [...state.values];
  const notes = [...state.notes];
  values[cell] = digit;
  notes[cell] = 0;
  if (digit) {
    const bit = 1 << digit;
    for (const p of PEERS[cell]!) notes[p]! &= ~bit;
  }
  return { ...state, values, notes };
}

export function toggleNote(puzzle: readonly number[], state: SudokuState, cell: number, digit: number): SudokuState {
  if (!isEditable(puzzle, state, cell) || state.values[cell] !== 0 || digit < 1 || digit > 9) return state;
  const notes = [...state.notes];
  notes[cell]! ^= 1 << digit;
  return { ...state, notes };
}

export function applyHint(state: SudokuState, cell: number, solution: readonly number[]): SudokuState {
  const values = [...state.values];
  const notes = [...state.notes];
  const hinted = [...state.hinted];
  const digit = solution[cell]!;
  values[cell] = digit;
  notes[cell] = 0;
  hinted[cell] = true;
  const bit = 1 << digit;
  for (const p of PEERS[cell]!) notes[p]! &= ~bit;
  return { values, notes, hinted };
}

export function findConflicts(values: readonly number[]): Set<number> {
  const out = new Set<number>();
  for (const unit of UNITS) {
    const byDigit = new Map<number, number[]>();
    for (const cell of unit) {
      const v = values[cell]!;
      if (!v) continue;
      const list = byDigit.get(v);
      if (list) list.push(cell);
      else byDigit.set(v, [cell]);
    }
    for (const cells of byDigit.values()) if (cells.length > 1) for (const c of cells) out.add(c);
  }
  return out;
}

export function findMistakes(values: readonly number[], solution: readonly number[]): Set<number> {
  const out = new Set<number>();
  for (let c = 0; c < CELLS; c++) if (values[c] && values[c] !== solution[c]) out.add(c);
  return out;
}

export function isComplete(values: readonly number[], solution: readonly number[]): boolean {
  for (let c = 0; c < CELLS; c++) if (values[c] !== solution[c]) return false;
  return true;
}

export function digitCounts(values: readonly number[]): number[] {
  const counts = new Array<number>(10).fill(0);
  for (const v of values) if (v) counts[v]!++;
  return counts;
}

export interface Hint {
  cell: number;
  digit: number;
  reason: string;
}

export function chooseHint(puzzle: readonly number[], state: SudokuState, solution: readonly number[], selected: number | null): Hint | null {
  const needsHelp = (c: number) => isEditable(puzzle, state, c) && state.values[c] !== solution[c];
  if (selected !== null && needsHelp(selected)) {
    return { cell: selected, digit: solution[selected]!, reason: state.values[selected] ? 'That digit was wrong' : 'Filled the selected cell' };
  }
  for (let c = 0; c < CELLS; c++) {
    if (state.values[c] && needsHelp(c)) return { cell: c, digit: solution[c]!, reason: 'Fixed a wrong digit' };
  }
  const correct: Grid = state.values.map((v, c) => (v === solution[c] ? v : 0));
  const single = findSingle(correct);
  if (single && needsHelp(single.cell)) {
    return {
      cell: single.cell,
      digit: single.digit,
      reason: single.kind === 'naked-single' ? 'It is the only digit that fits there' : 'It is the only place that digit fits in its row, column or box',
    };
  }
  const cand = candidatesOf(correct);
  let best = -1;
  let bestCount = 10;
  for (let c = 0; c < CELLS; c++) {
    if (!needsHelp(c)) continue;
    let n = 0;
    for (let d = 1; d <= 9; d++) if (cand[c]! & (1 << d)) n++;
    if (n < bestCount) {
      best = c;
      bestCount = n;
    }
  }
  return best === -1 ? null : { cell: best, digit: solution[best]!, reason: 'Filled a cell for you' };
}
