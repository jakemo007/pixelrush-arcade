import type { GameOutcome, GameStats, HudItem, InputSnapshot, Simulation, SoundCue } from '../engine/types';
import type { RunOptions } from '../modifiers';
import { SimEvents } from '../arcade-kit/events';
import { clamp, smoothing, wrapAngle } from '../arcade-kit/math';
import { formatRaceTime } from '@/lib/format';
import { createCar, driveCar, forwardSpeed, isOffTrack, lateralSpeed, MAX_SPEED, moveCar, speedOf, type Car, type Controls } from './car';
import { LapTracker } from './laps';
import { buildTrack, emptyNearest, nearestPoint, pointAt, type Nearest, type Track } from './track';

export const CR_WIDTH = 540;
export const CR_HEIGHT = 720;
export const LAPS = 3;
export const COUNTDOWN_SECONDS = 3;
export const DNF_SECONDS = 600;
export const TOUCH_BRAKE_Y = CR_HEIGHT - 116;
export const TOUCH_STEER_RANGE = CR_WIDTH * 0.3;
const FINISH_SECONDS = 3;
const GHOST_RATE = 30;
const SKID_CAPACITY = 360;

export type RaceAction = 'up' | 'down' | 'left' | 'right';
export const RACE_BINDINGS: Readonly<Record<RaceAction, readonly string[]>> = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
};

export type RacePhase = 'countdown' | 'racing' | 'finished' | 'dnf';

let sharedTrack: Track | null = null;
export function getTrack(): Track {
  sharedTrack ??= buildTrack();
  return sharedTrack;
}

export function touchSteer(x: number): number {
  const raw = clamp((x - CR_WIDTH / 2) / TOUCH_STEER_RANGE, -1, 1);
  const dead = 0.06;
  if (Math.abs(raw) < dead) return 0;
  return Math.sign(raw) * ((Math.abs(raw) - dead) / (1 - dead));
}

export class CarRacingSimulation implements Simulation<RaceAction> {
  readonly modifier: string | null;
  readonly track: Track;
  readonly car: Car;
  readonly near: Nearest = emptyNearest();
  readonly laps: LapTracker;
  phase: RacePhase = 'countdown';
  phaseTime = 0;
  raceTime = 0;
  finishTime = 0;
  lapStart = 0;
  lapTimes: number[] = [];
  bestLap = 0;
  lastLap = 0;
  lastLapAt = -10;
  lastLapWasBest = false;
  offTrack = false;
  wrongWay = false;
  impacts = 0;
  camAngle: number;
  camZoom = 1;
  shake = 0;
  controls: Controls = { throttle: 0, brake: 0, steer: 0 };
  touchActive = false;
  touchX = CR_WIDTH / 2;
  ghost: Float32Array | null = null;
  readonly skidX = new Float32Array(SKID_CAPACITY);
  readonly skidY = new Float32Array(SKID_CAPACITY);
  skidCount = 0;
  skidHead = 0;
  outcome: GameOutcome | null = null;

  private readonly events = new SimEvents();
  private ghostRec: number[] = [];
  private wrongWayTime = 0;
  private lastCrash = -10;
  private lastCount = COUNTDOWN_SECONDS + 1;
  private stepCount = 0;
  private time = 0;

  constructor(options: RunOptions) {
    this.modifier = options.modifier;
    this.track = getTrack();
    const start = pointAt(this.track, -42);
    this.car = createCar(start.x, start.y, Math.atan2(start.ty, start.tx));
    this.camAngle = this.car.heading;
    nearestPoint(this.track, this.car.x, this.car.y, -1, this.near);
    this.laps = new LapTracker(this.track);
    this.events.say(`Three laps. Get ready.`);
  }

  get score(): number {
    if (this.phase === 'countdown') return 0;
    return Math.round((this.phase === 'racing' ? this.raceTime : this.finishTime) * 1000);
  }

