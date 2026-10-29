import { ParticlePool } from '../engine/particles';
import type { GameOutcome, GameStats, HudItem, InputSnapshot, Simulation, SoundCue } from '../engine/types';
import type { RunOptions } from '../modifiers';
import { DragAim } from '../arcade-kit/aim';
import { SimEvents } from '../arcade-kit/events';
import { clamp, holdRamp } from '../arcade-kit/math';
import { createRng, deriveSeed } from '@/lib/utils/random';
import { compileHole, HOLES, type CompiledHole } from './course';
import { collideMovers, createBall, MAX_PUTT_SPEED, stepBall, type BallState } from './physics';

export const MG_WIDTH = 540;
export const MG_HEIGHT = 720;
export const STROKE_CAP = 8;
export const CAP_PENALTY = 2;
export const MAX_DRAG = 170;
export const MIN_POWER = 0.04;
const TURN_SPEED = 1.7;
const POWER_SPEED = 0.75;
const SINK_TIME = 0.75;
const SPLASH_TIME = 0.9;
const CARD_TIME = 4.5;
const CARD_SKIP_AFTER = 0.6;
const FINAL_TIME = 3.5;

export type GolfAction = 'left' | 'right' | 'up' | 'down' | 'putt';
export const GOLF_BINDINGS: Readonly<Record<GolfAction, readonly string[]>> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  putt: ['Space', 'Enter', 'NumpadEnter'],
};

export type GolfPhase = 'aim' | 'rolling' | 'sinking' | 'splash' | 'scorecard' | 'finished';

export function resultName(strokes: number, par: number): string {
  if (strokes === 1) return 'Hole in one!';
  const diff = strokes - par;
  if (diff <= -3) return 'Albatross!';
  if (diff === -2) return 'Eagle!';
  if (diff === -1) return 'Birdie!';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double bogey';
  return `+${diff}`;
}

export class MiniGolfSimulation implements Simulation<GolfAction> {
  readonly particles: ParticlePool;
  holeIndex = 0;
  hole: CompiledHole;
  ball: BallState;
  holeTime = 0;
  phase: GolfPhase = 'aim';
  phaseTime = 0;
  time = 0;
  strokes = 0;
  card: number[] = [];
  aimAngle = 0;
  power = 0.5;
  readonly drag = new DragAim({ maxDrag: MAX_DRAG, minPower: MIN_POWER });
  shotX = 0;
  shotY = 0;
  message = '';
  messageTime = -10;
  holesInOne = 0;
  waterHits = 0;
  outcome: GameOutcome | null = null;

  private readonly events = new SimEvents();
  private holdTurn = 0;
  private holdPower = 0;

  constructor(options: RunOptions) {
    this.particles = new ParticlePool(120, createRng(deriveSeed(options.seed, 'fx')));
    this.hole = compileHole(HOLES[0]!);
    this.ball = createBall(0, 0);
    this.startHole(0);
  }

  get par(): number {
    return this.hole.def.par;
  }

  get score(): number {
    let sum = 0;
    for (const s of this.card) sum += s;
    return this.card.length > this.holeIndex ? sum : sum + this.strokes;
  }

  get parSoFar(): number {
    let sum = 0;
    for (let i = 0; i < this.card.length; i++) sum += HOLES[i]!.par;
    return sum;
  }

  getStats(): GameStats {
    return { strokes: this.score, holes: this.card.length, holesInOne: this.holesInOne, water: this.waterHits };
  }

  getHud(): readonly HudItem[] {
    return [
      { id: 'hole', label: 'Hole', value: `${this.holeIndex + 1}/${HOLES.length}` },
      { id: 'par', label: 'Par', value: String(this.par) },
      { id: 'thisHole', label: 'This hole', value: String(this.strokes) },
    ];
  }

  drainCues(): SoundCue[] {
    return this.events.drainCues();
  }

  drainAnnouncements(): string[] {
    return this.events.drainAnnouncements();
  }

  private startHole(index: number): void {
    this.holeIndex = index;
    const def = HOLES[index]!;
    this.hole = compileHole(def);
    this.ball = createBall(def.tee[0], def.tee[1]);
    this.holeTime = 0;
    this.strokes = 0;
    this.aimAngle = Math.atan2(def.cup[1] - def.tee[1], def.cup[0] - def.tee[0]);
    this.power = 0.5;
    this.drag.cancel();
    this.setPhase('aim');
    this.events.say(`Hole ${index + 1} of ${HOLES.length}: ${def.name}. Par ${def.par}.`);
  }

  private setPhase(phase: GolfPhase): void {
    this.phase = phase;
    this.phaseTime = 0;
  }

  private showMessage(text: string): void {
    this.message = text;
    this.messageTime = this.time;
  }

