/**
 * Space Survival rules. Pure TypeScript, no DOM.
 *
 * The ship fires automatically so the controls are the same on keyboard and
 * touch: the player only steers. Difficulty comes from a spawn director whose
 * interval shrinks over time down to a fixed floor, and from new enemy types
 * unlocking at set times. Every entity list has a hard cap.
 *
 * Randomness streams are separated so the enemy spawn timeline for a seed is
 * identical for every player (daily challenge fairness): spawns use `rng`,
 * pickup drops use `dropRng`, cosmetic particles use their own stream.
 */

import { circlesOverlap, clamp } from '../engine/collision';
import { ParticlePool } from '../engine/particles';
import type { GameOutcome, GameStats, HudItem, InputSnapshot, Simulation, SoundCue } from '../engine/types';
import type { RunOptions } from '../modifiers';
import { createRng, deriveSeed, pickWeighted, type Rng } from '@/lib/utils/random';

export const SS_WIDTH = 480;
export const SS_HEIGHT = 720;
export const SHIP_RADIUS = 13;
export const SHIP_SPEED = 360;
export const FIRE_INTERVAL = 0.16;
export const BULLET_SPEED = 780;
export const INVULNERABLE_SECONDS = 1.4;
export const SURVIVAL_POINTS_PER_SECOND = 5;
export const WAVE_SECONDS = 30;
export const MAX_ENEMIES = 28;
export const MAX_BULLETS = 48;
export const MAX_ENEMY_BULLETS = 40;
const MAX_PICKUPS = 3;
const DRAG_SPEED = 1100;
const DEATH_DURATION = 1.1;

export type SpaceAction = 'left' | 'right' | 'up' | 'down';
export const SPACE_BINDINGS: Readonly<Record<SpaceAction, readonly string[]>> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
};

export type EnemyKind = 'drifter' | 'weaver' | 'charger' | 'gunship';

export const ENEMY_STATS: Record<EnemyKind, { radius: number; hp: number; points: number; unlockAt: number }> = {
  drifter: { radius: 14, hp: 1, points: 10, unlockAt: 0 },
  weaver: { radius: 16, hp: 2, points: 25, unlockAt: 25 },
  charger: { radius: 13, hp: 1, points: 30, unlockAt: 50 },
  gunship: { radius: 22, hp: 6, points: 100, unlockAt: 80 },
};

export interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  age: number;
  phase: number;
  baseX: number;
  amplitude: number;
  /** Charger: enter -> aim -> dash. Gunship: enter -> strafe -> leave. */
  state: 'enter' | 'aim' | 'dash' | 'strafe' | 'leave';
  stateTimer: number;
  targetY: number;
  aimX: number;
  aimY: number;
  fireTimer: number;
  flash: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export type PickupKind = 'repair' | 'twin';

export interface Pickup {
  kind: PickupKind;
  x: number;
  y: number;
  age: number;
}

/** Seconds between spawns at time t (before modifiers). Bounded below. */
export function spawnInterval(t: number): number {
  return Math.max(0.34, 1.15 - t * 0.0075);
}

/** Enemy speed multiplier at time t, capped at +50%. */
export function speedScale(t: number): number {
  return 1 + Math.min(t / 240, 0.5);
}

export function spaceScore(killPoints: number, seconds: number): number {
  return Math.max(0, killPoints) + Math.floor(Math.max(0, seconds)) * SURVIVAL_POINTS_PER_SECOND;
}

export function waveAt(t: number): number {
  return Math.floor(Math.max(0, t) / WAVE_SECONDS) + 1;
}

export class SpaceSurvivalSimulation implements Simulation<SpaceAction> {
  readonly modifier: string | null;
  readonly maxHull: number;
  readonly particles: ParticlePool;
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  enemyBullets: Bullet[] = [];
  pickups: Pickup[] = [];

  time = 0;
  shipX = SS_WIDTH / 2;
  shipY = SS_HEIGHT - 120;
  shipVx = 0;
  hull: number;
  invulnerable = 0;
  twinTimer = 0;
  killPoints = 0;
  enemiesDestroyed = 0;
  wave = 1;
  waveBanner = 0;
  shake = 0;
  damageFlash = 0;
  dying = false;
  outcome: GameOutcome | null = null;

  private readonly rng: Rng;
  private readonly dropRng: Rng;
  private spawnTimer = 1.2;
  private fireTimer = 0;
  private deathTimer = 0;
  private drag: { px: number; py: number; sx: number; sy: number } | null = null;
  private cues: SoundCue[] = [];
  private announcements: string[] = [];

