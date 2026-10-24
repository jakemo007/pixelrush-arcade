import { describe, expect, it } from 'vitest';
import {
  airTime,
  BASE_PHYSICS,
  CourseGenerator,
  gapSeconds,
  GROUND_Y,
  jumpApex,
  MAX_PIT_SECONDS,
  neonDashScore,
  NeonDashSimulation,
  physicsFor,
  PLAYER_SIZE,
  PLAYER_X,
  speedAtDistance,
  tierAt,
  type NeonDashAction,
} from '@/games/neon-dash/simulation';
import { makeInput, STEP } from './helpers';

const ACTIONS: readonly NeonDashAction[] = ['jump'];
const none = makeInput(ACTIONS);
const press = makeInput(ACTIONS, { jump: { pressed: true, held: true } });
const hold = makeInput(ACTIONS, { jump: { held: true } });

/**
 * A simple "good player": does a full jump timed so the jump is centred over
 * the next spike, block or pit, and never jumps when a drone is coming.
 */
function botInput(sim: NeonDashSimulation, holding: { value: boolean }) {
  const T = airTime(sim.physics);
  const front = sim.scroll + PLAYER_X + PLAYER_SIZE;
  const next = sim.obstacles.find((o) => o.x + o.w > sim.scroll + PLAYER_X);
  if (holding.value && sim.vy < 0) return hold;
  holding.value = false;
  if (!next || !sim.onGround || next.kind === 'drone') return none;
  const timeToFront = (next.x - front) / sim.speed;
  const crossing = (next.w + PLAYER_SIZE) / sim.speed;
  if (timeToFront <= T / 2 - crossing / 2) {
    holding.value = true;
    return press;
  }
  return none;
}

describe('Neon Dash scoring', () => {
  it('scores distance and shards', () => {
    expect(neonDashScore(0, 0)).toBe(0);
    expect(neonDashScore(2500, 0)).toBe(100);
    expect(neonDashScore(2500, 3)).toBe(160);
    expect(neonDashScore(-50, -2)).toBe(0);
  });
});

describe('Neon Dash difficulty', () => {
  it('increases speed with distance but never above the cap', () => {
    expect(speedAtDistance(BASE_PHYSICS, 0)).toBe(BASE_PHYSICS.startSpeed);
    expect(speedAtDistance(BASE_PHYSICS, 10_000)).toBeGreaterThan(BASE_PHYSICS.startSpeed);
    expect(speedAtDistance(BASE_PHYSICS, 10_000_000)).toBe(BASE_PHYSICS.maxSpeed);
  });

  it('unlocks harder tiers by distance', () => {
    expect(tierAt(0)).toBe(0);
    expect(tierAt(10_000)).toBe(1);
    expect(tierAt(50_000)).toBe(2);
  });
});

describe('Neon Dash course generator', () => {
  for (const modifier of [null, 'turbo-start', 'moon-gravity', 'shard-storm']) {
    it(`keeps every gap and pit fair (${modifier ?? 'standard'})`, () => {
      const p = physicsFor(modifier);
      for (let seed = 1; seed <= 25; seed++) {
        const course = new CourseGenerator(p, seed);
        let prevEnd = -Infinity;
        for (let i = 0; i < 400; i++) {
          const { obstacle, gapAfter } = course.next();
          const v = speedAtDistance(p, obstacle.x);
          expect(obstacle.x).toBeGreaterThanOrEqual(prevEnd);
          expect(gapAfter).toBeGreaterThanOrEqual(gapSeconds(p, tierAt(obstacle.x)).min * v - 1e-6);
          if (obstacle.kind === 'pit') {
            expect(obstacle.w).toBeLessThanOrEqual(Math.max(76, MAX_PIT_SECONDS[2] * v) + 1e-6);
            // A full jump covers far more than the widest pit.
            expect(airTime(p) * v).toBeGreaterThan(obstacle.w * 1.5);
          }
          if (obstacle.kind === 'block') expect(obstacle.h).toBeLessThan(jumpApex(p) - 40);
          prevEnd = obstacle.x + obstacle.w + gapAfter;
        }
      }
    });
  }

  it('is deterministic for a seed and differs between seeds', () => {
    const a = new CourseGenerator(BASE_PHYSICS, 42);
    const b = new CourseGenerator(BASE_PHYSICS, 42);
    const c = new CourseGenerator(BASE_PHYSICS, 43);
    const seqA = Array.from({ length: 50 }, () => a.next().obstacle);
    const seqB = Array.from({ length: 50 }, () => b.next().obstacle);
    const seqC = Array.from({ length: 50 }, () => c.next().obstacle);
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
  });
});

