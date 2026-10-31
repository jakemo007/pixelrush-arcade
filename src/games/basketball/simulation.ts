import { ParticlePool } from '../engine/particles';
import type { GameOutcome, GameStats, HudItem, InputSnapshot, Simulation, SoundCue } from '../engine/types';
import type { RunOptions } from '../modifiers';
import { DragAim } from '../arcade-kit/aim';
import { SimEvents } from '../arcade-kit/events';
import { clamp, holdRamp } from '../arcade-kit/math';
import { formatDuration } from '@/lib/format';
import { createRng, deriveSeed, type Rng } from '@/lib/utils/random';
import {
  BALL_R,
  BB_H,
  BB_W,
  FLOOR_Y,
  GRAVITY,
  HOOP_X,
  inNetZone,
  RELEASE_Y,
  RIM_Y,
  shotSpeed,
  stepFlight,
  THREE_POINT_DISTANCE,
  type Ball,
} from './court';

export const GAME_SECONDS = 60;
export const SWISH_TIME_BONUS = 2;
export const SWISH_POINTS = 1;
export const MAX_MULTIPLIER = 3;
export const STREAK_STEP = 3;
export const MAX_AIM_DEG = 80;
export const MIN_AIM_DEG = 15;
export const MAX_DRAG = 180;
export const PREVIEW_SECONDS = 0.26;
const PREVIEW_DOTS = 9;
const SHOT_TIMEOUT = 4.5;
const RESET_TIME = 0.45;
const END_TIME = 1.6;
const TURN_SPEED = 0.9;
const POWER_SPEED = 0.6;

export type HoopAction = 'left' | 'right' | 'up' | 'down' | 'shoot';
export const HOOP_BINDINGS: Readonly<Record<HoopAction, readonly string[]>> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  shoot: ['Space', 'Enter', 'NumpadEnter'],
};

export type HoopPhase = 'aim' | 'flight' | 'reset' | 'ending';

const DEG = Math.PI / 180;

export function spotRange(makes: number): [number, number] {
  if (makes < 3) return [110, 190];
  if (makes < 6) return [170, 270];
  if (makes < 9) return [230, 330];
  return [260, 390];
}

export function streakMultiplier(streak: number): number {
  return Math.min(MAX_MULTIPLIER, 1 + Math.floor(Math.max(0, streak - 1) / STREAK_STEP));
}

export function basketPoints(threePointer: boolean, swish: boolean, streak: number): number {
  return ((threePointer ? 3 : 2) + (swish ? SWISH_POINTS : 0)) * streakMultiplier(streak);
}

export class BasketballSimulation implements Simulation<HoopAction> {
  readonly particles: ParticlePool;
  ball: Ball;
  spotX: number;
  phase: HoopPhase = 'aim';
  phaseTime = 0;
  time = 0;
  clock = GAME_SECONDS;
  score = 0;
  makes = 0;
  shots = 0;
  swishes = 0;
  streak = 0;
  bestStreak = 0;
  angle = -55 * DEG;
  power = 0.55;
  readonly drag = new DragAim({ maxDrag: MAX_DRAG, minPower: 0.05 });
  readonly previewX = new Float32Array(PREVIEW_DOTS);
  readonly previewY = new Float32Array(PREVIEW_DOTS);
  scored = false;
  fromBelow = false;
  touched = false;
  label = '';
  labelTime = -10;
  outcome: GameOutcome | null = null;

  private readonly rng: Rng;
  private readonly events = new SimEvents();
  private flightTime = 0;
  private bounces = 0;
  private nextSpotX: number;
  private holdTurn = 0;
  private holdPower = 0;
  private lastTick = GAME_SECONDS;

  constructor(options: RunOptions) {
    this.rng = createRng(options.seed);
    this.particles = new ParticlePool(140, createRng(deriveSeed(options.seed, 'fx')));
    this.spotX = this.pickSpot();
    this.nextSpotX = this.spotX;
    this.ball = { x: this.spotX, y: RELEASE_Y, vx: 0, vy: 0 };
    this.events.say(`60 seconds. ${this.isThree ? 'Three' : 'Two'}-point spot.`);
  }

