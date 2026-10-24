import { describe, expect, it } from 'vitest';
import {
  BALL_R,
  BB_HEIGHT,
  BB_WIDTH,
  brickPoints,
  BrickBreakerSimulation,
  enforceMinVertical,
  levelSpeed,
  LEVELS,
  MIN_VERTICAL_RATIO,
  PADDLE_Y,
  parseLevel,
  type BrickBreakerAction,
} from '@/games/brick-breaker/simulation';
import { createRng } from '@/lib/utils/random';
import { makeInput, STEP } from './helpers';

const ACTIONS: readonly BrickBreakerAction[] = ['left', 'right', 'launch'];
const none = makeInput(ACTIONS);
const launch = makeInput(ACTIONS, { launch: { pressed: true, held: true } });

/** Pointer input that puts the paddle centre at x. */
const pointerAt = (x: number, pressed = false) => makeInput(ACTIONS, {}, { inside: true, moved: true, x, y: 600, pressed });

describe('Brick Breaker levels', () => {
  it('has at least several levels, each with breakable bricks', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(6);
    for (const level of LEVELS) {
      const bricks = parseLevel(level.rows);
      expect(bricks.filter((b) => !b.steel).length).toBeGreaterThan(10);
      for (const b of bricks) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(BB_WIDTH);
      }
    }
  });

  it('parses hit points and steel bricks', () => {
    const bricks = parseLevel(['1.23#.....']);
    expect(bricks.map((b) => (b.steel ? '#' : b.hp))).toEqual([1, 2, 3, '#']);
  });

  it('gets faster on later levels, with a cap', () => {
    expect(levelSpeed(2, null)).toBeGreaterThan(levelSpeed(1, null));
    expect(levelSpeed(100, null)).toBe(600);
    expect(levelSpeed(1, 'fast-ball')).toBeCloseTo(levelSpeed(1, null) * 1.15);
  });
});

describe('Brick Breaker scoring', () => {
  it('rewards tougher bricks and combos', () => {
    expect(brickPoints(1, 0)).toBe(10);
    expect(brickPoints(3, 0)).toBe(30);
    expect(brickPoints(1, 1)).toBe(13);
    expect(brickPoints(1, 4)).toBe(20);
    // Combo bonus is capped.
    expect(brickPoints(1, 100)).toBe(brickPoints(1, 8));
  });
});

