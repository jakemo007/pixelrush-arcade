import { createRng, type Rng } from '@/lib/utils/random';
import type { Layout, Position } from './layouts';
import { matchGroup, pairUp, tileSetFor, type TileKind } from './tiles';

export interface Geometry {
  positions: readonly Position[];
  above: number[][];
  below: number[][];
  left: number[][];
  right: number[][];
}

const overlaps = (a: Position, b: Position) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;

export function buildGeometry(positions: readonly Position[]): Geometry {
  const n = positions.length;
  const g: Geometry = { positions, above: [], below: [], left: [], right: [] };
  for (let i = 0; i < n; i++) {
    g.above.push([]);
    g.below.push([]);
    g.left.push([]);
    g.right.push([]);
  }
  for (let i = 0; i < n; i++) {
    const a = positions[i]!;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = positions[j]!;
      if (b.z === a.z + 1 && overlaps(a, b)) g.above[i]!.push(j);
      if (b.z === a.z - 1 && overlaps(a, b)) g.below[i]!.push(j);
      if (b.z === a.z && Math.abs(a.y - b.y) < 2) {
        if (b.x === a.x - 2) g.left[i]!.push(j);
        if (b.x === a.x + 2) g.right[i]!.push(j);
      }
    }
  }
  return g;
}

export type Tiles = (TileKind | null)[];

export function isFree(g: Geometry, tiles: Tiles, i: number): boolean {
  if (!tiles[i]) return false;
  if (g.above[i]!.some((j) => tiles[j])) return false;
  const leftOpen = !g.left[i]!.some((j) => tiles[j]);
  const rightOpen = !g.right[i]!.some((j) => tiles[j]);
  return leftOpen || rightOpen;
}

export function freeTiles(g: Geometry, tiles: Tiles): number[] {
  const out: number[] = [];
  for (let i = 0; i < tiles.length; i++) if (isFree(g, tiles, i)) out.push(i);
  return out;
}

export function availablePairs(g: Geometry, tiles: Tiles): [number, number][] {
  const free = freeTiles(g, tiles);
  const pairs: [number, number][] = [];
  for (let a = 0; a < free.length; a++) {
    for (let b = a + 1; b < free.length; b++) {
      const i = free[a]!;
      const j = free[b]!;
      if (matchGroup(tiles[i]!) === matchGroup(tiles[j]!)) pairs.push([i, j]);
    }
  }
  return pairs;
}

export function canRemove(g: Geometry, tiles: Tiles, i: number, j: number): boolean {
  return i !== j && isFree(g, tiles, i) && isFree(g, tiles, j) && matchGroup(tiles[i]!) === matchGroup(tiles[j]!);
}

export function remainingCount(tiles: Tiles): number {
  return tiles.reduce((n, t) => n + (t ? 1 : 0), 0);
}

export function isStuck(g: Geometry, tiles: Tiles): boolean {
  return remainingCount(tiles) > 0 && availablePairs(g, tiles).length === 0;
}

function freeAmong(g: Geometry, placed: boolean[], p: number): boolean {
  if (g.above[p]!.some((j) => placed[j])) return false;
  return !g.left[p]!.some((j) => placed[j]) || !g.right[p]!.some((j) => placed[j]);
}

function opensToEdge(g: Geometry, placed: boolean[], start: number, side: 'left' | 'right', active: boolean[], seen = new Set<number>()): boolean {
  if (seen.has(start)) return true;
  seen.add(start);
  const next = (side === 'left' ? g.left : g.right)[start]!.filter((j) => active[j]);
  if (next.length === 0) return true;
  if (next.some((j) => placed[j])) return false;
  return next.every((j) => opensToEdge(g, placed, j, side, active, seen));
}

function placeable(g: Geometry, placed: boolean[], active: boolean[], p: number): boolean {
  if (!active[p] || placed[p]) return false;
  if (!g.below[p]!.filter((j) => active[j]).every((j) => placed[j])) return false;
  placed[p] = true;
  let ok = freeAmong(g, placed, p);
  if (ok) {
    for (const side of ['left', 'right'] as const) {
      for (const q of (side === 'left' ? g.left : g.right)[p]!) {
        if (active[q] && !placed[q] && !opensToEdge(g, placed, q, side, active)) ok = false;
      }
    }
  }
  placed[p] = false;
  return ok;
}