  get spotDistance(): number {
    return HOOP_X - this.spotX;
  }

  get isThree(): boolean {
    return this.spotDistance >= THREE_POINT_DISTANCE;
  }

  get multiplier(): number {
    return streakMultiplier(this.streak + 1);
  }

  getStats(): GameStats {
    return { score: this.score, makes: this.makes, shots: this.shots, swishes: this.swishes, bestStreak: this.bestStreak };
  }

  getHud(): readonly HudItem[] {
    return [
      { id: 'time', label: 'Time', value: formatDuration(Math.ceil(this.clock) * 1000) },
      { id: 'streak', label: 'Streak', value: `x${this.multiplier}` },
      { id: 'spot', label: 'Spot', value: this.isThree ? '3 PT' : '2 PT' },
    ];
  }

  drainCues(): SoundCue[] {
    return this.events.drainCues();
  }

  drainAnnouncements(): string[] {
    return this.events.drainAnnouncements();
  }

  private pickSpot(): number {
    const [lo, hi] = spotRange(this.makes);
    const d = lo + (hi - lo) * this.rng();
    return Math.round(HOOP_X - d);
  }

  update(dt: number, input: InputSnapshot<HoopAction>): void {
    if (this.outcome) return;
    this.time += dt;
    this.phaseTime += dt;
    this.particles.update(dt);

    if (this.phase === 'ending') {
      if (this.phaseTime >= END_TIME) this.outcome = this.score > 0 ? 'won' : 'lost';
      return;
    }

    this.clock = Math.max(0, this.clock - dt);
    const whole = Math.ceil(this.clock);
    if (whole < this.lastTick) {
      this.lastTick = whole;
      if (whole <= 5 && whole > 0) this.events.cue('tick');
      if (whole === 10) this.events.say('10 seconds left.');
    }

    switch (this.phase) {
      case 'aim':
        if (this.clock <= 0) {
          this.endGame();
          return;
        }
        this.handleAim(dt, input);
        break;
      case 'flight':
        this.fly(dt);
        break;
      case 'reset':
        if (this.phaseTime >= RESET_TIME) {
          if (this.clock <= 0) {
            this.endGame();
            return;
          }
          this.spotX = this.nextSpotX;
          this.ball = { x: this.spotX, y: RELEASE_Y, vx: 0, vy: 0 };
          this.phase = 'aim';
          this.phaseTime = 0;
          this.updatePreview();
        }
        break;
    }
  }

  private handleAim(dt: number, input: InputSnapshot<HoopAction>): void {
    const { left, right, up, down, shoot } = input.actions;
    const turn = (right.held ? 1 : 0) - (left.held ? 1 : 0);
    this.holdTurn = turn !== 0 ? this.holdTurn + dt : 0;
    if (turn !== 0) this.setAim(this.angle + turn * TURN_SPEED * holdRamp(this.holdTurn, 0.2, 0.7) * dt, this.power);
    const pw = (up.held ? 1 : 0) - (down.held ? 1 : 0);
    this.holdPower = pw !== 0 ? this.holdPower + dt : 0;
    if (pw !== 0) this.setAim(this.angle, this.power + pw * POWER_SPEED * holdRamp(this.holdPower, 0.25, 0.6) * dt);

    const result = this.drag.update(input.pointer, true);
    if ((this.drag.active || result === 'fire') && this.drag.power >= 0.05) this.setAim(this.drag.angle, this.drag.power);
    if (result === 'fire') this.shoot(this.angle, this.power);
    else if (shoot.pressed) this.shoot(this.angle, this.power);
    this.updatePreview();
  }

  private setAim(angle: number, power: number): void {
    this.angle = clamp(angle, -MAX_AIM_DEG * DEG, -MIN_AIM_DEG * DEG);
    this.power = clamp(power, 0, 1);
  }

