import type { Rng } from '@/lib/utils/random';

export const SIZE = 4;
export const WIN_VALUE = 2048;
export const FOUR_CHANCE = 0.1;

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Grid = number[][];

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
}

export function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0));
}

export function slideLine(line: readonly number[]): { line: number[]; gained: number; moved: boolean } {
  const values = line.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (values[i + 1] === v) {
      out.push(v * 2);
      gained += v * 2;
      i++;
    } else {
      out.push(v);
    }
  }
  while (out.length < line.length) out.push(0);
  return { line: out, gained, moved: out.some((v, i) => v !== line[i]) };
}

export function lineCells(dir: Direction, index: number): [number, number][] {
  const cells: [number, number][] = [];
  for (let k = 0; k < SIZE; k++) {
    switch (dir) {
      case 'left':
        cells.push([index, k]);
        break;
      case 'right':
        cells.push([index, SIZE - 1 - k]);
        break;
      case 'up':
        cells.push([k, index]);
        break;
      case 'down':
        cells.push([SIZE - 1 - k, index]);
        break;
    }
  }
  return cells;
}

export function move(grid: Grid, dir: Direction): { grid: Grid; gained: number; moved: boolean } {
  const next = emptyGrid();
  let gained = 0;
  let moved = false;
  for (let i = 0; i < SIZE; i++) {
    const cells = lineCells(dir, i);
    const result = slideLine(cells.map(([r, c]) => grid[r]![c]!));
    gained += result.gained;
    moved ||= result.moved;
    cells.forEach(([r, c], k) => {
      next[r]![c] = result.line[k]!;
    });
  }
  return { grid: next, gained, moved };
}

export function emptyCells(grid: Grid): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r]![c] === 0) out.push([r, c]);
  return out;
}

export function canMove(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r]![c]!;
      if (v === 0) return true;
      if (c + 1 < SIZE && grid[r]![c + 1] === v) return true;
      if (r + 1 < SIZE && grid[r + 1]![c] === v) return true;
    }
  }
  return false;
}

export function maxTile(grid: Grid): number {
  let max = 0;
  for (const row of grid) for (const v of row) max = Math.max(max, v);
  return max;
}

export function newTileValue(rng: Rng): number {
  return rng() < FOUR_CHANCE ? 4 : 2;
}

export function tilesToGrid(tiles: readonly Tile[]): Grid {
  const grid = emptyGrid();
  for (const t of tiles) grid[t.row]![t.col] = t.value;
  return grid;
}

export interface TileMove {
  tiles: Tile[];
  removed: Tile[];
  merged: number[];
  gained: number;
  moved: boolean;
  nextId: number;
}

export function moveTiles(tiles: readonly Tile[], dir: Direction, nextId: number): TileMove {
  const at = new Map<string, Tile>();
  for (const t of tiles) at.set(`${t.row},${t.col}`, t);
  const out: Tile[] = [];
  const removed: Tile[] = [];
  const merged: number[] = [];
  let gained = 0;
  let moved = false;
  let id = nextId;

  for (let i = 0; i < SIZE; i++) {
    const cells = lineCells(dir, i);
    const line = cells.map(([r, c]) => at.get(`${r},${c}`)).filter((t): t is Tile => t !== undefined);
    let slot = 0;
    for (let k = 0; k < line.length; k++) {
      const tile = line[k]!;
      const partner = line[k + 1];
      const [row, col] = cells[slot]!;
      if (partner && partner.value === tile.value) {
        const value = tile.value * 2;
        out.push({ id: id++, value, row, col });
        merged.push(id - 1);
        removed.push({ ...tile, row, col }, { ...partner, row, col });
        gained += value;
        moved = true;
        k++;
      } else {
        if (tile.row !== row || tile.col !== col) moved = true;
        out.push({ ...tile, row, col });
      }
      slot++;
    }
  }
  return { tiles: out, removed, merged, gained, moved, nextId: id };
}

export function spawnTile(tiles: readonly Tile[], rng: Rng, id: number): Tile | null {
  const free = emptyCells(tilesToGrid(tiles));
  if (free.length === 0) return null;
  const [row, col] = free[Math.floor(rng() * free.length)]!;
  return { id, value: newTileValue(rng), row, col };
}

export function startTiles(rng: Rng): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i < 2; i++) {
    const t = spawnTile(tiles, rng, i + 1);
    if (t) tiles.push(t);
  }
  return tiles;
}