  get currentLap(): number {
    return Math.min(LAPS, this.laps.lapsDone + 1);
  }

  get speed(): number {
    return speedOf(this.car);
  }

  get lapElapsed(): number {
    return this.raceTime - this.lapStart;
  }

  get countdownValue(): number {
    return this.phase === 'countdown' ? Math.ceil(COUNTDOWN_SECONDS - this.phaseTime) : 0;
  }

  getStats(): GameStats {
    return {
      time: this.score,
      bestLap: Math.round(this.bestLap * 1000),
      laps: this.laps.lapsDone,
      impacts: this.impacts,
    };
  }

  getHud(): readonly HudItem[] {
    return [
      { id: 'lap', label: 'Lap', value: `${this.currentLap}/${LAPS}` },
      { id: 'bestLap', label: 'Best lap', value: this.bestLap > 0 ? formatRaceTime(this.bestLap * 1000) : '–' },
    ];
  }

  drainCues(): SoundCue[] {
    return this.events.drainCues();
  }

  drainAnnouncements(): string[] {
    return this.events.drainAnnouncements();
  }

  update(dt: number, input: InputSnapshot<RaceAction>): void {
    if (this.outcome) return;
    this.time += dt;
    this.phaseTime += dt;
    this.stepCount++;
    this.shake = Math.max(0, this.shake - dt * 3);

    const controls = this.readControls(input);

    if (this.phase === 'countdown') {
      const n = Math.ceil(COUNTDOWN_SECONDS - this.phaseTime);
      if (n !== this.lastCount && n > 0) {
        this.lastCount = n;
        this.events.cue('tick');
        this.events.say(String(n));
      }
      if (this.phaseTime >= COUNTDOWN_SECONDS) {
        this.phase = 'racing';
        this.phaseTime = 0;
        this.events.cue('launch');
        this.events.say('Go!');
      }
      this.updateCamera(dt);
      return;
    }

    if (this.phase === 'finished' || this.phase === 'dnf') {
      this.simulateCar({ throttle: 0, brake: 0.6, steer: 0 }, dt, false);
      if (this.phaseTime >= (this.phase === 'finished' ? FINISH_SECONDS : 1)) this.outcome = this.phase === 'finished' ? 'won' : 'lost';
      return;
    }

    this.raceTime += dt;
    this.simulateCar(controls, dt, true);
    this.recordGhost();

    if (this.phase === 'racing' && this.raceTime >= DNF_SECONDS) {
      this.phase = 'dnf';
      this.phaseTime = 0;
      this.finishTime = this.raceTime;
      this.events.cue('gameOver');
      this.events.say('Time limit reached. Did not finish.');
    }
  }

  private readControls(input: InputSnapshot<RaceAction>): Controls {
    const { up, down, left, right } = input.actions;
    const c = this.controls;
    c.throttle = up.held ? 1 : 0;
    c.brake = down.held ? 1 : 0;
    c.steer = (right.held ? 1 : 0) - (left.held ? 1 : 0);
    const p = input.pointer;
    this.touchActive = p.down;
    if (p.down) {
      this.touchX = p.x;
      if (p.y >= TOUCH_BRAKE_Y) {
        c.brake = 1;
        c.throttle = 0;
      } else if (!down.held) {
        c.throttle = 1;
      }
      if (c.steer === 0) c.steer = touchSteer(p.x);
    }
    return c;
  }

