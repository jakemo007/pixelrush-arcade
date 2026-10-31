import { describe, expect, it } from 'vitest';
import { BubbleGrid, COLS, DANGER_Y, DIAMETER, EMPTY, MAX_ROWS, RADIUS, TOP } from '@/games/bubble-shooter/grid';
import { advanceShot, HIT_DIST, MAX_SUBSTEP, traceAim } from '@/games/bubble-shooter/shot';
import { InputManager } from '@/games/engine/input';
import {
  BUBBLE_BINDINGS,
  BubbleShooterSimulation,
  CLEAR_BONUS,
  DROP_POINTS,
  generateRows,
  levelConfig,
  POP_POINTS,
  SHOOTER_X,
  SHOOTER_Y,
  type BubbleAction,
} from '@/games/bubble-shooter/simulation';
import { createRng } from '@/lib/utils/random';
import { makeInput, STEP } from '../helpers';

const ACTIONS: readonly BubbleAction[] = ['left', 'right', 'fire', 'swap'];
const none = makeInput(ACTIONS);
const fire = makeInput(ACTIONS, { fire: { pressed: true, held: true } });

const sorted = (cells: { row: number; col: number }[]) =>
  cells.map((c) => `${c.row},${c.col}`).sort();

function fullRow(color: number): number[] {
  return new Array<number>(COLS).fill(color);
}

function settle(sim: BubbleShooterSimulation, max = 600): void {
  for (let i = 0; i < max && (sim.phase === 'flying' || sim.phase === 'settle'); i++) sim.update(STEP, none);
}

function aimAt(sim: BubbleShooterSimulation, x: number, y: number): void {
  sim.angle = Math.atan2(y - SHOOTER_Y, x - SHOOTER_X);
}