  constructor(options: RunOptions) {
    this.modifier = options.modifier;
    this.rng = createRng(options.seed);
    this.dropRng = createRng(deriveSeed(options.seed, 'drops'));
    this.particles = new ParticlePool(240, createRng(deriveSeed(options.seed, 'fx')));
    this.maxHull = options.modifier === 'glass-hull' ? 2 : 3;
    this.hull = this.maxHull;
    if (options.modifier === 'twin-cannons') this.twinTimer = 20;
  }

  get score(): number {
    return spaceScore(this.killPoints, this.time);
  }

  getStats(): GameStats {
    return {
      score: this.score,
      enemiesDestroyed: this.enemiesDestroyed,
      timeSurvived: Math.floor(this.time),
      wave: this.wave,
    };
  }

  getHud(): readonly HudItem[] {
    return [
      { id: 'hull', label: 'Hull', value: `${this.hull}/${this.maxHull}` },
      { id: 'wave', label: 'Wave', value: String(this.wave) },
    ];
  }

  drainCues(): SoundCue[] {
    const out = this.cues;
    this.cues = [];
    return out;
  }

  drainAnnouncements(): string[] {
    const out = this.announcements;
    this.announcements = [];
    return out;
  }

  update(dt: number, input: InputSnapshot<SpaceAction>): void {
    if (this.outcome) return;
    this.particles.update(dt);
    this.shake = Math.max(0, this.shake - dt * 3);
    this.damageFlash = Math.max(0, this.damageFlash - dt * 3);
    this.waveBanner = Math.max(0, this.waveBanner - dt);

    if (this.dying) {
      this.deathTimer -= dt;
      this.moveEnemies(dt);
      this.moveBullets(dt);
      if (this.deathTimer <= 0) {
        this.outcome = 'lost';
        this.cues.push('gameOver');
      }
      return;
    }

    this.time += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.twinTimer = Math.max(0, this.twinTimer - dt);

    const wave = waveAt(this.time);
    if (wave !== this.wave) {
      this.wave = wave;
      this.waveBanner = 2;
      this.cues.push('levelUp');
      this.announcements.push(`Wave ${wave}`);
    }

    this.moveShip(dt, input);
    this.fire(dt);
    this.spawn(dt);
    this.moveEnemies(dt);
    this.moveBullets(dt);
    this.movePickups(dt);
    this.resolveCollisions();
  }

  private moveShip(dt: number, input: InputSnapshot<SpaceAction>): void {
    const { left, right, up, down } = input.actions;
    let dx = (right.held ? 1 : 0) - (left.held ? 1 : 0);
    let dy = (down.held ? 1 : 0) - (up.held ? 1 : 0);
    const prevX = this.shipX;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.shipX += dx * SHIP_SPEED * dt;
      this.shipY += dy * SHIP_SPEED * dt;
    }

    // Relative drag: the ship follows the finger's movement, not its position,
    // so the finger never covers the ship.
    const p = input.pointer;
    if (p.pressed) this.drag = { px: p.x, py: p.y, sx: this.shipX, sy: this.shipY };
    if (this.drag && p.down) {
      const tx = this.drag.sx + (p.x - this.drag.px);
      const ty = this.drag.sy + (p.y - this.drag.py);
      const max = DRAG_SPEED * dt;
      this.shipX += clamp(tx - this.shipX, -max, max);
      this.shipY += clamp(ty - this.shipY, -max, max);
    }
    if (!p.down) this.drag = null;

