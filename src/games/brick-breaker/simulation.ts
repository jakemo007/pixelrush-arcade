import { circleRectContact, clamp, rectsOverlap, reflect, type Rect } from '../engine/collision';
import { ParticlePool } from '../engine/particles';
import type { GameOutcome, GameStats, HudItem, InputSnapshot, Simulation, SoundCue } from '../engine/types';
import type { RunOptions } from '../modifiers';
import { createRng, deriveSeed, pickWeighted, randomRange, type Rng } from '@/lib/utils/random';

export const BB_WIDTH = 540;
export const BB_HEIGHT = 720;
export const PADDLE_Y = 664;
export const PADDLE_H = 14;
export const BASE_PADDLE_W = 100;
export const BALL_R = 7;
export const BRICK_W = 50;
export const BRICK_H = 20;
export const BRICK_GAP = 4;
export const GRID_X = 2;
export const GRID_Y = 96;
export const COLUMNS = 10;
export const START_LIVES = 3;
export const MAX_LIVES = 5;
export const MAX_SUBSTEP = 3;
export const MAX_BOUNCE_ANGLE = (60 * Math.PI) / 180;
export const MIN_VERTICAL_RATIO = 0.3;

const PADDLE_KEY_SPEED = 720;
const PADDLE_POINTER_SPEED = 2400;
const CAPSULE_SPEED = 170;
const CAPSULE_W = 34;
const CAPSULE_H = 14;
const CLEAR_INTERLUDE = 1.8;
const END_DELAY = 0.9;
const STUCK_SECONDS = 20;

export type BrickBreakerAction = 'left' | 'right' | 'launch';
export const BRICK_BREAKER_BINDINGS: Readonly<Record<BrickBreakerAction, readonly string[]>> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  launch: ['Space', 'ArrowUp', 'KeyW'],
};

export interface LevelDef {
  name: string;
  rows: readonly string[];
}

export const LEVELS: readonly LevelDef[] = [
  { name: 'Warm-Up', rows: ['1111111111', '1111111111', '1111111111', '1111111111'] },
  { name: 'Pyramid', rows: ['....22....', '...2112...', '..211112..', '.21111112.', '2111111112'] },
  { name: 'Stripes', rows: ['2222222222', '1111111111', '..........', '3333333333', '1111111111'] },
  { name: 'Checkerboard', rows: ['2.2.2.2.2.', '.1.1.1.1.1', '3.3.3.3.3.', '.1.1.1.1.1', '2.2.2.2.2.', '.2.2.2.2.2'] },
  { name: 'Fortress', rows: ['1111111111', '1#222222#1', '1#2.33.2#1', '1#2.33.2#1', '1#222222#1', '1111111111'] },
  { name: 'Diamond', rows: ['....33....', '...3223...', '..321123..', '.32111123.', '..321123..', '...3223...', '....33....'] },
  { name: 'Gates', rows: ['3333333333', '2#2#22#2#2', '1111111111', '1#1#11#1#1', '2222222222'] },
  { name: 'Finale', rows: ['3333333333', '3#222222#3', '3#2.11.2#3', '3#2.11.2#3', '3#222222#3', '3333333333', '2222222222'] },
];

export interface Brick extends Rect {
  hp: number;
  maxHp: number;
  steel: boolean;
  alive: boolean;
  flash: number;
}

export type CapsuleKind = 'wide' | 'slow' | 'life';

export interface Capsule {
  kind: CapsuleKind;
  x: number;
  y: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export type Phase = 'serve' | 'live' | 'cleared' | 'ending';

export function parseLevel(rows: readonly string[]): Brick[] {
  const bricks: Brick[] = [];
  rows.forEach((row, r) => {
    for (let c = 0; c < COLUMNS; c++) {
      const ch = row[c] ?? '.';
      if (ch === '.') continue;
      const steel = ch === '#';
      const hp = steel ? Infinity : clamp(Number(ch) || 1, 1, 3);
      bricks.push({
        x: GRID_X + c * (BRICK_W + BRICK_GAP),
        y: GRID_Y + r * (BRICK_H + BRICK_GAP),
        w: BRICK_W,
        h: BRICK_H,
        hp,
        maxHp: steel ? 0 : hp,
        steel,
        alive: true,
        flash: 0,
      });
    }
  });
  return bricks;
}

export function brickPoints(maxHp: number, comboIndex: number): number {
  return Math.round(10 * maxHp * (1 + 0.25 * Math.min(Math.max(0, comboIndex), 8)));
}

export function levelSpeed(level: number, modifier: string | null): number {
  const base = Math.min(380 + 32 * (level - 1), 600);
  return modifier === 'fast-ball' ? base * 1.15 : base;
}

export function enforceMinVertical(ball: Ball, preferDown: boolean): void {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed === 0) return;
  const minVy = speed * MIN_VERTICAL_RATIO;
  if (Math.abs(ball.vy) >= minVy) return;
  const sy = ball.vy === 0 ? (preferDown ? 1 : -1) : Math.sign(ball.vy);
  const sx = ball.vx === 0 ? 1 : Math.sign(ball.vx);
  ball.vy = sy * minVy;
  ball.vx = sx * Math.sqrt(speed * speed - minVy * minVy);
}

