import { describe, expect, it } from 'vitest';
import {
  INVULNERABLE_SECONDS,
  MAX_BULLETS,
  MAX_ENEMIES,
  MAX_ENEMY_BULLETS,
  spaceScore,
  SpaceSurvivalSimulation,
  spawnInterval,
  speedScale,
  SS_HEIGHT,
  SS_WIDTH,
  waveAt,
  type Enemy,
  type SpaceAction,
} from '@/games/space-survival/simulation';
import { makeInput, STEP } from './helpers';

const ACTIONS: readonly SpaceAction[] = ['left', 'right', 'up', 'down'];
const none = makeInput(ACTIONS);
const left = makeInput(ACTIONS, { left: { held: true } });

function enemyAt(x: number, y: number, overrides: Partial<Enemy> = {}): Enemy {
  return {
    kind: 'drifter',
    x,
    y,
    vx: 0,
    vy: 0,
    r: 14,
    hp: 1,
    age: 0,
    phase: 0,
    baseX: x,
    amplitude: 0,
    state: 'enter',
    stateTimer: 0,
    targetY: 0,
    aimX: 0,
    aimY: 0,
    fireTimer: 99,
    flash: 0,
    ...overrides,
  };
}

describe('Space Survival difficulty', () => {
  it('spawns faster over time down to a floor', () => {
    expect(spawnInterval(60)).toBeLessThan(spawnInterval(0));
    expect(spawnInterval(10_000)).toBe(0.34);
    expect(speedScale(10_000)).toBe(1.5);
    expect(waveAt(0)).toBe(1);
    expect(waveAt(30)).toBe(2);
  });

  it('scores kills plus survival time', () => {
    expect(spaceScore(0, 0)).toBe(0);
    expect(spaceScore(100, 10.9)).toBe(150);
    expect(spaceScore(-5, -1)).toBe(0);
  });
});

describe('Space Survival rules', () => {
  it('fires automatically and moves with the keyboard', () => {
    const sim = new SpaceSurvivalSimulation({ seed: 1, modifier: null });
    const startX = sim.shipX;
    for (let i = 0; i < 60; i++) sim.update(STEP, left);
    expect(sim.shipX).toBeLessThan(startX);
    expect(sim.bullets.length).toBeGreaterThan(0);
  });

  it('follows a touch drag relative to where the finger started', () => {
    const sim = new SpaceSurvivalSimulation({ seed: 1, modifier: null });
    const start = { x: sim.shipX, y: sim.shipY };
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, pressed: true, x: 100, y: 600 }));
    for (let i = 0; i < 30; i++) sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, moved: true, x: 160, y: 560 }));
    expect(sim.shipX).toBeCloseTo(start.x + 60, 0);
    expect(sim.shipY).toBeCloseTo(start.y - 40, 0);
  });

  it('keeps the ship inside the screen', () => {
    const sim = new SpaceSurvivalSimulation({ seed: 1, modifier: null });
    for (let i = 0; i < 600; i++) sim.update(STEP, left);
    expect(sim.shipX).toBeGreaterThanOrEqual(0);
    expect(sim.shipX).toBeLessThanOrEqual(SS_WIDTH);
  });

  it('destroys enemies hit by bullets and awards points', () => {
    const sim = new SpaceSurvivalSimulation({ seed: 1, modifier: null });
    sim.enemies.push(enemyAt(sim.shipX, sim.shipY - 160));
    for (let i = 0; i < 60; i++) sim.update(STEP, none);
    expect(sim.enemiesDestroyed).toBeGreaterThanOrEqual(1);
    expect(sim.killPoints).toBeGreaterThanOrEqual(10);
  });

  it('takes one hit, then is briefly invulnerable', () => {
    const sim = new SpaceSurvivalSimulation({ seed: 1, modifier: null });
    sim.enemies.push(enemyAt(sim.shipX, sim.shipY, { hp: 50 }));
    sim.update(STEP, none);
    expect(sim.hull).toBe(2);
    expect(sim.invulnerable).toBeGreaterThan(0);
    sim.enemies.push(enemyAt(sim.shipX, sim.shipY, { hp: 50 }));
    for (let i = 0; i < 10; i++) sim.update(STEP, none);
    expect(sim.hull).toBe(2);
    // After invulnerability ends, another collision hurts again.
    for (let i = 0; i < INVULNERABLE_SECONDS * 120 + 5; i++) sim.update(STEP, none);
    sim.enemies.push(enemyAt(sim.shipX, sim.shipY, { hp: 50 }));
    sim.update(STEP, none);
    expect(sim.hull).toBe(1);
  });

  it('ends the run when the hull reaches zero', () => {
    const sim = new SpaceSurvivalSimulation({ seed: 1, modifier: 'glass-hull' });
    expect(sim.maxHull).toBe(2);
    for (let hit = 0; hit < 2; hit++) {
      sim.invulnerable = 0;
      sim.enemies.push(enemyAt(sim.shipX, sim.shipY, { hp: 50 }));
      sim.update(STEP, none);
    }
    expect(sim.hull).toBe(0);
    for (let i = 0; i < 240 && !sim.outcome; i++) sim.update(STEP, none);
    expect(sim.outcome).toBe('lost');
  });

  it('produces the same enemy spawn timeline for a seed regardless of player movement', () => {
    const record = (moving: boolean) => {
      const sim = new SpaceSurvivalSimulation({ seed: 99, modifier: null });
      const spawns: string[] = [];
      const seen = new Set<Enemy>();
      for (let i = 0; i < 120 * 40; i++) {
        sim.invulnerable = 10; // keep the ship alive for the comparison
        sim.update(STEP, moving && i % 200 < 100 ? left : none);
        for (const e of sim.enemies) {
          if (!seen.has(e)) {
            seen.add(e);
            spawns.push(`${e.kind}@${Math.round(e.baseX)}`);
          }
        }
      }
      return spawns;
    };
    const still = record(false);
    expect(still.length).toBeGreaterThan(20);
    expect(record(true)).toEqual(still);
  });

  it('keeps every entity list bounded during a long run', () => {
    const sim = new SpaceSurvivalSimulation({ seed: 5, modifier: 'swarm' });
    let maxEnemies = 0;
    let maxBullets = 0;
    let maxEnemyBullets = 0;
    for (let i = 0; i < 120 * 300; i++) {
      sim.invulnerable = 10;
      sim.update(STEP, i % 400 < 200 ? left : makeInput(ACTIONS, { right: { held: true } }));
      maxEnemies = Math.max(maxEnemies, sim.enemies.length);
      maxBullets = Math.max(maxBullets, sim.bullets.length);
      maxEnemyBullets = Math.max(maxEnemyBullets, sim.enemyBullets.length);
      for (const e of sim.enemies) {
        if (e.y > SS_HEIGHT + 60 || e.y < -130) throw new Error('enemy left the cleanup bounds');
      }
    }
    expect(maxEnemies).toBeLessThanOrEqual(MAX_ENEMIES);
    expect(maxBullets).toBeLessThanOrEqual(MAX_BULLETS);
    expect(maxEnemyBullets).toBeLessThanOrEqual(MAX_ENEMY_BULLETS);
    expect(sim.wave).toBeGreaterThanOrEqual(10);
    expect(sim.enemiesDestroyed).toBeGreaterThan(50);
  });
});
