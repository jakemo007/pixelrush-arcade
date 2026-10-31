import { ParticlePool } from '../engine/particles';
import type { GameOutcome, GameStats, HudItem, InputSnapshot, Simulation, SoundCue } from '../engine/types';
import type { RunOptions } from '../modifiers';
import { SimEvents } from '../arcade-kit/events';
import { clamp, holdRamp } from '../arcade-kit/math';
import { tokenStyle } from '../arcade-kit/tokens';
import { createRng, deriveSeed, type Rng } from '@/lib/utils/random';
import { BS_HEIGHT, BS_WIDTH, BubbleGrid, COLS, DANGER_Y, EMPTY, MAX_ROWS, RADIUS, type Cell } from './grid';
import { advanceShot, SHOT_SPEED, traceAim, type FlyingBubble } from './shot';

export { BS_HEIGHT, BS_WIDTH };

export const SHOOTER_X = BS_WIDTH / 2;
export const SHOOTER_Y = 664;
export const AIM_LIMIT_Y = SHOOTER_Y - 18;
export const SWAP_X = 104;
export const SWAP_Y = 680;
export const SWAP_R = 38;
export const MIN_AIM = 0.13;
export const POP_POINTS = 10;
export const DROP_POINTS = 25;
export const CLEAR_BONUS = 250;
const TURN_SPEED = 1.5;
const CLEAR_SECONDS = 2.2;
const END_SECONDS = 1.5;
const PUSH_SECONDS = 0.28;
const MAX_EFFECTS = 160;

export type BubbleAction = 'left' | 'right' | 'fire' | 'swap';
export const BUBBLE_BINDINGS: Readonly<Record<BubbleAction, readonly string[]>> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  fire: ['Space', 'ArrowUp', 'KeyW'],
  swap: ['ArrowDown', 'KeyS', 'KeyX'],
};

export interface LevelConfig {
  colors: number;
  rows: number;
  pushEvery: number;
}

export function levelConfig(level: number): LevelConfig {
  const colors = level <= 2 ? 4 : level <= 4 ? 5 : 6;
  const rows = Math.min(10, 5 + level);
  const pushEvery = Math.max(4, 8 - level);
  return { colors, rows, pushEvery };
}

export function generateRows(rng: Rng, rows: number, colors: number, topShift: 0 | 1): BubbleGrid {
  const grid = new BubbleGrid();
  grid.topShift = topShift;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < grid.rowLength(r); c++) {
      let color = Math.floor(rng() * colors);
      const roll = rng();
      if (roll < 0.3 && c > 0) color = grid.get(r, c - 1);
      else if (roll < 0.5 && r > 0) {
        const up = grid.neighbors(r, c).filter((n) => n.row === r - 1);
        const pickUp = up[Math.floor(rng() * up.length)];
        if (pickUp) color = grid.get(pickUp.row, pickUp.col);
      }
      grid.set(r, c, color === EMPTY ? 0 : color);
    }
  }
  return grid;
}

export type BubblePhase = 'aim' | 'flying' | 'settle' | 'cleared' | 'ending';

export interface BubbleEffect {
  kind: 'pop' | 'drop';
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  t: number;
}

export class BubbleShooterSimulation implements Simulation<BubbleAction> {
  readonly particles: ParticlePool;
  grid: BubbleGrid;
  level = 1;
  config: LevelConfig;
  phase: BubblePhase = 'aim';
  phaseTime = 0;
  time = 0;
  score = 0;
  popped = 0;
  dropped = 0;
  shots = 0;
  misses = 0;
  loaded: number;
  next: number;
  angle = -Math.PI / 2;
  flying: FlyingBubble | null = null;
  effects: BubbleEffect[] = [];
  pushAnim = 0;
  lastGain = 0;
  lastGainX = 0;
  lastGainY = 0;
  lastGainTime = -10;
  levelStart = 0;
  readonly previewX = new Float32Array(90);
  readonly previewY = new Float32Array(90);
  previewCount = 0;
  outcome: GameOutcome | null = null;

  private readonly rng: Rng;
  private readonly events = new SimEvents();
  private pointerAiming = false;
  private previewDirty = true;
  private holdLeft = 0;
  private holdRight = 0;
  private warned = false;

  constructor(options: RunOptions) {
    this.rng = createRng(options.seed);
    this.particles = new ParticlePool(200, createRng(deriveSeed(options.seed, 'fx')));
    this.config = levelConfig(1);
    this.grid = generateRows(this.rng, this.config.rows, this.config.colors, 0);
    this.loaded = this.rollColor();
    this.next = this.rollColor();
    this.events.say(`Level 1. ${this.config.colors} colours. Loaded: ${tokenStyle(this.loaded).name}.`);
  }

  getStats(): GameStats {
    return { score: this.score, popped: this.popped, dropped: this.dropped, level: this.level, shots: this.shots };
  }