export class BrickBreakerSimulation implements Simulation<BrickBreakerAction> {
  readonly modifier: string | null;
  readonly particles: ParticlePool;
  bricks: Brick[] = [];
  capsules: Capsule[] = [];
  ball: Ball = { x: BB_WIDTH / 2, y: PADDLE_Y - BALL_R, vx: 0, vy: 0 };

  level = 1;
  levelReached = 1;
  phase: Phase = 'serve';
  lives: number;
  score = 0;
  bricksBroken = 0;
  livesLost = 0;
  combo = 0;
  paddleX: number;
  paddleW: number;
  wideTimer = 0;
  slowTimer = 0;
  phaseTime = 0;
  shake = 0;
  outcome: GameOutcome | null = null;
  won = false;

  private readonly rng: Rng;
  private pointerMode = false;
  private paddleHits = 0;
  private sincePaddle = 0;
  private timer = 0;
  private cues: SoundCue[] = [];
  private announcements: string[] = [];

  constructor(options: RunOptions) {
    this.modifier = options.modifier;
    this.rng = createRng(options.seed);
    this.particles = new ParticlePool(220, createRng(deriveSeed(options.seed, 'fx')));
    this.lives = options.modifier === 'bonus-life' ? START_LIVES + 1 : START_LIVES;
    this.paddleW = this.basePaddleWidth();
    this.paddleX = (BB_WIDTH - this.paddleW) / 2;
    this.loadLevel(1);
  }

  get levelName(): string {
    return LEVELS[this.level - 1]?.name ?? '';
  }

  get breakableRemaining(): number {
    let n = 0;
    for (const b of this.bricks) if (b.alive && !b.steel) n++;
    return n;
  }

  getStats(): GameStats {
    return {
      score: this.score,
      bricksBroken: this.bricksBroken,
      levelReached: this.levelReached,
      livesLost: this.livesLost,
    };
  }

