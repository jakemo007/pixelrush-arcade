import { BS_WIDTH, BubbleGrid, COLS, DIAMETER, EMPTY, RADIUS, ROW_H, TOP } from './grid';

export const SHOT_SPEED = 1150;
export const MAX_SUBSTEP = 4;
export const HIT_DIST = DIAMETER - 6;

export interface FlyingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
}

export function touchesGrid(grid: BubbleGrid, x: number, y: number): boolean {
  if (y - RADIUS <= TOP) return true;
  const approx = Math.round((y - TOP - RADIUS) / ROW_H);
  const hit2 = HIT_DIST * HIT_DIST;
  for (let r = Math.max(0, approx - 1); r <= approx + 1 && r < grid.rows.length; r++) {
    const row = grid.rows[r]!;
    const cy = BubbleGrid.cellY(r);
    const dy = cy - y;
    if (dy * dy >= hit2) continue;
    for (let c = 0; c < COLS; c++) {
      if (row[c] === EMPTY) continue;
      const dx = grid.cellX(r, c) - x;
      if (dx * dx + dy * dy < hit2) return true;
    }
  }
  return false;
}

function bankOffWalls(b: { x: number; vx: number }): boolean {
  if (b.x < RADIUS) {
    b.x = RADIUS + (RADIUS - b.x);
    b.vx = Math.abs(b.vx);
    return true;
  }
  if (b.x > BS_WIDTH - RADIUS) {
    b.x = BS_WIDTH - RADIUS - (b.x - (BS_WIDTH - RADIUS));
    b.vx = -Math.abs(b.vx);
    return true;
  }
  return false;
}

export interface AdvanceResult {
  landed: boolean;
  banks: number;
}

export function advanceShot(grid: BubbleGrid, b: FlyingBubble, dt: number): AdvanceResult {
  const speed = Math.hypot(b.vx, b.vy);
  const steps = Math.max(1, Math.ceil((speed * dt) / MAX_SUBSTEP));
  const sub = dt / steps;
  let banks = 0;
  for (let i = 0; i < steps; i++) {
    b.x += b.vx * sub;
    b.y += b.vy * sub;
    if (bankOffWalls(b)) banks++;
    if (touchesGrid(grid, b.x, b.y)) return { landed: true, banks };
  }
  return { landed: false, banks };
}

export function traceAim(
  grid: BubbleGrid,
  x: number,
  y: number,
  angle: number,
  maxBanks: number,
  xs: Float32Array,
  ys: Float32Array,
  spacing = 20,
): number {
  const b = { x, y, vx: Math.cos(angle), vy: Math.sin(angle) };
  let travelled = 0;
  let nextDot = spacing;
  let count = 0;
  let banks = 0;
  const limit = xs.length;
  for (let i = 0; i < 4000 && count < limit; i++) {
    b.x += b.vx * 2;
    b.y += b.vy * 2;
    travelled += 2;
    if (bankOffWalls(b)) {
      banks++;
      if (banks > maxBanks) break;
    }
    if (touchesGrid(grid, b.x, b.y)) break;
    if (travelled >= nextDot) {
      xs[count] = b.x;
      ys[count] = b.y;
      count++;
      nextDot += spacing;
    }
  }
  if (count < limit) {
    xs[count] = b.x;
    ys[count] = b.y;
    count++;
  }
  return count;
}