  getHud(): readonly HudItem[] {
    return [
      { id: 'level', label: 'Level', value: String(this.level) },
      { id: 'row', label: 'New row', value: `in ${this.shotsUntilPush}` },
    ];
  }

  drainCues(): SoundCue[] {
    return this.events.drainCues();
  }

  drainAnnouncements(): string[] {
    return this.events.drainAnnouncements();
  }

  get shotsUntilPush(): number {
    return Math.max(0, this.config.pushEvery - this.misses);
  }

  get inDanger(): boolean {
    return this.grid.lowestRow() >= MAX_ROWS - 2;
  }

  update(dt: number, input: InputSnapshot<BubbleAction>): void {
    if (this.outcome) return;
    this.time += dt;
    this.phaseTime += dt;
    this.particles.update(dt);
    this.updateEffects(dt);
    this.pushAnim = Math.max(0, this.pushAnim - dt / PUSH_SECONDS);

    if (this.phase === 'ending') {
      if (this.phaseTime >= END_SECONDS) this.outcome = 'lost';
      return;
    }
    if (this.phase === 'cleared') {
      if (this.phaseTime >= CLEAR_SECONDS) this.startLevel(this.level + 1);
      return;
    }

    this.handleAim(dt, input);

    if (this.phase === 'settle') {
      if (this.phaseTime >= PUSH_SECONDS) this.setPhase('aim');
    } else if (this.phase === 'flying' && this.flying) {
      const result = advanceShot(this.grid, this.flying, dt);
      if (result.banks > 0) this.events.cue('bounce');
      if (result.landed) this.land(this.flying);
      else if (this.flying.y < -RADIUS * 4) this.land(this.flying);
    }

    if (this.phase === 'aim' && this.previewDirty) {
      this.previewCount = traceAim(this.grid, SHOOTER_X, SHOOTER_Y, this.angle, 1, this.previewX, this.previewY);
      this.previewDirty = false;
    }
  }

  private setPhase(phase: BubblePhase): void {
    this.phase = phase;
    this.phaseTime = 0;
    this.previewDirty = true;
  }

  private setAngle(angle: number): void {
    const a = clamp(angle, -Math.PI + MIN_AIM, -MIN_AIM);
    if (a !== this.angle) {
      this.angle = a;
      this.previewDirty = true;
    }
  }

  private handleAim(dt: number, input: InputSnapshot<BubbleAction>): void {
    const { left, right, fire, swap } = input.actions;
    this.holdLeft = left.held ? this.holdLeft + dt : 0;
    this.holdRight = right.held ? this.holdRight + dt : 0;
    if (left.held !== right.held) {
      const ramp = holdRamp(left.held ? this.holdLeft : this.holdRight);
      this.setAngle(this.angle + (right.held ? 1 : -1) * TURN_SPEED * ramp * dt);
    }

    const p = input.pointer;
    const onSwap = Math.hypot(p.x - SWAP_X, p.y - SWAP_Y) <= SWAP_R;
    const aimAtPointer = () => this.setAngle(Math.atan2(p.y - SHOOTER_Y, p.x - SHOOTER_X));
    if (p.pressed) {
      if (onSwap) {
        this.swap();
        this.pointerAiming = false;
      } else if (p.y < AIM_LIMIT_Y) {
        this.pointerAiming = true;
        aimAtPointer();
      }
    }
    if (p.inside && (p.moved || p.down) && p.y < AIM_LIMIT_Y && !(p.down && !this.pointerAiming)) {
      aimAtPointer();
    }
    if (p.released && this.pointerAiming) {
      this.pointerAiming = false;
      if (p.y < AIM_LIMIT_Y) {
        aimAtPointer();
        this.fire();
      }
    }

    if (fire.pressed) this.fire();
    if (swap.pressed) this.swap();
  }

  private fire(): void {
    if (this.phase !== 'aim') return;
    this.flying = {
      x: SHOOTER_X,
      y: SHOOTER_Y,
      vx: Math.cos(this.angle) * SHOT_SPEED,
      vy: Math.sin(this.angle) * SHOT_SPEED,
      color: this.loaded,
    };
    this.shots++;
    this.setPhase('flying');
    this.events.cue('shoot');
  }

  private swap(): void {
    if (this.phase !== 'aim' && this.phase !== 'settle') return;
    if (this.loaded === this.next) return;
    const t = this.loaded;
    this.loaded = this.next;
    this.next = t;
    this.events.cue('select');
    this.events.say(`Swapped. Loaded: ${tokenStyle(this.loaded).name}.`);
  }

  private rollColor(): number {
    const colors = this.grid.colors();
    if (colors.length === 0) return Math.floor(this.rng() * this.config.colors);
    return colors[Math.floor(this.rng() * colors.length)]!;
  }