  private simulateCar(controls: Controls, dt: number, live: boolean): void {
    const car = this.car;
    const x0 = car.x;
    const y0 = car.y;
    const onGrass = isOffTrack(this.near);
    driveCar(car, controls, onGrass, dt);
    const impact = moveCar(car, this.track, this.near, dt);
    if (impact > 0) {
      if (impact > 90) {
        this.impacts++;
        this.shake = Math.min(1, impact / 500);
        if (this.time - this.lastCrash > 0.35) {
          this.lastCrash = this.time;
          this.events.cue(impact > 220 ? 'crash' : 'bounce');
        }
      }
    }
    this.offTrack = isOffTrack(this.near);
    this.updateSkids();
    this.updateCamera(dt);
    if (!live) return;

    const tx = this.track.tx[this.near.index]!;
    const ty = this.track.ty[this.near.index]!;
    const along = car.vx * tx + car.vy * ty;
    this.wrongWayTime = along < -40 ? this.wrongWayTime + dt : 0;
    const wrong = this.wrongWayTime > 0.8;
    if (wrong && !this.wrongWay) this.events.say('Wrong way!');
    this.wrongWay = wrong;

    const cross = this.laps.update(x0, y0, car.x, car.y);
    if (cross.event === 'lap') {
      const at = this.raceTime - dt * (1 - cross.t);
      this.completeLap(at);
    }
  }

  private completeLap(at: number): void {
    const lapTime = at - this.lapStart;
    this.lapTimes.push(lapTime);
    this.lastLap = lapTime;
    this.lastLapAt = this.time;
    const best = this.bestLap === 0 || lapTime < this.bestLap;
    this.lastLapWasBest = best && this.lapTimes.length > 1;
    if (best) {
      this.bestLap = lapTime;
      this.ghost = Float32Array.from(this.ghostRec);
    }
    this.ghostRec = [];
    this.lapStart = at;
    const done = this.laps.lapsDone;
    const lapText = formatRaceTime(lapTime * 1000);
    if (done >= LAPS) {
      this.finishTime = at;
      this.raceTime = at;
      this.phase = 'finished';
      this.phaseTime = 0;
      this.events.cue('win');
      this.events.say(`Finished! Lap ${done}: ${lapText}. Total time ${formatRaceTime(at * 1000)}.`);
      return;
    }
    this.events.cue(this.lastLapWasBest ? 'collect' : 'milestone');
    this.events.say(`Lap ${done}: ${lapText}${this.lastLapWasBest ? ', best lap' : ''}. ${done + 1 === LAPS ? 'Final lap!' : `Lap ${done + 1} of ${LAPS}.`}`);
  }

  private recordGhost(): void {
    const due = Math.floor(this.lapElapsed * GHOST_RATE);
    while (this.ghostRec.length / 3 <= due && this.ghostRec.length < 3 * GHOST_RATE * 600) {
      this.ghostRec.push(this.car.x, this.car.y, this.car.heading);
    }
  }

  ghostPose(): { x: number; y: number; heading: number } | null {
    const g = this.ghost;
    if (!g || this.phase !== 'racing') return null;
    const i = Math.floor(this.lapElapsed * GHOST_RATE);
    if (i * 3 + 2 >= g.length) return null;
    return { x: g[i * 3]!, y: g[i * 3 + 1]!, heading: g[i * 3 + 2]! };
  }

  private updateSkids(): void {
    if (this.stepCount % 2 !== 0) return;
    const car = this.car;
    const slide = Math.abs(lateralSpeed(car));
    const braking = this.controls.brake > 0 && forwardSpeed(car) > 260;
    if (slide < 95 && !braking) return;
    const c = Math.cos(car.heading);
    const s = Math.sin(car.heading);
    for (const side of [-1, 1]) {
      const x = car.x - c * 13 - s * 8 * side;
      const y = car.y - s * 13 + c * 8 * side;
      this.skidX[this.skidHead] = x;
      this.skidY[this.skidHead] = y;
      this.skidHead = (this.skidHead + 1) % SKID_CAPACITY;
      this.skidCount = Math.min(SKID_CAPACITY, this.skidCount + 1);
    }
  }

  private updateCamera(dt: number): void {
    this.camAngle += wrapAngle(this.car.heading - this.camAngle) * smoothing(5, dt);
    const target = 1.05 - 0.22 * Math.min(1, this.speed / MAX_SPEED);
    this.camZoom += (target - this.camZoom) * smoothing(2, dt);
  }
}
