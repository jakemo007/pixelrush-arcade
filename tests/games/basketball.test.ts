import { describe, expect, it } from 'vitest';
import {
  FRONT_RIM_X,
  HOOP_X,
  RELEASE_Y,
  RIM_Y,
  shotSpeed,
  stepFlight,
  THREE_POINT_DISTANCE,
  type Ball,
} from '@/games/basketball/court';
import {
  BasketballSimulation,
  basketPoints,
  GAME_SECONDS,
  SWISH_TIME_BONUS,
  spotRange,
  streakMultiplier,
  type HoopAction,
} from '@/games/basketball/simulation';
import { makeInput, STEP } from '../helpers';

const ACTIONS: readonly HoopAction[] = ['left', 'right', 'up', 'down', 'shoot'];
const none = makeInput(ACTIONS);
const DEG = Math.PI / 180;

function landing(spotX: number, angle: number, power: number): { x: number; descent: number } {
  const ball: Ball = { x: spotX, y: RELEASE_Y, vx: Math.cos(angle) * shotSpeed(power), vy: Math.sin(angle) * shotSpeed(power) };
  for (let i = 0; i < 600; i++) {
    const x0 = ball.x;
    const y0 = ball.y;
    stepFlight(ball, STEP, false, false);
    if (y0 < RIM_Y && ball.y >= RIM_Y && ball.vy > 0) {
      return { x: x0 + ((ball.x - x0) * (RIM_Y - y0)) / (ball.y - y0), descent: Math.atan2(ball.vy, Math.abs(ball.vx)) };
    }
  }
  return { x: -Infinity, descent: 0 };
}