describe('Bubble Shooter hex grid', () => {
  it('lists neighbours of an unshifted row', () => {
    const grid = BubbleGrid.fromRows([fullRow(0), fullRow(0), fullRow(0), fullRow(0)], 0);
    expect(grid.isShifted(2)).toBe(false);
    expect(sorted(grid.neighbors(2, 5))).toEqual(sorted([
      { row: 2, col: 4 },
      { row: 2, col: 6 },
      { row: 1, col: 4 },
      { row: 1, col: 5 },
      { row: 3, col: 4 },
      { row: 3, col: 5 },
    ]));
  });

  it('lists neighbours of a shifted row', () => {
    const grid = BubbleGrid.fromRows([fullRow(0), fullRow(0), fullRow(0)], 0);
    expect(grid.isShifted(1)).toBe(true);
    expect(sorted(grid.neighbors(1, 5))).toEqual(sorted([
      { row: 1, col: 4 },
      { row: 1, col: 6 },
      { row: 0, col: 5 },
      { row: 0, col: 6 },
      { row: 2, col: 5 },
      { row: 2, col: 6 },
    ]));
  });

  it('places every neighbour exactly one diameter away, for both parities and at the edges', () => {
    for (const topShift of [0, 1] as const) {
      const grid = BubbleGrid.fromRows([fullRow(0), fullRow(0), fullRow(0), fullRow(0)], topShift);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < grid.rowLength(r); c++) {
          const ns = grid.neighbors(r, c);
          expect(ns.length).toBeGreaterThanOrEqual(2);
          expect(ns.length).toBeLessThanOrEqual(6);
          for (const n of ns) {
            const d = Math.hypot(grid.cellX(r, c) - grid.cellX(n.row, n.col), BubbleGrid.cellY(r) - BubbleGrid.cellY(n.row));
            expect(d).toBeCloseTo(DIAMETER, 6);
          }
          for (let r2 = Math.max(0, r - 1); r2 <= r + 1; r2++) {
            for (let c2 = 0; c2 < grid.rowLength(r2); c2++) {
              if (r2 === r && c2 === c) continue;
              const d = Math.hypot(grid.cellX(r, c) - grid.cellX(r2, c2), BubbleGrid.cellY(r) - BubbleGrid.cellY(r2));
              const listed = ns.some((n) => n.row === r2 && n.col === c2);
              expect(listed).toBe(Math.abs(d - DIAMETER) < 1e-6);
            }
          }
        }
      }
    }
  });

  it('keeps shifted rows inside the walls', () => {
    const grid = BubbleGrid.fromRows([fullRow(0), fullRow(0)], 0);
    expect(grid.rowLength(0)).toBe(COLS);
    expect(grid.rowLength(1)).toBe(COLS - 1);
    expect(grid.cellX(1, COLS - 1 - 1) + RADIUS).toBeLessThanOrEqual(480);
    expect(grid.inBounds(1, COLS - 1)).toBe(false);
  });

  it('finds connected same-colour clusters across rows', () => {
    const grid = BubbleGrid.fromRows([
      [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [3, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    ]);
    expect(sorted(grid.cluster(0, 0))).toEqual(sorted([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
    ]));
    expect(grid.cluster(1, 0)).toHaveLength(2);
  });

  it('detects bubbles no longer connected to the ceiling', () => {
    const grid = BubbleGrid.fromRows([
      [0, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      [0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      [-1, 1, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
      [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    ]);
    expect(grid.floating()).toEqual([]);
    grid.remove([{ row: 1, col: 0 }]);
    expect(sorted(grid.floating())).toEqual(['2,1', '2,2']);
  });

  it('snaps a landing bubble to the nearest free attachable cell', () => {
    const grid = BubbleGrid.fromRows([fullRow(0)], 0);
    const target = { x: grid.cellX(0, 4) + RADIUS, y: BubbleGrid.cellY(0) + HIT_DIST };
    const cell = grid.snap(target.x, target.y);
    expect(cell).toEqual({ row: 1, col: 4 });
    const empty = new BubbleGrid();
    expect(empty.snap(100, TOP + RADIUS + 1)).toEqual({ row: 0, col: 2 });
  });

  it('pushes a new row in at the top without moving bubbles sideways', () => {
    const grid = BubbleGrid.fromRows([fullRow(2), fullRow(3)], 0);
    const xBefore = grid.cellX(0, 3);
    grid.pushRow(fullRow(4));
    expect(grid.topShift).toBe(1);
    expect(grid.rows).toHaveLength(3);
    expect(grid.get(0, 0)).toBe(4);
    expect(grid.get(1, 3)).toBe(2);
    expect(grid.cellX(1, 3)).toBeCloseTo(xBefore);
    expect(grid.get(0, COLS - 1)).toBe(EMPTY);
  });

  it('flags a bubble crossing the danger line', () => {
    const rows = Array.from({ length: MAX_ROWS }, () => fullRow(0));
    const grid = BubbleGrid.fromRows(rows);
    expect(grid.crossesDanger()).toBe(false);
    expect(BubbleGrid.cellY(MAX_ROWS - 1) + RADIUS).toBeLessThanOrEqual(DANGER_Y);
    grid.set(MAX_ROWS, 0, 1);
    expect(grid.crossesDanger()).toBe(true);
  });
});

describe('Bubble Shooter shots', () => {
  it('never tunnels through a bubble, even at extreme speed on a long frame', () => {
    const grid = new BubbleGrid();
    grid.set(0, 5, 1);
    grid.set(1, 5, 1);
    const bx = grid.cellX(1, 5);
    const by = BubbleGrid.cellY(1);
    const b = { x: bx, y: 600, vx: 0, vy: -50_000, color: 2 };
    const result = advanceShot(grid, b, 0.05);
    expect(result.landed).toBe(true);
    expect(b.y).toBeGreaterThan(by);
    expect(Math.hypot(b.x - bx, b.y - by)).toBeLessThan(HIT_DIST + 1);
    expect(Math.hypot(b.x - bx, b.y - by)).toBeGreaterThan(HIT_DIST - MAX_SUBSTEP - 1e-6);
  });

  it('banks off a side wall', () => {
    const grid = new BubbleGrid();
    const b = { x: 40, y: 500, vx: -1000, vy: -300, color: 0 };
    let banks = 0;
    for (let i = 0; i < 20; i++) banks += advanceShot(grid, b, STEP).banks;
    expect(banks).toBe(1);
    expect(b.vx).toBeGreaterThan(0);
    expect(b.x).toBeGreaterThanOrEqual(RADIUS);
  });

  it('previews the path up to one wall bank', () => {
    const grid = BubbleGrid.fromRows([fullRow(0)]);
    const xs = new Float32Array(90);
    const ys = new Float32Array(90);
    const n = traceAim(grid, SHOOTER_X, SHOOTER_Y, -Math.PI + 0.3, 1, xs, ys);
    expect(n).toBeGreaterThan(5);
    const minX = Math.min(...Array.from(xs.subarray(0, n)));
    expect(minX).toBeLessThan(RADIUS + 25);
    expect(xs[n - 1]!).toBeGreaterThan(minX);
  });
});

describe('Bubble Shooter simulation', () => {
  it('builds levels from the seed, deterministically', () => {
    const a = generateRows(createRng(5), 6, 4, 0);
    const b = generateRows(createRng(5), 6, 4, 0);
    expect(a.rows).toEqual(b.rows);
    expect(a.colors().every((c) => c >= 0 && c < 4)).toBe(true);
    expect(levelConfig(1).colors).toBe(4);
    expect(levelConfig(6).colors).toBe(6);
    expect(levelConfig(6).pushEvery).toBeLessThan(levelConfig(1).pushEvery);
  });

  it('pops a group of three and drops the bubbles hanging from it', () => {
    const sim = new BubbleShooterSimulation({ seed: 1, modifier: null });
    const rows = [
      [-1, -1, -1, -1, -1, 1, 1, -1, -1, -1, 0, 0],
      [-1, -1, -1, -1, -1, 3, -1, -1, -1, -1, -1],
    ];
    sim.grid = BubbleGrid.fromRows(rows, 0);
    sim.loaded = 1;
    aimAt(sim, sim.grid.cellX(0, 7), BubbleGrid.cellY(0));
    sim.update(STEP, fire);
    expect(sim.phase).toBe('flying');
    settle(sim);
    expect(sim.popped).toBe(3);
    expect(sim.dropped).toBe(1);
    expect(sim.score).toBe(3 * POP_POINTS + DROP_POINTS);
    expect(sim.grid.count()).toBe(2);
    expect(sim.misses).toBe(0);
  });

  it('only loads colours that are still on the board', () => {
    const sim = new BubbleShooterSimulation({ seed: 3, modifier: null });
    sim.grid = BubbleGrid.fromRows([[2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4]]);
    sim.loaded = 2;
    sim.next = 0;
    aimAt(sim, 30, 300);
    sim.update(STEP, fire);
    settle(sim);
    const colors = sim.grid.colors();
    expect(colors).toContain(sim.loaded);
    expect(colors).toContain(sim.next);
  });

  it('swaps the loaded and next bubbles', () => {
    const sim = new BubbleShooterSimulation({ seed: 9, modifier: null });
    sim.loaded = 0;
    sim.next = 1;
    sim.update(STEP, makeInput(ACTIONS, { swap: { pressed: true, held: true } }));
    expect(sim.loaded).toBe(1);
    expect(sim.next).toBe(0);
  });

  it('pushes a new row after enough shots without a pop', () => {
    const sim = new BubbleShooterSimulation({ seed: 2, modifier: null });
    sim.grid = BubbleGrid.fromRows([[0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]]);
    sim.misses = sim.config.pushEvery - 1;
    sim.loaded = 0;
    sim.next = 1;
    aimAt(sim, sim.grid.cellX(0, 1), 200);
    sim.update(STEP, fire);
    settle(sim);
    expect(sim.grid.rows.length).toBeGreaterThanOrEqual(3);
    expect(sim.grid.topShift).toBe(1);
    expect(sim.misses).toBe(0);
    expect(sim.phase).toBe('aim');
  });

  it('ends the game when a bubble crosses the danger line', () => {
    const sim = new BubbleShooterSimulation({ seed: 4, modifier: null });
    const rows = Array.from({ length: MAX_ROWS }, (_, r) => {
      const row = new Array<number>(COLS).fill(r % 2 === 0 ? 0 : 1);
      return row;
    });
    sim.grid = BubbleGrid.fromRows(rows);
    sim.loaded = 2;
    sim.next = 2;
    aimAt(sim, SHOOTER_X, 100);
    sim.update(STEP, fire);
    for (let i = 0; i < 600 && !sim.outcome; i++) sim.update(STEP, none);
    expect(sim.outcome).toBe('lost');
    expect(sim.grid.crossesDanger()).toBe(true);
  });

  it('starts a harder level with the score carried over after a clear', () => {
    const sim = new BubbleShooterSimulation({ seed: 6, modifier: null });
    sim.grid = BubbleGrid.fromRows([[-1, -1, -1, -1, -1, 3, 3, -1, -1, -1, -1, -1]]);
    sim.loaded = 3;
    aimAt(sim, sim.grid.cellX(0, 7), BubbleGrid.cellY(0));
    sim.update(STEP, fire);
    settle(sim);
    expect(sim.phase).toBe('cleared');
    const after = 3 * POP_POINTS + CLEAR_BONUS;
    expect(sim.score).toBe(after);
    for (let i = 0; i < 400; i++) sim.update(STEP, none);
    expect(sim.level).toBe(2);
    expect(sim.score).toBe(after);
    expect(sim.grid.rows.length).toBe(levelConfig(2).rows);
    expect(sim.phase).toBe('aim');
  });

  it('aims with the pointer and fires on release', () => {
    const sim = new BubbleShooterSimulation({ seed: 8, modifier: null });
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, moved: true, down: true, pressed: true, x: 100, y: 300 }));
    expect(sim.angle).toBeCloseTo(Math.atan2(300 - SHOOTER_Y, 100 - SHOOTER_X));
    expect(sim.phase).toBe('aim');
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, released: true, x: 100, y: 300 }));
    expect(sim.phase).toBe('flying');
    expect(sim.shots).toBe(1);
  });

  it('aims a quick touch tap at the tapped point', () => {
    for (const tap of [{ x: 60, y: 300 }, { x: 430, y: 220 }]) {
      const sim = new BubbleShooterSimulation({ seed: 8, modifier: null });
      const input = new InputManager<BubbleAction>(BUBBLE_BINDINGS);
      input.pointerDown(1, tap.x, tap.y);
      input.pointerUp(1, true);
      const snap = input.snapshot();
      expect(snap.pointer).toMatchObject({ inside: false, pressed: true, released: true });
      sim.update(STEP, snap);
      expect(sim.phase).toBe('flying');
      expect(sim.angle).toBeCloseTo(Math.atan2(tap.y - SHOOTER_Y, tap.x - SHOOTER_X));
      expect(Math.sign(sim.flying!.vx)).toBe(Math.sign(tap.x - SHOOTER_X));
    }
  });

  it('spreads quick touch taps across the board instead of stacking one column', () => {
    const sim = new BubbleShooterSimulation({ seed: 12, modifier: null });
    sim.grid = BubbleGrid.fromRows([fullRow(0)]);
    const input = new InputManager<BubbleAction>(BUBBLE_BINDINGS);
    const landed: number[] = [];
    for (const x of [40, 440, 80, 400]) {
      sim.loaded = 1;
      sim.next = 2;
      input.pointerDown(1, x, 120);
      input.pointerUp(1, true);
      sim.update(STEP, input.snapshot());
      const before = sim.grid.rows.length > 1 ? sim.grid.rows[1]!.slice() : [];
      settle(sim);
      const row = sim.grid.rows[1] ?? [];
      landed.push(row.findIndex((c, i) => c !== EMPTY && before[i] !== c));
    }
    expect(landed[0]).toBeLessThan(3);
    expect(landed[1]).toBeGreaterThan(7);
    expect(landed[2]).toBeLessThan(4);
    expect(landed[3]).toBeGreaterThan(6);
  });

  it('keeps the aim within the allowed upward range', () => {
    const sim = new BubbleShooterSimulation({ seed: 8, modifier: null });
    const left = makeInput(ACTIONS, { left: { held: true } });
    for (let i = 0; i < 1200; i++) sim.update(STEP, left);
    expect(sim.angle).toBeGreaterThan(-Math.PI);
    expect(sim.angle).toBeLessThan(-Math.PI / 2);
    expect(Math.sin(sim.angle)).toBeLessThan(0);
  });

  it('plays a long random game without errors and only ends by crossing the line', () => {
    const sim = new BubbleShooterSimulation({ seed: 11, modifier: null });
    const rng = createRng(77);
    for (let i = 0; i < 120 * 240 && !sim.outcome; i++) {
      if (sim.phase === 'aim') aimAt(sim, 20 + rng() * 440, 100 + rng() * 300);
      sim.update(STEP, i % 30 === 0 ? fire : none);
      expect(Number.isInteger(sim.score)).toBe(true);
    }
    if (sim.outcome) expect(sim.outcome).toBe('lost');
    expect(sim.shots).toBeGreaterThan(20);
  });
});
