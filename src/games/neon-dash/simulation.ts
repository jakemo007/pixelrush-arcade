import { rectsOverlap, circleRectOverlap, type Rect } from '../engine/collision';
import { ParticlePool } from '../engine/particles';
import type { GameOutcome, GameStats, HudItem, InputSnapshot, Simulation, SoundCue } from '../engine/types';
import type { RunOptions } from '../modifiers';
import { createRng, deriveSeed, pickWeighted, randomRange, type Rng } from '@/lib/utils/random';

export const ND_WIDTH = 960;
export const ND_HEIGHT = 540;
export const GROUND_Y = 440;
export const PLAYER_X = 180;
export const PLAYER_SIZE = 34;
export const SHARD_POINTS = 20;
export const DISTANCE_PER_POINT = 25;
export const PIXELS_PER_METER = 40;
export const FIRST_OBSTACLE_X = 1400;

const LANDING_TOLERANCE = 16;
const DRONE_BOTTOM = GROUND_Y - PLAYER_SIZE - 14;
const DEATH_DURATION = 0.75;

export type NeonDashAction = 'jump';
export const NEON_DASH_BINDINGS: Readonly<Record<NeonDashAction, readonly string[]>> = {
  jump: ['Space', 'ArrowUp', 'KeyW'],
};

export interface Physics {
  gravity: number;
  jumpVelocity: number;
  jumpCutVelocity: number;
  startSpeed: number;
  maxSpeed: number;
  acceleration: number;
  coyoteTime: number;
  jumpBuffer: number;
  shardChance: number;
}

export const BASE_PHYSICS: Physics = {
  gravity: 2700,
  jumpVelocity: 940,
  jumpCutVelocity: 380,
  startSpeed: 380,
  maxSpeed: 820,
  acceleration: 4.2,
  coyoteTime: 0.1,
  jumpBuffer: 0.13,
  shardChance: 0.32,
};

export function physicsFor(modifier: string | null): Physics {
  switch (modifier) {
    case 'turbo-start':
      return { ...BASE_PHYSICS, startSpeed: BASE_PHYSICS.startSpeed * 1.2 };
    case 'moon-gravity':
      return { ...BASE_PHYSICS, gravity: BASE_PHYSICS.gravity * 0.8, jumpVelocity: BASE_PHYSICS.jumpVelocity * 0.9 };
    case 'shard-storm':
      return { ...BASE_PHYSICS, shardChance: 0.75 };
    default:
      return BASE_PHYSICS;
  }
}

export function airTime(p: Physics): number {
  return (2 * p.jumpVelocity) / p.gravity;
}

export function jumpApex(p: Physics): number {
  return (p.jumpVelocity * p.jumpVelocity) / (2 * p.gravity);
}

export function speedAtDistance(p: Physics, distance: number): number {
  return Math.min(p.maxSpeed, Math.sqrt(p.startSpeed * p.startSpeed + 2 * p.acceleration * Math.max(0, distance)));
}

export function neonDashScore(distance: number, shards: number): number {
  return Math.floor(Math.max(0, distance) / DISTANCE_PER_POINT) + Math.max(0, shards) * SHARD_POINTS;
}

export function tierAt(distance: number): 0 | 1 | 2 {
  return distance < 7000 ? 0 : distance < 20000 ? 1 : 2;
}

export function gapSeconds(p: Physics, tier: 0 | 1 | 2): { min: number; extra: number } {
  return { min: airTime(p) * 0.55 + 0.42, extra: [0.95, 0.6, 0.35][tier]! };
}

export type ObstacleKind = 'spike' | 'block' | 'pit' | 'drone';

export interface Obstacle {
  kind: ObstacleKind;
  x: number;
  w: number;
  h: number;
  count: number;
  phase: number;
}

export interface Shard {
  x: number;
  y: number;
  taken: boolean;
  phase: number;
}

type Pattern = 'spike1' | 'spike2' | 'spike3' | 'block56' | 'block72' | 'block88' | 'pit' | 'drone';

const PATTERN_WEIGHTS: Record<0 | 1 | 2, readonly (readonly [Pattern, number])[]> = {
  0: [
    ['spike1', 3],
    ['spike2', 3],
    ['block56', 2],
    ['spike3', 1],
  ],
  1: [
    ['spike1', 2],
    ['spike2', 3],
    ['spike3', 2],
    ['block56', 1.5],
    ['block72', 1.5],
    ['pit', 2],
  ],
  2: [
    ['spike2', 2],
    ['spike3', 2],
    ['block72', 1.5],
    ['block88', 1.5],
    ['pit', 2],
    ['drone', 2],
  ],
};

export const MAX_PIT_SECONDS: Record<0 | 1 | 2, number> = { 0: 0.28, 1: 0.32, 2: 0.36 };
const SPIKE_WIDTH = 30;
const SPIKE_HEIGHT = 32;
const SHARD_RADIUS = 12;

export class NeonDashSimulation implements Simulation<NeonDashAction> {
  readonly physics: Physics;
  readonly obstacles: Obstacle[] = [];
  readonly shards: Shard[] = [];
  readonly particles: ParticlePool;