    const unclampedX = this.shipX;
    const unclampedY = this.shipY;
    this.shipX = clamp(this.shipX, 18, SS_WIDTH - 18);
    this.shipY = clamp(this.shipY, 70, SS_HEIGHT - 24);
    // At a screen edge, re-anchor that axis so moving back responds immediately.
    if (this.drag && p.down) {
      if (this.shipX !== unclampedX) {
        this.drag.px = p.x;
        this.drag.sx = this.shipX;
      }
      if (this.shipY !== unclampedY) {
        this.drag.py = p.y;
        this.drag.sy = this.shipY;
      }
    }
    this.shipVx = (this.shipX - prevX) / dt;
  }

  private fire(dt: number): void {
    this.fireTimer -= dt;
    while (this.fireTimer <= 0) {
      this.fireTimer += FIRE_INTERVAL;
      if (this.bullets.length >= MAX_BULLETS) continue;
      if (this.twinTimer > 0) {
        this.bullets.push({ x: this.shipX - 9, y: this.shipY - 14, vx: -40, vy: -BULLET_SPEED, r: 4 });
        this.bullets.push({ x: this.shipX + 9, y: this.shipY - 14, vx: 40, vy: -BULLET_SPEED, r: 4 });
      } else {
        this.bullets.push({ x: this.shipX, y: this.shipY - 18, vx: 0, vy: -BULLET_SPEED, r: 4 });
      }
      this.cues.push('shoot');
    }
  }

  private spawn(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const swarm = this.modifier === 'swarm' ? 0.8 : 1;
    this.spawnTimer += spawnInterval(this.time) * swarm;

    // Always draw exactly five random numbers per spawn, before looking at
    // any game state, so the spawn timeline for a seed never depends on what
    // the player does.
    const r = [this.rng(), this.rng(), this.rng(), this.rng(), this.rng()] as const;
    const t = this.time;
    let kind = pickWeighted<EnemyKind>(() => r[0], [
      ['drifter', Math.max(1.5, 5 - t / 30)],
      ['weaver', t >= ENEMY_STATS.weaver.unlockAt ? Math.min(4, 2 + t / 60) : 0],
      ['charger', t >= ENEMY_STATS.charger.unlockAt ? Math.min(3, 1.5 + t / 90) : 0],
      ['gunship', t >= ENEMY_STATS.gunship.unlockAt ? 0.8 : 0],
    ]);
    // Caps (rare in practice) are the only state-dependent part.
    if (this.enemies.length >= MAX_ENEMIES) return;
    if (kind === 'gunship' && this.enemies.filter((e) => e.kind === 'gunship').length >= 2) kind = 'weaver';

    const stats = ENEMY_STATS[kind];
    const scale = speedScale(t);
    const x = 30 + r[1] * (SS_WIDTH - 60);
    const enemy: Enemy = {
      kind,
      x,
      y: -30,
      vx: 0,
      vy: 0,
      r: stats.radius,
      hp: stats.hp,
      age: 0,
      phase: r[2] * Math.PI * 2,
      baseX: x,
      amplitude: 0,
      state: 'enter',
      stateTimer: 0,
      targetY: 0,
      aimX: 0,
      aimY: 0,
      fireTimer: 1.2,
      flash: 0,
    };
    switch (kind) {
      case 'drifter':
        enemy.vy = (110 + r[3] * 50) * scale;
        enemy.vx = -30 + r[4] * 60;
        break;
      case 'weaver':
        enemy.vy = 90 * scale;
        enemy.amplitude = 50 + r[3] * 60;
        enemy.baseX = clamp(x, 30 + enemy.amplitude, SS_WIDTH - 30 - enemy.amplitude);
        break;
      case 'charger':
        enemy.vy = 160;
        enemy.targetY = 100 + r[3] * 120;
        break;
      case 'gunship':
        enemy.vy = 60;
        enemy.targetY = 100 + r[3] * 50;
        enemy.vx = r[4] < 0.5 ? -70 : 70;
        break;
    }
    this.enemies.push(enemy);
  }

  private moveEnemies(dt: number): void {
    const scale = speedScale(this.time);
    for (const e of this.enemies) {
      e.age += dt;
      e.flash = Math.max(0, e.flash - dt * 8);
      switch (e.kind) {
        case 'drifter':
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          if (e.x < e.r || e.x > SS_WIDTH - e.r) e.vx = -e.vx;
          break;
        case 'weaver':
          e.y += e.vy * dt;
          e.x = e.baseX + Math.sin(e.age * 1.6 + e.phase) * e.amplitude;
          break;
        case 'charger':
          if (e.state === 'enter') {
            e.y += e.vy * dt;
            if (e.y >= e.targetY) {
              e.state = 'aim';
              e.stateTimer = 0.7;
              // Lock on to where the ship is now; the dash goes there.
              e.aimX = this.shipX;
              e.aimY = this.shipY;
            }
          } else if (e.state === 'aim') {
            e.stateTimer -= dt;
            if (e.stateTimer <= 0) {
              const dx = e.aimX - e.x;
              const dy = e.aimY - e.y;
              const len = Math.hypot(dx, dy) || 1;
              const speed = 430 * scale;
              e.vx = (dx / len) * speed;
              e.vy = (dy / len) * speed;
              e.state = 'dash';
            }
          } else {
            e.x += e.vx * dt;
            e.y += e.vy * dt;
          }
          break;
        case 'gunship':
          if (e.state === 'enter') {
            e.y += e.vy * dt;
            if (e.y >= e.targetY) e.state = 'strafe';
          } else if (e.state === 'strafe') {
            e.x += e.vx * dt;
            if (e.x < e.r + 6 || e.x > SS_WIDTH - e.r - 6) {
              e.vx = -e.vx;
              e.x = clamp(e.x, e.r + 6, SS_WIDTH - e.r - 6);
            }
            if (!this.dying) {
              e.fireTimer -= dt;
              if (e.fireTimer <= 0) {
                e.fireTimer = 1.9;
                this.fireOrb(e);
              }
            }
            if (e.age > 14) {
              e.state = 'leave';
              e.vy = 90;
            }
          } else {
            e.y += e.vy * dt;
          }
          break;
      }
    }
    this.enemies = this.enemies.filter(
      (e) => e.y < SS_HEIGHT + 50 && e.y > -120 && e.x > -60 && e.x < SS_WIDTH + 60,
    );
  }

  private fireOrb(e: Enemy): void {
    if (this.enemyBullets.length >= MAX_ENEMY_BULLETS) return;
    const dx = this.shipX - e.x;
    const dy = this.shipY - e.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = 210;
    this.enemyBullets.push({ x: e.x, y: e.y + e.r, vx: (dx / len) * speed, vy: (dy / len) * speed, r: 6 });
  }

  private moveBullets(dt: number): void {
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    for (const b of this.enemyBullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    const inside = (b: Bullet) => b.y > -20 && b.y < SS_HEIGHT + 20 && b.x > -20 && b.x < SS_WIDTH + 20;
    this.bullets = this.bullets.filter(inside);
    this.enemyBullets = this.enemyBullets.filter(inside);
  }

  private movePickups(dt: number): void {
    for (const p of this.pickups) {
      p.age += dt;
      p.y += 90 * dt;
    }
    this.pickups = this.pickups.filter((p) => p.y < SS_HEIGHT + 20);
  }

  private resolveCollisions(): void {
    // Player bullets vs enemies.
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (e.hp <= 0 || e.y + e.r < 0) continue; // not on screen yet
        if (circlesOverlap(b.x, b.y, b.r, e.x, e.y, e.r)) {
          b.y = -999; // consumed
          e.hp -= 1;
          e.flash = 1;
          if (e.hp <= 0) this.destroyEnemy(e, true);
          break;
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.y > -900);

    // Enemies and enemy fire vs the ship. A slightly smaller hitbox feels fair.
    if (this.invulnerable <= 0) {
      for (const e of this.enemies) {
        if (e.hp > 0 && circlesOverlap(this.shipX, this.shipY, SHIP_RADIUS, e.x, e.y, e.r * 0.85)) {
          this.destroyEnemy(e, false);
          this.takeDamage();
          break;
        }
      }
    }
    if (this.invulnerable <= 0 && !this.dying) {
      for (const b of this.enemyBullets) {
        if (circlesOverlap(this.shipX, this.shipY, SHIP_RADIUS - 2, b.x, b.y, b.r)) {
          b.y = SS_HEIGHT + 999;
          this.takeDamage();
          break;
        }
      }
    }
    this.enemyBullets = this.enemyBullets.filter((b) => b.y < SS_HEIGHT + 900);
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // Pickups.
    this.pickups = this.pickups.filter((p) => {
      if (!circlesOverlap(this.shipX, this.shipY, SHIP_RADIUS + 6, p.x, p.y, 14)) return true;
      this.cues.push('powerup');
      if (p.kind === 'repair') {
        this.hull = Math.min(this.maxHull, this.hull + 1);
        this.announcements.push(`Hull repaired: ${this.hull} of ${this.maxHull}`);
      } else {
        this.twinTimer = 10;
        this.announcements.push('Twin cannons');
      }
      return false;
    });
  }

  private destroyEnemy(e: Enemy, byPlayer: boolean): void {
    e.hp = 0;
    const colors: Record<EnemyKind, string> = {
      drifter: '#ff4fd8',
      weaver: '#a78bfa',
      charger: '#ff8a3d',
      gunship: '#ff4d6d',
    };
    this.particles.burst({ x: e.x, y: e.y, count: e.kind === 'gunship' ? 36 : 16, color: colors[e.kind], speed: 260, life: 0.6, size: 4 });
    this.cues.push('explode');
    if (!byPlayer) return;
    this.killPoints += ENEMY_STATS[e.kind].points;
    this.enemiesDestroyed++;
    const chance = e.kind === 'gunship' ? 0.5 : 0.06;
    if (this.pickups.length < MAX_PICKUPS && this.dropRng() < chance) {
      const kind: PickupKind = this.hull < this.maxHull && this.dropRng() < 0.45 ? 'repair' : 'twin';
      this.pickups.push({ kind, x: e.x, y: e.y, age: 0 });
    }
  }

  private takeDamage(): void {
    this.hull -= 1;
    this.shake = 1;
    this.damageFlash = 1;
    this.cues.push('hit');
    if (this.hull <= 0) {
      this.hull = 0;
      this.dying = true;
      this.deathTimer = DEATH_DURATION;
      this.particles.burst({ x: this.shipX, y: this.shipY, count: 60, color: '#38e8ff', speed: 340, life: 1, size: 5 });
      return;
    }
    this.invulnerable = INVULNERABLE_SECONDS;
    this.announcements.push(`Hull damaged: ${this.hull} of ${this.maxHull}`);
  }
}