describe('Neon Dash physics', () => {
  it('stands on the ground without input', () => {
    const sim = new NeonDashSimulation({ seed: 1, modifier: null });
    for (let i = 0; i < 60; i++) sim.update(STEP, none);
    expect(sim.onGround).toBe(true);
    expect(sim.playerY).toBe(GROUND_Y - PLAYER_SIZE);
  });

  it('holding jump goes higher than a tap', () => {
    const apex = (held: boolean) => {
      const sim = new NeonDashSimulation({ seed: 1, modifier: null });
      sim.update(STEP, press);
      let minY = sim.playerY;
      for (let i = 0; i < 120; i++) {
        sim.update(STEP, held ? hold : none);
        minY = Math.min(minY, sim.playerY);
      }
      return GROUND_Y - PLAYER_SIZE - minY;
    };
    const tap = apex(false);
    const full = apex(true);
    expect(full).toBeGreaterThan(tap * 2);
    expect(full).toBeCloseTo(jumpApex(BASE_PHYSICS), -1);
  });

  it('remembers a jump pressed just before landing (jump buffer)', () => {
    const sim = new NeonDashSimulation({ seed: 1, modifier: null });
    sim.update(STEP, press);
    // Full jump, then press again while falling just above the ground.
    let pressedEarly = false;
    for (let i = 0; i < 200; i++) {
      if (!pressedEarly) {
        const nearGround = sim.vy > 0 && GROUND_Y - (sim.playerY + PLAYER_SIZE) < 40;
        if (nearGround) {
          pressedEarly = true;
          expect(sim.onGround).toBe(false);
          sim.update(STEP, press);
        } else {
          sim.update(STEP, hold);
        }
        continue;
      }
      sim.update(STEP, none);
      if (sim.vy < 0) break;
    }
    expect(pressedEarly).toBe(true);
    expect(sim.vy).toBeLessThan(0);
  });

  it('ignores a held key: no automatic re-jump after landing', () => {
    const sim = new NeonDashSimulation({ seed: 1, modifier: null });
    sim.update(STEP, press);
    let jumps = 0;
    let wasGround = false;
    for (let i = 0; i < 240; i++) {
      sim.update(STEP, hold);
      if (wasGround && !sim.onGround) jumps++;
      wasGround = sim.onGround;
    }
    expect(jumps).toBe(0);
    expect(sim.onGround).toBe(true);
  });

  it('ends the run on collision when the player never jumps', () => {
    const sim = new NeonDashSimulation({ seed: 3, modifier: null });
    for (let i = 0; i < 120 * 30 && !sim.outcome; i++) sim.update(STEP, none);
    expect(sim.outcome).toBe('lost');
    expect(sim.drainCues()).toContain('gameOver');
    // Once over, further updates do nothing.
    const score = sim.score;
    sim.update(STEP, press);
    expect(sim.score).toBe(score);
  });
});

describe('Neon Dash playability', () => {
  it('a well-timed bot survives at least 90 seconds on most seeds', () => {
    let survived = 0;
    const seeds = 20;
    for (let seed = 1; seed <= seeds; seed++) {
      const sim = new NeonDashSimulation({ seed, modifier: null });
      const holding = { value: false };
      for (let i = 0; i < 120 * 90 && !sim.outcome; i++) sim.update(STEP, botInput(sim, holding));
      if (!sim.outcome && !sim.dying) survived++;
      // Entity lists stay bounded.
      expect(sim.obstacles.length).toBeLessThan(20);
      expect(sim.shards.length).toBeLessThan(30);
    }
    expect(survived).toBeGreaterThanOrEqual(seeds * 0.9);
  });
});