  time = 0;
  scroll = 0;
  speed: number;
  playerY = GROUND_Y - PLAYER_SIZE;
  vy = 0;
  onGround = true;
  shardsCollected = 0;
  dying = false;
  fell = false;
  shake = 0;
  flash = 0;
  squash = 0;
  outcome: GameOutcome | null = null;

  private readonly course: CourseGenerator;
  private coyote = 0;
  private jumpBufferTimer = 0;
  private rising = false;
  private deathTimer = 0;
  private nextMilestone = 500;
  private cues: SoundCue[] = [];
  private announcements: string[] = [];

  constructor(options: RunOptions) {
    this.physics = physicsFor(options.modifier);
    this.course = new CourseGenerator(this.physics, options.seed);
    this.particles = new ParticlePool(160, createRng(deriveSeed(options.seed, 'fx')));
    this.speed = this.physics.startSpeed;
    this.spawnAhead();
  }

  get score(): number {
    return neonDashScore(this.scroll, this.shardsCollected);
  }

  getStats(): GameStats {
    return {
      score: this.score,
      shards: this.shardsCollected,
      timeSurvived: Math.floor(this.time),
      distance: Math.floor(this.scroll / PIXELS_PER_METER),
    };
  }

  getHud(): readonly HudItem[] {
    return [
      { id: 'shards', label: 'Shards', value: String(this.shardsCollected) },
      { id: 'distance', label: 'Distance', value: `${Math.floor(this.scroll / PIXELS_PER_METER)} m` },
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

  playerHitbox(): Rect {
    return { x: PLAYER_X + 4, y: this.playerY + 4, w: PLAYER_SIZE - 8, h: PLAYER_SIZE - 6 };
  }

  obstacleHitbox(o: Obstacle): Rect | null {
    const sx = o.x - this.scroll;
    switch (o.kind) {
      case 'spike':
        return { x: sx + 5, y: GROUND_Y - o.h + 10, w: o.w - 10, h: o.h - 10 };
      case 'block':
        return { x: sx + 2, y: GROUND_Y - o.h + 2, w: o.w - 4, h: o.h - 2 };
      case 'drone':
        return { x: sx + 4, y: this.droneTop(o) + 4, w: o.w - 8, h: o.h - 8 };
      case 'pit':
        return null;
    }
  }

  droneTop(o: Obstacle): number {
    return DRONE_BOTTOM - o.h + Math.sin(this.time * 3 + o.phase) * 3;
  }

  isSupported(): boolean {
    const footLeft = this.scroll + PLAYER_X + 5;
    const footRight = this.scroll + PLAYER_X + PLAYER_SIZE - 5;
    for (const o of this.obstacles) {
      if (o.kind === 'pit' && footLeft >= o.x && footRight <= o.x + o.w) return false;
    }
    return true;
  }

  update(dt: number, input: InputSnapshot<NeonDashAction>): void {
    if (this.outcome) return;
    this.particles.update(dt);
    this.shake = Math.max(0, this.shake - dt * 3);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.squash = Math.max(0, this.squash - dt * 6);

    if (this.dying) {
      this.deathTimer -= dt;
      if (this.fell) {
        this.vy += this.physics.gravity * dt;
        this.playerY += this.vy * dt;
      }
      if (this.deathTimer <= 0) {
        this.outcome = 'lost';
        this.cues.push('gameOver');
      }
      return;
    }

    const p = this.physics;
    this.time += dt;
    this.speed = speedAtDistance(p, this.scroll);
    this.scroll += this.speed * dt;

    const jump = input.actions.jump;
    const tapped = jump.pressed || input.pointer.pressed;
    const holding = jump.held || input.pointer.down;
    this.jumpBufferTimer = tapped ? p.jumpBuffer : Math.max(0, this.jumpBufferTimer - dt);
    this.coyote = this.onGround ? p.coyoteTime : Math.max(0, this.coyote - dt);

    if (this.jumpBufferTimer > 0 && this.coyote > 0) {
      this.vy = -p.jumpVelocity;
      this.onGround = false;
      this.rising = true;
      this.coyote = 0;
      this.jumpBufferTimer = 0;
      this.cues.push('jump');
      this.dust(6);
    }
    if (this.rising && !holding && this.vy < -p.jumpCutVelocity) this.vy = -p.jumpCutVelocity;
    if (this.vy >= 0) this.rising = false;

    const prevBottom = this.playerY + PLAYER_SIZE;
    this.vy += p.gravity * dt;
    this.playerY += this.vy * dt;
    const bottom = this.playerY + PLAYER_SIZE;
    const supported = this.isSupported();

    if (supported && this.vy >= 0 && bottom >= GROUND_Y && prevBottom <= GROUND_Y + LANDING_TOLERANCE) {
      if (!this.onGround) {
        this.squash = 1;
        this.cues.push('land');
        this.dust(4);
      }
      this.playerY = GROUND_Y - PLAYER_SIZE;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
      if (bottom > GROUND_Y + LANDING_TOLERANCE) {
        this.die(true);
        return;
      }
    }

    const hitbox = this.playerHitbox();
    for (const o of this.obstacles) {
      const box = this.obstacleHitbox(o);
      if (box && rectsOverlap(hitbox, box)) {
        this.die(false);
        return;
      }
    }
    for (const s of this.shards) {
      if (s.taken) continue;
      if (circleRectOverlap(s.x - this.scroll, s.y, SHARD_RADIUS, hitbox)) {
        s.taken = true;
        this.shardsCollected++;
        this.flash = Math.max(this.flash, 0.25);
        this.cues.push('collect');
        this.particles.burst({ x: s.x, y: s.y, count: 10, color: '#ffd23f', speed: 220, life: 0.4, size: 4 });
      }
    }

    if (this.score >= this.nextMilestone) {
      this.cues.push('milestone');
      if (this.nextMilestone % 1000 === 0) this.announcements.push(`${this.nextMilestone.toLocaleString('en-US')} points`);
      this.nextMilestone += 500;
    }

    this.cleanup();
    this.spawnAhead();
  }

  private die(fell: boolean): void {
    this.dying = true;
    this.fell = fell;
    this.deathTimer = DEATH_DURATION;
    this.shake = 1;
    this.flash = 0.6;
    this.cues.push('hit');
    if (!fell) {
      this.vy = 0;
      this.particles.burst({
        x: this.scroll + PLAYER_X + PLAYER_SIZE / 2,
        y: this.playerY + PLAYER_SIZE / 2,
        count: 40,
        color: '#38e8ff',
        speed: 420,
        life: 0.8,
        size: 5,
        gravity: 600,
      });
    }
  }

  private dust(count: number): void {
    this.particles.burst({
      x: this.scroll + PLAYER_X + 6,
      y: GROUND_Y - 2,
      count,
      color: '#a78bfa',
      speed: 120,
      life: 0.35,
      size: 3,
      angle: Math.PI,
      spread: 1.4,
    });
  }

  private cleanup(): void {
    const behind = this.scroll - 200;
    while (this.obstacles.length > 0 && this.obstacles[0]!.x + this.obstacles[0]!.w < behind) this.obstacles.shift();
    while (this.shards.length > 0 && this.shards[0]!.x < behind) this.shards.shift();
  }

  private spawnAhead(): void {
    const horizon = this.scroll + ND_WIDTH + 400;
    while (this.course.nextX < horizon) {
      const piece = this.course.next();
      this.obstacles.push(piece.obstacle);
      this.shards.push(...piece.shards);
    }
  }
}

export interface CoursePiece {
  obstacle: Obstacle;
  shards: Shard[];
  gapAfter: number;
}

export class CourseGenerator {
  nextX = FIRST_OBSTACLE_X;
  private readonly rng: Rng;

  constructor(
    private readonly physics: Physics,
    seed: number,
  ) {
    this.rng = createRng(seed);
  }

  next(): CoursePiece {
    const p = this.physics;
    const rng = this.rng;
    const x = this.nextX;
    const v = speedAtDistance(p, x);
    const tier = tierAt(x);
    const pattern = pickWeighted(rng, PATTERN_WEIGHTS[tier]);
    const phase = rng() * Math.PI * 2;

    let obstacle: Obstacle;
    switch (pattern) {
      case 'spike1':
      case 'spike2':
      case 'spike3': {
        const count = Number(pattern.slice(-1));
        obstacle = { kind: 'spike', x, w: SPIKE_WIDTH * count, h: SPIKE_HEIGHT, count, phase };
        break;
      }
      case 'block56':
      case 'block72':
      case 'block88':
        obstacle = { kind: 'block', x, w: 44, h: Number(pattern.slice(5)), count: 1, phase };
        break;
      case 'pit': {
        const maxSeconds = MAX_PIT_SECONDS[tier];
        const w = Math.max(76, v * randomRange(rng, 0.2, maxSeconds));
        obstacle = { kind: 'pit', x, w, h: 0, count: 1, phase };
        break;
      }
      case 'drone':
        obstacle = { kind: 'drone', x, w: 46, h: 30, count: 1, phase };
        break;
    }

    const shards: Shard[] = [];
    if (rng() < p.shardChance) {
      const cx = obstacle.x + obstacle.w / 2;
      const y = obstacle.kind === 'drone' ? GROUND_Y - PLAYER_SIZE / 2 : GROUND_Y - PLAYER_SIZE / 2 - jumpApex(p) * 0.8;
      shards.push({ x: cx, y, taken: false, phase: rng() * Math.PI * 2 });
    }

    const gap = gapSeconds(p, tier);
    const gapAfter = (gap.min + rng() * gap.extra) * v;

    if (gapAfter > v * 1.1 && rng() < p.shardChance * 0.6) {
      shards.push({ x: obstacle.x + obstacle.w + gapAfter / 2, y: GROUND_Y - PLAYER_SIZE / 2, taken: false, phase: rng() * 6 });
    }

    this.nextX = obstacle.x + obstacle.w + gapAfter;
    return { obstacle, shards, gapAfter };
  }
}
