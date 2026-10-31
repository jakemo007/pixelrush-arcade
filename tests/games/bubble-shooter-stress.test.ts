import { describe, expect, it } from 'vitest';
import { BubbleGrid, COLS, EMPTY } from '@/games/bubble-shooter/grid';
import { BubbleShooterSimulation, SHOOTER_X, SHOOTER_Y, type BubbleAction } from '@/games/bubble-shooter/simulation';
import { createRng } from '@/lib/utils/random';
import { makeInput, STEP } from '../helpers';

const ACTIONS: readonly BubbleAction[] = ['left', 'right', 'fire', 'swap'];
const fireInput = makeInput(ACTIONS, { fire: { pressed: true, held: true } });
const swapInput = makeInput(ACTIONS, { swap: { pressed: true, held: true } });
const idle = makeInput(ACTIONS);

function assertConsistent(sim: BubbleShooterSimulation): void {
  expect(Number.isFinite(sim.score)).toBe(true);
  expect(Number.isFinite(sim.angle)).toBe(true);
  expect(sim.score).toBeGreaterThanOrEqual(0);
  const colors = sim.grid.colors();
  for (const c of colors) expect(c).toBeGreaterThanOrEqual(0);
  sim.grid.rows.forEach((row, r) => {
    expect(row).toHaveLength(COLS);
    for (let c = sim.grid.rowLength(r); c < COLS; c++) expect(row[c]).toBe(EMPTY);
  });
  expect(sim.grid.floating()).toEqual([]);
  if (sim.flying) {
    expect(Number.isFinite(sim.flying.x) && Number.isFinite(sim.flying.y)).toBe(true);
  }
}

describe('Bubble Shooter stress', () => {
  it('survives many seeds of random aiming, rapid fire, swaps and restarts of levels', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const sim = new BubbleShooterSimulation({ seed, modifier: null });
      const rng = createRng(seed * 7919);
      for (let frame = 0; frame < 6000 && !sim.outcome; frame++) {
        if (sim.phase === 'aim' && frame % 5 === 0) {
          sim.angle = -0.14 - rng() * (Math.PI - 0.28);
          sim.update(STEP, rng() < 0.2 ? swapInput : fireInput);
        } else if (rng() < 0.3) {
          sim.update(STEP, fireInput);
        } else {
          sim.update(STEP * (1 + rng() * 6), idle);
        }
        if (frame % 50 === 0) assertConsistent(sim);
      }
      assertConsistent(sim);
    }
  });

  it('ignores fire presses while a bubble is already in flight', () => {
    const sim = new BubbleShooterSimulation({ seed: 3, modifier: null });
    sim.update(STEP, fireInput);
    expect(sim.phase).toBe('flying');
    const shots = sim.shots;
    for (let i = 0; i < 5; i++) sim.update(STEP, fireInput);
    expect(sim.shots).toBe(shots);
  });

  it('clears an almost empty board and advances to the next level', () => {
    const sim = new BubbleShooterSimulation({ seed: 5, modifier: null });
    sim.grid = BubbleGrid.fromRows([[1, 1, 1]], 0);
    sim.loaded = 1;
    sim.angle = Math.atan2(24 - SHOOTER_Y, 100 - SHOOTER_X);
    sim.update(STEP, fireInput);
    for (let i = 0; i < 1200 && sim.level === 1; i++) sim.update(STEP, idle);
    expect(sim.level).toBe(2);
    expect(sim.grid.count()).toBeGreaterThan(0);
    assertConsistent(sim);
  });
});