export function constructOrder(g: Geometry, active: boolean[], rng: Rng): [number, number][] | null {
  const placed = new Array<boolean>(active.length).fill(false);
  const total = active.filter(Boolean).length;
  const built: [number, number][] = [];
  const all = active.flatMap((a, i) => (a ? [i] : []));
  for (let placedCount = 0; placedCount < total; placedCount += 2) {
    const firsts = all.filter((p) => placeable(g, placed, active, p));
    let done = false;
    for (let k = firsts.length - 1; k >= 0 && !done; k--) {
      const pick = Math.floor(rng() * (k + 1));
      [firsts[k], firsts[pick]] = [firsts[pick]!, firsts[k]!];
      const p1 = firsts[k]!;
      placed[p1] = true;
      const seconds = all.filter((p) => placeable(g, placed, active, p));
      while (seconds.length > 0) {
        const idx = Math.floor(rng() * seconds.length);
        const p2 = seconds[idx]!;
        placed[p2] = true;
        if (freeAmong(g, placed, p1) && freeAmong(g, placed, p2)) {
          built.push([p1, p2]);
          done = true;
          break;
        }
        placed[p2] = false;
        seconds.splice(idx, 1);
      }
      if (!done) placed[p1] = false;
    }
    if (!done) return null;
  }
  return built.reverse();
}

function shuffled<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

export interface Deal {
  tiles: Tiles;
  solution: [number, number][];
}

function assign(size: number, order: [number, number][], kinds: readonly TileKind[], rng: Rng): Tiles {
  const pairs = shuffled(pairUp(kinds), rng);
  const tiles: Tiles = new Array<TileKind | null>(size).fill(null);
  order.forEach(([a, b], i) => {
    const [k1, k2] = rng() < 0.5 ? pairs[i]! : [pairs[i]![1], pairs[i]![0]];
    tiles[a] = k1;
    tiles[b] = k2;
  });
  return tiles;
}

export function generateDeal(layout: Layout, seed: number, g: Geometry = buildGeometry(layout.positions)): Deal {
  const rng = createRng(seed);
  const active = new Array<boolean>(layout.positions.length).fill(true);
  for (let attempt = 0; attempt < 500; attempt++) {
    const order = constructOrder(g, active, rng);
    if (order) return { tiles: assign(active.length, order, tileSetFor(active.length), rng), solution: order };
  }
  throw new Error(`Could not deal layout ${layout.id}`);
}

export function replaySolution(g: Geometry, tiles: Tiles, order: readonly [number, number][]): boolean {
  const board = [...tiles];
  for (const [a, b] of order) {
    if (!canRemove(g, board, a, b)) return false;
    board[a] = null;
    board[b] = null;
  }
  return remainingCount(board) === 0;
}

export interface ShuffleResult {
  tiles: Tiles;
  solution: [number, number][];
  moved: boolean;
}

export function shuffleRemaining(g: Geometry, tiles: Tiles, seed: number): ShuffleResult {
  const rng = createRng(seed);
  const kinds = tiles.filter((t): t is TileKind => t !== null);
  const active = tiles.map((t) => t !== null);
  for (let attempt = 0; attempt < 300; attempt++) {
    const order = constructOrder(g, active, rng);
    if (order) return { tiles: assign(tiles.length, order, kinds, rng), solution: order, moved: false };
  }
  const byLayer = g.positions
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.z - b.p.z || a.p.y - b.p.y || a.p.x - b.p.x)
    .slice(0, kinds.length)
    .map((e) => e.i);
  const fallback = new Array<boolean>(tiles.length).fill(false);
  for (const i of byLayer) fallback[i] = true;
  for (let attempt = 0; attempt < 300; attempt++) {
    const order = constructOrder(g, fallback, rng);
    if (order) return { tiles: assign(tiles.length, order, kinds, rng), solution: order, moved: true };
  }
  throw new Error('Could not shuffle');
}

export function suggestPair(g: Geometry, tiles: Tiles): [number, number] | null {
  const pairs = availablePairs(g, tiles);
  if (pairs.length === 0) return null;
  let best = pairs[0]!;
  let bestScore = -1;
  const before = freeTiles(g, tiles).length;
  for (const [a, b] of pairs) {
    const board = [...tiles];
    board[a] = null;
    board[b] = null;
    const score = freeTiles(g, board).length - before + (availablePairs(g, board).length > 0 || remainingCount(board) === 0 ? 100 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  return best;
}