describe('Brick Breaker ball physics', () => {
  it('enforces a minimum vertical speed', () => {
    const ball = { x: 0, y: 0, vx: 500, vy: 1 };
    enforceMinVertical(ball, false);
    const speed = Math.hypot(ball.vx, ball.vy);
    expect(speed).toBeCloseTo(Math.hypot(500, 1), 5);
    expect(Math.abs(ball.vy) / speed).toBeGreaterThanOrEqual(MIN_VERTICAL_RATIO - 1e-9);
  });

  it('waits on the paddle until launched', () => {
    const sim = new BrickBreakerSimulation({ seed: 1, modifier: null });
    for (let i = 0; i < 240; i++) sim.update(STEP, none);
    expect(sim.phase).toBe('serve');
    expect(sim.ball.y).toBeLessThan(PADDLE_Y);
    sim.update(STEP, launch);
    expect(sim.phase).toBe('live');
    expect(sim.ball.vy).toBeLessThan(0);
  });

  it('does not tunnel through a brick on a long frame', () => {
    const sim = new BrickBreakerSimulation({ seed: 1, modifier: null });
    sim.update(STEP, launch);
    const target = sim.bricks.find((b) => b.y === Math.max(...sim.bricks.map((x) => x.y)))!;
    sim.ball = { x: target.x + target.w / 2, y: target.y + target.h + BALL_R + 2, vx: 0.001, vy: -1 };
    // 50 ms frame: the ball moves ~19 px, more than a brick is tall.
    sim.update(0.05, none);
    expect(target.alive).toBe(false);
    expect(sim.ball.vy).toBeGreaterThan(0);
    expect(sim.ball.y).toBeGreaterThan(target.y + target.h);
  });

  it('bounces once off the seam between two bricks', () => {
    const sim = new BrickBreakerSimulation({ seed: 1, modifier: null });
    sim.update(STEP, launch);
    const bottomY = Math.max(...sim.bricks.map((b) => b.y));
    const row = sim.bricks.filter((b) => b.y === bottomY).sort((a, b) => a.x - b.x);
    const [a, b] = [row[3]!, row[4]!];
    const seamX = (a.x + a.w + b.x) / 2;
    sim.ball = { x: seamX, y: bottomY + a.h + BALL_R + 1, vx: 0.001, vy: -1 };
    for (let i = 0; i < 6; i++) sim.update(STEP, none);
    expect(sim.ball.vy).toBeGreaterThan(0);
    expect(sim.ball.y).toBeGreaterThan(bottomY + a.h);
  });

  it('loses a life when the ball falls, then serves again', () => {
    const sim = new BrickBreakerSimulation({ seed: 1, modifier: null });
    sim.update(STEP, launch);
    sim.ball = { x: 20, y: BB_HEIGHT - 5, vx: 0, vy: 400 };
    sim.paddleX = BB_WIDTH - sim.paddleW;
    for (let i = 0; i < 30; i++) sim.update(STEP, none);
    expect(sim.lives).toBe(2);
    expect(sim.livesLost).toBe(1);
    expect(sim.phase).toBe('serve');
  });

  it('ends the game when the last life is lost', () => {
    const sim = new BrickBreakerSimulation({ seed: 1, modifier: null });
    for (let life = 0; life < 3; life++) {
      sim.update(STEP, launch);
      sim.ball = { x: 20, y: BB_HEIGHT - 5, vx: 0, vy: 400 };
      sim.paddleX = BB_WIDTH - sim.paddleW;
      for (let i = 0; i < 30; i++) sim.update(STEP, none);
    }
    for (let i = 0; i < 240 && !sim.outcome; i++) sim.update(STEP, none);
    expect(sim.outcome).toBe('lost');
  });

  it('keeps the ball inside the play area and clears levels with a tracking bot', () => {
    for (const modifier of [null, 'fast-ball', 'narrow-paddle']) {
      const sim = new BrickBreakerSimulation({ seed: 7, modifier });
      // The bot tracks the ball and picks a new random hit offset for each
      // return, like a player varying their angle.
      const aim = createRng(5);
      let offset = 0;
      let lastVy = 0;
      const violations: string[] = [];
      const minutes = 6;
      for (let i = 0; i < 120 * 60 * minutes && !sim.outcome; i++) {
        if (sim.ball.vy > 0 && lastVy <= 0) offset = (aim() - 0.5) * 70;
        lastVy = sim.ball.vy;
        const input = sim.phase === 'serve' ? pointerAt(sim.ball.x, true) : pointerAt(sim.ball.x + offset);
        sim.update(STEP, input);
        const { x, y, vx, vy } = sim.ball;
        if (!(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(vx) && Number.isFinite(vy))) violations.push(`non-finite at step ${i}`);
        if (x < BALL_R - 1e-6 || x > BB_WIDTH - BALL_R + 1e-6 || y < BALL_R - 1e-6) violations.push(`out of bounds at step ${i}: ${x},${y}`);
        // Never resting inside a live brick.
        for (const b of sim.bricks) {
          if (b.alive && x > b.x + 1 && x < b.x + b.w - 1 && y > b.y + 1 && y < b.y + b.h - 1) violations.push(`inside brick at step ${i}`);
        }
        if (violations.length > 0) break;
      }
      expect(violations).toEqual([]);
      expect(sim.livesLost).toBe(0);
      expect(sim.levelReached).toBeGreaterThanOrEqual(3);
      expect(sim.particles.aliveCount).toBeLessThanOrEqual(sim.particles.capacity);
    }
  }, 60_000);
});