  update(dt: number, input: InputSnapshot<GolfAction>): void {
    if (this.outcome) return;
    this.time += dt;
    this.phaseTime += dt;
    this.particles.update(dt);
    const t = this.holeTime;
    this.holeTime += dt;

    switch (this.phase) {
      case 'aim':
        this.handleAim(dt, input);
        if (this.phase === 'aim' && this.hole.movers.length > 0 && collideMovers(this.hole, this.ball, t) > 0) {
          this.drag.cancel();
          this.ball.slowTime = 0;
          this.ball.rollTime = 0;
          this.shotX = this.ball.x;
          this.shotY = this.ball.y;
          this.setPhase('rolling');
        }
        break;
      case 'rolling':
        this.roll(t, dt);
        break;
      case 'splash':
        if (this.phaseTime >= SPLASH_TIME) {
          this.ball = createBall(this.shotX, this.shotY);
          if (this.strokes >= STROKE_CAP) this.pickUp();
          else this.setPhase('aim');
        }
        break;
      case 'sinking':
        if (this.phaseTime >= SINK_TIME) this.finishHole(this.strokes);
        break;
      case 'scorecard':
        if (this.phaseTime >= CARD_TIME || (this.phaseTime >= CARD_SKIP_AFTER && (input.actions.putt.pressed || input.pointer.pressed))) {
          this.startHole(this.holeIndex + 1);
        }
        break;
      case 'finished':
        if (this.phaseTime >= FINAL_TIME || (this.phaseTime >= 1.2 && (input.actions.putt.pressed || input.pointer.pressed))) {
          this.outcome = 'won';
        }
        break;
    }
  }

  private handleAim(dt: number, input: InputSnapshot<GolfAction>): void {
    const { left, right, up, down, putt } = input.actions;
    const turn = (right.held ? 1 : 0) - (left.held ? 1 : 0);
    this.holdTurn = turn !== 0 ? this.holdTurn + dt : 0;
    if (turn !== 0) this.aimAngle += turn * TURN_SPEED * holdRamp(this.holdTurn, 0.15, 0.8) * dt;
    const pw = (up.held ? 1 : 0) - (down.held ? 1 : 0);
    this.holdPower = pw !== 0 ? this.holdPower + dt : 0;
    if (pw !== 0) this.power = clamp(this.power + pw * POWER_SPEED * holdRamp(this.holdPower, 0.3, 0.6) * dt, 0.05, 1);

    const result = this.drag.update(input.pointer, true);
    if (this.drag.active || result === 'fire' || result === 'cancel') {
      if (this.drag.power >= MIN_POWER) {
        this.aimAngle = this.drag.angle;
        this.power = Math.max(0.05, this.drag.power);
      }
    }
    if (result === 'fire') {
      this.putt(this.drag.angle, this.drag.power);
      return;
    }
    if (putt.pressed) this.putt(this.aimAngle, this.power);
  }

  putt(angle: number, power: number): void {
    if (this.phase !== 'aim') return;
    const p = clamp(power, 0, 1);
    this.strokes++;
    this.shotX = this.ball.x;
    this.shotY = this.ball.y;
    this.ball.vx = Math.cos(angle) * p * MAX_PUTT_SPEED;
    this.ball.vy = Math.sin(angle) * p * MAX_PUTT_SPEED;
    this.ball.slowTime = 0;
    this.ball.rollTime = 0;
    this.setPhase('rolling');
    this.events.cue('putt');
  }

  private roll(t: number, dt: number): void {
    const info = stepBall(this.hole, this.ball, t, dt);
    if (info.impact > 60) this.events.cue(info.bumper ? 'pop' : 'bounce');
    if (info.event === 'holed') {
      this.events.cue('match');
      this.particles.burst({ x: this.ball.x, y: this.ball.y, count: 18, color: '#ffd23f', speed: 160, life: 0.6, size: 3 });
      const name = resultName(this.strokes, this.par);
      if (this.strokes === 1) this.holesInOne++;
      this.showMessage(name);
      this.events.say(`${name} ${this.strokes} ${this.strokes === 1 ? 'stroke' : 'strokes'} on hole ${this.holeIndex + 1}.`);
      this.setPhase('sinking');
    } else if (info.event === 'water') {
      this.strokes++;
      this.waterHits++;
      this.events.cue('flip');
      this.particles.burst({ x: this.ball.x, y: this.ball.y, count: 16, color: '#38e8ff', speed: 140, life: 0.6, size: 3 });
      this.showMessage('Water! +1 stroke');
      this.events.say('Into the water. One penalty stroke; the ball goes back to where you putted from.');
      this.setPhase('splash');
    } else if (info.event === 'stopped') {
      if (this.strokes >= STROKE_CAP) this.pickUp();
      else this.setPhase('aim');
    }
  }

  private pickUp(): void {
    const scored = STROKE_CAP + CAP_PENALTY;
    this.showMessage(`Stroke limit: ${scored}`);
    this.events.say(`Stroke limit reached. Hole ${this.holeIndex + 1} scores ${scored}.`);
    this.events.cue('lifeLost');
    this.finishHole(scored);
  }

  private finishHole(scored: number): void {
    this.card[this.holeIndex] = scored;
    this.strokes = scored;
    if (this.holeIndex + 1 >= HOLES.length) {
      this.events.cue('win');
      const diff = this.score - this.parSoFar;
      this.events.say(`Round complete: ${this.score} strokes, ${diff === 0 ? 'level par' : diff > 0 ? `${diff} over par` : `${-diff} under par`}.`);
      this.setPhase('finished');
      return;
    }
    this.events.cue('levelUp');
    this.setPhase('scorecard');
  }
}