  private land(b: FlyingBubble): void {
    this.flying = null;
    const cell = this.grid.snap(b.x, Math.max(b.y, 0));
    if (!cell) {
      this.reload();
      return;
    }
    this.grid.set(cell.row, cell.col, b.color);
    const cx = this.grid.cellX(cell.row, cell.col);
    const cy = BubbleGrid.cellY(cell.row);

    const cluster = this.grid.cluster(cell.row, cell.col);
    let gained = 0;
    if (cluster.length >= 3) {
      this.removeCells(cluster, 'pop');
      gained += cluster.length * POP_POINTS;
      this.popped += cluster.length;
      this.misses = 0;
      this.events.cue('pop');
      const floating = this.grid.floating();
      if (floating.length > 0) {
        this.removeCells(floating, 'drop');
        gained += floating.length * DROP_POINTS;
        this.dropped += floating.length;
        this.events.cue('collect');
        this.events.say(`Popped ${cluster.length}, dropped ${floating.length}.`);
      } else {
        this.events.say(`Popped ${cluster.length}.`);
      }
    } else {
      this.misses++;
      this.events.cue('land');
    }
    if (gained > 0) {
      this.score += gained;
      this.lastGain = gained;
      this.lastGainX = cx;
      this.lastGainY = cy;
      this.lastGainTime = this.time;
    }

    if (this.grid.count() === 0) {
      const bonus = CLEAR_BONUS * this.level;
      this.score += bonus;
      this.events.cue('levelUp');
      this.events.say(`Level ${this.level} cleared! Bonus ${bonus} points.`);
      this.setPhase('cleared');
      return;
    }

    let pushed = false;
    if (this.misses >= this.config.pushEvery) {
      this.misses = 0;
      this.pushRow();
      pushed = true;
    }

    if (this.grid.crossesDanger()) {
      this.events.cue('gameOver');
      this.events.say('The bubbles crossed the line. Game over.');
      this.setPhase('ending');
      return;
    }

    if (this.inDanger) {
      if (!this.warned) this.events.say('Warning: the bubbles are close to the line.');
      this.warned = true;
    } else {
      this.warned = false;
    }

    this.reload();
    if (pushed) this.setPhase('settle');
  }

  private reload(): void {
    const colors = this.grid.colors();
    this.loaded = colors.includes(this.next) ? this.next : this.rollColor();
    this.next = this.rollColor();
    this.setPhase('aim');
  }

  private pushRow(): void {
    const colors = this.grid.colors();
    const palette = colors.length > 0 ? colors : [0];
    const row: number[] = [];
    for (let c = 0; c < COLS; c++) {
      const prev = row[c - 1];
      const color = prev !== undefined && this.rng() < 0.35 ? prev : palette[Math.floor(this.rng() * palette.length)]!;
      row.push(color);
    }
    this.grid.pushRow(row);
    this.pushAnim = 1;
    this.events.cue('place');
    this.events.say('A new row pushed down.');
  }

  private removeCells(cells: readonly Cell[], kind: 'pop' | 'drop'): void {
    for (const cell of cells) {
      const color = this.grid.get(cell.row, cell.col);
      const x = this.grid.cellX(cell.row, cell.col);
      const y = BubbleGrid.cellY(cell.row);
      if (this.effects.length < MAX_EFFECTS) {
        this.effects.push({
          kind,
          x,
          y,
          vx: kind === 'drop' ? (this.rng() - 0.5) * 120 : 0,
          vy: kind === 'drop' ? -60 - this.rng() * 80 : 0,
          color,
          t: 0,
        });
      }
      if (kind === 'pop') {
        this.particles.burst({ x, y, count: 6, color: tokenStyle(color).color, speed: 200, life: 0.45, size: 4 });
      }
    }
    this.grid.remove(cells);
    this.previewDirty = true;
  }

  private updateEffects(dt: number): void {
    if (this.effects.length === 0) return;
    let w = 0;
    for (const e of this.effects) {
      e.t += dt;
      if (e.kind === 'drop') {
        e.vy += 1800 * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.y > BS_HEIGHT + RADIUS * 2) continue;
      } else if (e.t > 0.22) {
        continue;
      }
      this.effects[w++] = e;
    }
    this.effects.length = w;
  }

  private startLevel(level: number): void {
    this.level = level;
    this.config = levelConfig(level);
    this.grid = generateRows(this.rng, this.config.rows, this.config.colors, 0);
    this.misses = 0;
    this.warned = false;
    this.flying = null;
    this.loaded = this.rollColor();
    this.next = this.rollColor();
    this.levelStart = this.time;
    this.events.cue('launch');
    this.events.say(`Level ${level}. ${this.config.colors} colours. A new row every ${this.config.pushEvery} shots without a pop.`);
    this.setPhase('aim');
  }
}

export { DANGER_Y };