  private updatePreview(): void {
    const speed = shotSpeed(this.power);
    const vx = Math.cos(this.angle) * speed;
    const vy = Math.sin(this.angle) * speed;
    for (let i = 0; i < PREVIEW_DOTS; i++) {
      const t = ((i + 1) / PREVIEW_DOTS) * PREVIEW_SECONDS;
      this.previewX[i] = this.ball.x + vx * t;
      this.previewY[i] = this.ball.y + vy * t + 0.5 * GRAVITY * t * t;
    }
  }

  shoot(angle: number, power: number): void {
    if (this.phase !== 'aim') return;
    this.setAim(angle, power);
    const speed = shotSpeed(this.power);
    this.ball.vx = Math.cos(this.angle) * speed;
    this.ball.vy = Math.sin(this.angle) * speed;
    this.shots++;
    this.scored = false;
    this.fromBelow = false;
    this.touched = false;
    this.flightTime = 0;
    this.bounces = 0;
    this.phase = 'flight';
    this.phaseTime = 0;
    this.events.cue('launch');
  }

  private fly(dt: number): void {
    const ball = this.ball;
    this.flightTime += dt;
    const ev = stepFlight(ball, dt, this.scored && inNetZone(ball));
    if (ev.rim > 40 || ev.board > 40) {
      this.touched = true;
      this.events.cue(ev.rim > 0 ? 'brickHit' : 'bounce');
    } else if (ev.rim > 0 || ev.board > 0) {
      this.touched = true;
    }
    if (ev.floor > 120) {
      this.bounces++;
      this.events.cue('land');
    }
    if (ev.fromBelow) this.fromBelow = true;
    if (ev.scored && !this.scored && !this.fromBelow) this.basket();

    const out = ball.x < -BALL_R * 3 || ball.x > BB_W + BALL_R * 3 || ball.y > BB_H + BALL_R * 3;
    const settled = ball.y >= FLOOR_Y - BALL_R - 0.5 && Math.abs(ball.vy) < 1 && Math.abs(ball.vx) < 60;
    const done =
      out ||
      settled ||
      this.bounces >= 2 ||
      this.flightTime >= SHOT_TIMEOUT ||
      (this.scored && ball.y > RIM_Y + 70 && this.flightTime > 0.2);
    if (done) this.endShot();
  }

  private basket(): void {
    this.scored = true;
    this.makes++;
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const swish = !this.touched;
    const three = this.isThree;
    const points = basketPoints(three, swish, this.streak);
    this.score += points;
    if (swish) {
      this.swishes++;
      this.clock += SWISH_TIME_BONUS;
      this.events.cue('swish');
    } else {
      this.events.cue('collect');
    }
    this.label = `${swish ? 'SWISH ' : ''}+${points}`;
    this.labelTime = this.time;
    this.particles.burst({ x: HOOP_X, y: RIM_Y + 10, count: 16, color: swish ? '#4dffb5' : '#ffd23f', speed: 160, life: 0.6, size: 3 });
    const mult = streakMultiplier(this.streak);
    this.events.say(
      `${swish ? 'Swish! ' : 'Basket! '}${points} points${mult > 1 ? `, streak x${mult}` : ''}${swish ? ', plus 2 seconds' : ''}.`,
    );
  }

  private endShot(): void {
    if (!this.scored) {
      if (this.streak > 0) this.events.say('Missed. Streak lost.');
      else this.events.say('Missed.');
      this.streak = 0;
      this.label = 'MISS';
      this.labelTime = this.time;
      this.nextSpotX = this.spotX;
    } else {
      this.nextSpotX = this.pickSpot();
      const three = HOOP_X - this.nextSpotX >= THREE_POINT_DISTANCE;
      if (this.clock > 0) this.events.say(`New spot: ${three ? 'three-pointer' : 'two-pointer'}.`);
    }
    this.phase = 'reset';
    this.phaseTime = 0;
  }

  private endGame(): void {
    this.phase = 'ending';
    this.phaseTime = 0;
    this.events.cue(this.score > 0 ? 'win' : 'gameOver');
    this.events.say(`Time! ${this.makes} of ${this.shots} shots made for ${this.score} points.`);
  }
}

export { BB_H, BB_W };