  getHud(): readonly HudItem[] {
    return [
      { id: 'level', label: 'Level', value: `${this.level}/${LEVELS.length}` },
      { id: 'lives', label: 'Lives', value: String(this.lives) },
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

  paddleRect(): Rect {
    return { x: this.paddleX, y: PADDLE_Y, w: this.paddleW, h: PADDLE_H };
  }

  currentSpeed(): number {
    const base = levelSpeed(this.level, this.modifier) + Math.min(this.paddleHits * 4, 90);
    return this.slowTimer > 0 ? base * 0.75 : base;
  }

  private basePaddleWidth(): number {
    return BASE_PADDLE_W * (this.modifier === 'narrow-paddle' ? 0.8 : 1);
  }

  private loadLevel(level: number): void {
    this.level = level;
    this.levelReached = Math.max(this.levelReached, level);
    this.bricks = parseLevel(LEVELS[level - 1]!.rows);
    this.capsules = [];
    this.paddleHits = 0;
    this.combo = 0;
    this.setPhase('serve');
    this.announcements.push(`Level ${level}: ${this.levelName}`);
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.phaseTime = 0;
    if (phase === 'serve' || phase === 'cleared') this.placeBallOnPaddle();
  }

  private placeBallOnPaddle(): void {
    this.ball.x = this.paddleX + this.paddleW / 2;
    this.ball.y = PADDLE_Y - BALL_R - 0.5;
  }

  update(dt: number, input: InputSnapshot<BrickBreakerAction>): void {
    if (this.outcome) return;
    this.phaseTime += dt;
    this.particles.update(dt);
    this.shake = Math.max(0, this.shake - dt * 3);
    this.wideTimer = Math.max(0, this.wideTimer - dt);
    this.slowTimer = Math.max(0, this.slowTimer - dt);
    for (const b of this.bricks) b.flash = Math.max(0, b.flash - dt * 6);

    if (this.phase === 'ending') {
      this.timer -= dt;
      if (this.timer <= 0) this.outcome = this.won ? 'won' : 'lost';
      return;
    }

    this.movePaddle(dt, input);

    if (this.phase === 'cleared') {
      this.placeBallOnPaddle();
      this.timer -= dt;
      if (this.timer <= 0) this.loadLevel(this.level + 1);
      return;
    }

    if (this.phase === 'serve') {
      this.placeBallOnPaddle();
      if (input.actions.launch.pressed || input.pointer.pressed) this.launch();
      return;
    }

    this.updateCapsules(dt);
    this.moveBall(dt);
  }

  private movePaddle(dt: number, input: InputSnapshot<BrickBreakerAction>): void {
    const { left, right } = input.actions;
    const center = this.paddleX + this.paddleW / 2;
    const target = this.basePaddleWidth() * (this.wideTimer > 0 ? 1.5 : 1);
    this.paddleW += (target - this.paddleW) * Math.min(1, dt * 10);

    let x = center - this.paddleW / 2;
    if (left.held || right.held) {
      this.pointerMode = false;
      x += ((right.held ? 1 : 0) - (left.held ? 1 : 0)) * PADDLE_KEY_SPEED * dt;
    } else if (input.pointer.moved && input.pointer.inside) {
      this.pointerMode = true;
    }
    if (this.pointerMode && input.pointer.inside) {
      const desired = input.pointer.x - this.paddleW / 2;
      const maxStep = PADDLE_POINTER_SPEED * dt;
      x += clamp(desired - x, -maxStep, maxStep);
    }
    this.paddleX = clamp(x, 0, BB_WIDTH - this.paddleW);
  }

  private launch(): void {
    let angle = randomRange(this.rng, -0.35, 0.35);
    if (Math.abs(angle) < 0.12) angle = angle < 0 ? -0.12 : 0.12;
    const speed = this.currentSpeed();
    this.ball.vx = Math.sin(angle) * speed;
    this.ball.vy = -Math.cos(angle) * speed;
    this.sincePaddle = 0;
    this.setPhase('live');
    this.cues.push('launch');
  }

  private moveBall(dt: number): void {
    const ball = this.ball;
    const speed = this.currentSpeed();
    const len = Math.hypot(ball.vx, ball.vy);
    if (!Number.isFinite(ball.x) || !Number.isFinite(ball.y) || !Number.isFinite(len) || len === 0) {
      this.setPhase('serve');
      return;
    }
    ball.vx = (ball.vx / len) * speed;
    ball.vy = (ball.vy / len) * speed;

    this.sincePaddle += dt;
    if (this.sincePaddle > STUCK_SECONDS) {
      const a = 0.26;
      const vx = ball.vx * Math.cos(a) - ball.vy * Math.sin(a);
      const vy = ball.vx * Math.sin(a) + ball.vy * Math.cos(a);
      ball.vx = vx;
      ball.vy = vy;
      enforceMinVertical(ball, true);
      this.sincePaddle = 0;
    }

    const steps = Math.max(1, Math.ceil((speed * dt) / MAX_SUBSTEP));
    const sub = dt / steps;
    for (let i = 0; i < steps; i++) {
      ball.x += ball.vx * sub;
      ball.y += ball.vy * sub;
      this.collideWalls(true);
      this.collideBricks();
      if (this.phase !== 'live') return;
      this.collideWalls(false);
      this.collidePaddle();
      if (ball.y - BALL_R > BB_HEIGHT) {
        this.loseLife();
        return;
      }
    }
  }

  private collideWalls(withSound: boolean): void {
    const ball = this.ball;
    let hit = false;
    if (ball.x < BALL_R) {
      ball.x = BALL_R;
      ball.vx = Math.abs(ball.vx);
      hit = true;
    } else if (ball.x > BB_WIDTH - BALL_R) {
      ball.x = BB_WIDTH - BALL_R;
      ball.vx = -Math.abs(ball.vx);
      hit = true;
    }
    if (ball.y < BALL_R) {
      ball.y = BALL_R;
      ball.vy = Math.abs(ball.vy);
      hit = true;
    }
    if (hit) {
      enforceMinVertical(ball, true);
      if (withSound) this.cues.push('bounce');
    }
  }

  private collideBricks(): void {
    const ball = this.ball;
    let nx = 0;
    let ny = 0;
    let depth = 0;
    const hits: Brick[] = [];
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (ball.x + BALL_R < brick.x || ball.x - BALL_R > brick.x + brick.w) continue;
      if (ball.y + BALL_R < brick.y || ball.y - BALL_R > brick.y + brick.h) continue;
      const contact = circleRectContact(ball.x, ball.y, BALL_R, brick);
      if (!contact) continue;
      nx += contact.nx;
      ny += contact.ny;
      depth = Math.max(depth, contact.depth);
      hits.push(brick);
    }
    if (hits.length === 0) return;

    let length = Math.hypot(nx, ny);
    if (length < 1e-6) {
      nx = 0;
      ny = ball.vy > 0 ? -1 : 1;
      length = 1;
    }
    nx /= length;
    ny /= length;
    ball.x += nx * depth;
    ball.y += ny * depth;
    if (ball.vx * nx + ball.vy * ny < 0) {
      const r = reflect(ball.vx, ball.vy, nx, ny);
      ball.vx = r.vx;
      ball.vy = r.vy;
      enforceMinVertical(ball, ny > 0);
    }
    for (const brick of hits) this.damage(brick);
  }

  private collidePaddle(): void {
    const ball = this.ball;
    if (ball.vy <= 0 || ball.y > PADDLE_Y + PADDLE_H) return;
    const contact = circleRectContact(ball.x, ball.y, BALL_R, this.paddleRect());
    if (!contact) return;
    const half = this.paddleW / 2 + BALL_R;
    const offset = clamp((ball.x - (this.paddleX + this.paddleW / 2)) / half, -1, 1);
    const angle = offset * MAX_BOUNCE_ANGLE;
    this.paddleHits++;
    const speed = this.currentSpeed();
    ball.vx = Math.sin(angle) * speed;
    ball.vy = -Math.cos(angle) * speed;
    ball.y = PADDLE_Y - BALL_R - 0.01;
    this.combo = 0;
    this.sincePaddle = 0;
    this.cues.push('bounce');
  }

  private damage(brick: Brick): void {
    brick.flash = 1;
    if (brick.steel) {
      this.cues.push('steel');
      return;
    }
    brick.hp -= 1;
    if (brick.hp > 0) {
      this.score += 5;
      this.cues.push('brickHit');
      return;
    }
    brick.alive = false;
    this.score += brickPoints(brick.maxHp, this.combo);
    this.combo++;
    this.bricksBroken++;
    this.cues.push('brick');
    const colors = ['#38e8ff', '#a78bfa', '#ff4fd8'];
    this.particles.burst({
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h / 2,
      count: 12,
      color: colors[brick.maxHp - 1] ?? '#38e8ff',
      speed: 220,
      life: 0.5,
      size: 4,
      gravity: 500,
    });
    this.maybeDropCapsule(brick);

    if (this.breakableRemaining === 0) this.clearLevel();
  }

  private maybeDropCapsule(brick: Brick): void {
    if (this.capsules.length >= 3 || this.rng() >= 0.09) return;
    const kind = pickWeighted<CapsuleKind>(this.rng, [
      ['wide', 6],
      ['slow', 2.5],
      ['life', this.lives < MAX_LIVES ? 1.5 : 0],
    ]);
    this.capsules.push({ kind, x: brick.x + brick.w / 2 - CAPSULE_W / 2, y: brick.y });
  }

  private updateCapsules(dt: number): void {
    const paddle = this.paddleRect();
    this.capsules = this.capsules.filter((c) => {
      c.y += CAPSULE_SPEED * dt;
      if (rectsOverlap({ x: c.x, y: c.y, w: CAPSULE_W, h: CAPSULE_H }, paddle)) {
        this.applyCapsule(c.kind);
        return false;
      }
      return c.y < BB_HEIGHT;
    });
  }

  private applyCapsule(kind: CapsuleKind): void {
    this.cues.push('powerup');
    if (kind === 'wide') {
      this.wideTimer = 12;
      this.announcements.push('Wide paddle');
    } else if (kind === 'slow') {
      this.slowTimer = 10;
      this.announcements.push('Slow ball');
    } else {
      this.lives = Math.min(MAX_LIVES, this.lives + 1);
      this.announcements.push(`Extra life. ${this.lives} lives`);
    }
  }

  private clearLevel(): void {
    this.score += 100 * this.level;
    this.capsules = [];
    if (this.level >= LEVELS.length) {
      this.won = true;
      this.score += this.lives * 250;
      this.cues.push('win');
      this.announcements.push('All levels cleared!');
      this.timer = END_DELAY + 0.6;
      this.setPhase('ending');
      return;
    }
    this.levelReached = Math.max(this.levelReached, this.level + 1);
    this.cues.push('levelUp');
    this.announcements.push(`Level ${this.level} cleared`);
    this.timer = CLEAR_INTERLUDE;
    this.setPhase('cleared');
  }

  private loseLife(): void {
    this.lives -= 1;
    this.livesLost += 1;
    this.combo = 0;
    this.capsules = [];
    this.wideTimer = 0;
    this.slowTimer = 0;
    this.shake = 0.8;
    if (this.lives <= 0) {
      this.lives = 0;
      this.cues.push('gameOver');
      this.timer = END_DELAY;
      this.setPhase('ending');
      return;
    }
    this.cues.push('lifeLost');
    this.announcements.push(`Ball lost. ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left`);
    this.setPhase('serve');
  }
}
