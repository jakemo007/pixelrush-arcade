import type { Rng } from '@/lib/utils/random';
import type { Grid } from './solver';

export interface SudokuTransform {
  digitMap: number[];
  rowOrder: number[];
  colOrder: number[];
  transpose: boolean;
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

function bandOrder(rng: Rng): number[] {
  const bands = shuffle([0, 1, 2], rng);
  const order: number[] = [];
  for (const band of bands) for (const offset of shuffle([0, 1, 2], rng)) order.push(band * 3 + offset);
  return order;
}

export function randomTransform(rng: Rng): SudokuTransform {
  return {
    digitMap: [0, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)],
    rowOrder: bandOrder(rng),
    colOrder: bandOrder(rng),
    transpose: rng() < 0.5,
  };
}

export const IDENTITY: SudokuTransform = {
  digitMap: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  rowOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  colOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  transpose: false,
};

export function applyTransform(grid: readonly number[], t: SudokuTransform): Grid {
  const out = new Array<number>(81).fill(0);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const sr = t.rowOrder[r]!;
      const sc = t.colOrder[c]!;
      const v = t.transpose ? grid[sc * 9 + sr]! : grid[sr * 9 + sc]!;
      out[r * 9 + c] = v === 0 ? 0 : t.digitMap[v]!;
    }
  }
  return out;
}