function powerFor(spotX: number, angle: number, targetX: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (landing(spotX, angle, mid).x < targetX) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function arcFor(spotX: number): number {
  for (let deg = 45; deg <= 78; deg++) {
    const angle = -deg * DEG;
    if (landing(spotX, angle, powerFor(spotX, angle, HOOP_X)).descent >= 45 * DEG) return angle;
  }
  return -70 * DEG;
}

function flyOut(sim: BasketballSimulation): void {
  for (let i = 0; i < 1000 && sim.phase === 'flight'; i++) sim.update(STEP, none);
}

function placeSpot(sim: BasketballSimulation, distance: number): void {
  sim.spotX = HOOP_X - distance;
  sim.ball = { x: sim.spotX, y: RELEASE_Y, vx: 0, vy: 0 };
}

describe('Basketball scoring rules', () => {
  it('builds a streak multiplier and scores 2s, 3s and swishes', () => {
    expect([1, 2, 3, 4, 6, 7, 20].map(streakMultiplier)).toEqual([1, 1, 1, 2, 2, 3, 3]);
    expect(basketPoints(false, false, 1)).toBe(2);
    expect(basketPoints(true, false, 1)).toBe(3);
    expect(basketPoints(false, true, 1)).toBe(3);
    expect(basketPoints(true, true, 7)).toBe(12);
  });

  it('moves the spot farther away as you score', () => {
    expect(spotRange(0)[1]).toBeLessThanOrEqual(spotRange(9)[0]);
    expect(spotRange(9)[1]).toBeGreaterThan(THREE_POINT_DISTANCE);
    expect(spotRange(0)[1]).toBeLessThan(THREE_POINT_DISTANCE);
  });
});

describe('Basketball physics', () => {
  it('scores a well-aimed shot from a fixed spot, as a swish', () => {
    const sim = new BasketballSimulation({ seed: 1, modifier: null });
    placeSpot(sim, 200);
    const angle = -55 * DEG;
    sim.shoot(angle, powerFor(sim.spotX, angle, HOOP_X));
    flyOut(sim);
    expect(sim.makes).toBe(1);
    expect(sim.swishes).toBe(1);
    expect(sim.score).toBe(3);
    expect(sim.streak).toBe(1);
  });

  it('does not score a short shot that hits the front of the rim', () => {
    const sim = new BasketballSimulation({ seed: 1, modifier: null });
    placeSpot(sim, 200);
    const angle = -55 * DEG;
    sim.shoot(angle, powerFor(sim.spotX, angle, FRONT_RIM_X - 2));
    flyOut(sim);
    expect(sim.touched).toBe(true);
    expect(sim.makes).toBe(0);
    expect(sim.score).toBe(0);
    expect(sim.streak).toBe(0);
  });

  it('never scores a ball that comes up through the hoop from below', () => {
    const sim = new BasketballSimulation({ seed: 1, modifier: null });
    sim.shoot(-60 * DEG, 0.5);
    sim.ball = { x: HOOP_X, y: RIM_Y + 50, vx: 0, vy: -520 };
    let wentAbove = false;
    for (let i = 0; i < 600 && sim.phase === 'flight'; i++) {
      sim.update(STEP, none);
      wentAbove ||= sim.ball.y < RIM_Y - 20;
    }
    expect(wentAbove).toBe(true);
    expect(sim.fromBelow).toBe(true);
    expect(sim.makes).toBe(0);
  });

  it('counts a basket only once per shot', () => {
    const sim = new BasketballSimulation({ seed: 1, modifier: null });
    placeSpot(sim, 160);
    const angle = -60 * DEG;
    sim.shoot(angle, powerFor(sim.spotX, angle, HOOP_X));
    for (let i = 0; i < 600 && sim.makes === 0; i++) sim.update(STEP, none);
    expect(sim.makes).toBe(1);
    const score = sim.score;
    sim.ball = { x: HOOP_X, y: RIM_Y - 40, vx: 0, vy: 150 };
    flyOut(sim);
    expect(sim.makes).toBe(1);
    expect(sim.score).toBe(score);
  });

  it('keeps the ball on the court: it lands on the floor or leaves the screen, and the shot ends', () => {
    for (let a = 20; a <= 80; a += 6) {
      for (let p = 0; p <= 1; p += 0.125) {
        const sim = new BasketballSimulation({ seed: 3, modifier: null });
        sim.shoot(-a * DEG, p);
        flyOut(sim);
        expect(sim.phase).toBe('reset');
        expect(sim.ball.y).toBeLessThanOrEqual(640);
      }
    }
  });
});

describe('Basketball game flow', () => {
  it('ends when the 60-second clock runs out', () => {
    const sim = new BasketballSimulation({ seed: 2, modifier: null });
    for (let i = 0; i < 120 * (GAME_SECONDS - 1); i++) sim.update(STEP, none);
    expect(sim.outcome).toBeNull();
    expect(sim.phase).toBe('aim');
    for (let i = 0; i < 120 * 4 && !sim.outcome; i++) sim.update(STEP, none);
    expect(sim.clock).toBe(0);
    expect(sim.outcome).toBe('lost');
  });

  it('adds time for a swish and lets a shot in the air beat the buzzer', () => {
    const sim = new BasketballSimulation({ seed: 2, modifier: null });
    placeSpot(sim, 200);
    const angle = -55 * DEG;
    const power = powerFor(sim.spotX, angle, HOOP_X);
    sim.shoot(angle, power);
    const before = sim.clock;
    for (let i = 0; i < 600 && sim.makes === 0; i++) sim.update(STEP, none);
    expect(sim.clock).toBeGreaterThan(before + SWISH_TIME_BONUS - 1.5);
    flyOut(sim);
    for (let i = 0; i < 120 && sim.phase === 'reset'; i++) sim.update(STEP, none);

    sim.clock = 0.25;
    const spot = sim.spotX;
    sim.shoot(angle, powerFor(spot, angle, HOOP_X));
    flyOut(sim);
    expect(sim.makes).toBe(2);
    for (let i = 0; i < 600 && !sim.outcome; i++) sim.update(STEP, none);
    expect(sim.outcome).toBe('won');
    expect(sim.score).toBeGreaterThan(0);
  });

  it('picks the same shooting spots for the same seed, farther as you score', () => {
    const spots = (seed: number) => {
      const sim = new BasketballSimulation({ seed, modifier: null });
      const out: number[] = [sim.spotX];
      for (let k = 0; k < 10; k++) {
        const before = sim.makes;
        const angle = arcFor(sim.spotX);
        sim.shoot(angle, powerFor(sim.spotX, angle, HOOP_X));
        flyOut(sim);
        expect(sim.makes).toBe(before + 1);
        for (let i = 0; i < 120 && sim.phase === 'reset'; i++) sim.update(STEP, none);
        out.push(sim.spotX);
      }
      return out;
    };
    const a = spots(7);
    expect(spots(7)).toEqual(a);
    expect(spots(8)).not.toEqual(a);
    a.forEach((x, makes) => {
      const [lo, hi] = spotRange(makes);
      const d = HOOP_X - x;
      expect(d).toBeGreaterThanOrEqual(lo - 1);
      expect(d).toBeLessThanOrEqual(hi + 1);
    });
  });

  it('aims with a drag and shoots on release, up and toward the hoop', () => {
    const sim = new BasketballSimulation({ seed: 1, modifier: null });
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, pressed: true, moved: true, x: 300, y: 300 }));
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, moved: true, x: 230, y: 380 }));
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: false, released: true, x: 230, y: 380 }));
    expect(sim.phase).toBe('flight');
    expect(sim.ball.vx).toBeGreaterThan(0);
    expect(sim.ball.vy).toBeLessThan(0);
    expect(sim.shots).toBe(1);
  });

  it('aims and shoots with the keyboard within the allowed angles', () => {
    const sim = new BasketballSimulation({ seed: 1, modifier: null });
    for (let i = 0; i < 600; i++) sim.update(STEP, makeInput(ACTIONS, { left: { held: true }, up: { held: true } }));
    expect(sim.angle).toBeCloseTo(-80 * DEG, 6);
    expect(sim.power).toBe(1);
    for (let i = 0; i < 600; i++) sim.update(STEP, makeInput(ACTIONS, { right: { held: true } }));
    expect(sim.angle).toBeCloseTo(-15 * DEG, 6);
    sim.update(STEP, makeInput(ACTIONS, { shoot: { pressed: true, held: true } }));
    expect(sim.phase).toBe('flight');
  });
});
