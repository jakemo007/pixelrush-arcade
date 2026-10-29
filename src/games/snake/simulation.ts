import { ParticlePool } from '../engine/particles';
import type { GameOutcome, GameStats, HudItem, InputSnapshot, Simulation, SoundCue } from '../engine/types';
import type { RunOptions } from '../modifiers';
import { createRng, deriveSeed, type Rng } from '@/lib/utils/random';

export const COLS = 20;
export const ROWS = 20;
export const CELL = 30;
export const SNAKE_WIDTH = COLS * CELL;
export const SNAKE_HEIGHT = ROWS * CELL;

export const START_LENGTH = 3;
export const START_HEAD: Readonly<Cell> = { x: 6, y: 9 };

export const MAX_LEVEL = 8;
export const FOODS_PER_LEVEL = 4;
export const BASE_INTERVAL_MS = 150;
export const INTERVAL_STEP_MS = 12;
export const POINTS_PER_LEVEL = 10;
export const MAX_QUEUED_TURNS = 2;
export const SWIPE_MIN = 36;

const END_DELAY = 1.1;

export type Direction = 'up' | 'down' | 'left' | 'right';
export type SnakeAction = Direction;

export const SNAKE_ACTIONS: readonly SnakeAction[] = ['up', 'down', 'left', 'right'];

export const SNAKE_BINDINGS: Readonly<Record<SnakeAction, readonly string[]>> = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
};

export interface Cell {
  x: number;
  y: number;
}

export const DELTA: Readonly<Record<Direction, Readonly<Cell>>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export const OPPOSITE: Readonly<Record<Direction, Direction>> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export type Phase = 'playing' | 'dying' | 'won';
export type DeathCause = 'wall' | 'self';

export function levelForFood(foodEaten: number): number {
  return Math.min(MAX_LEVEL, 1 + Math.floor(Math.max(0, foodEaten) / FOODS_PER_LEVEL));
}

export function intervalMs(level: number): number {
  const l = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
  return BASE_INTERVAL_MS - INTERVAL_STEP_MS * (l - 1);
}

export function foodPoints(level: number): number {
  return POINTS_PER_LEVEL * Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

export function inBounds(c: Cell): boolean {
  return c.x >= 0 && c.y >= 0 && c.x < COLS && c.y < ROWS;
}

export function queueTurn(queue: Direction[], current: Direction, dir: Direction): boolean {
  if (queue.length >= MAX_QUEUED_TURNS) return false;
  const last = queue[queue.length - 1] ?? current;
  if (dir === last || dir === OPPOSITE[last]) return false;
  queue.push(dir);
  return true;
}

export function placeFood(rng: Rng, snake: readonly Cell[]): Cell | null {
  const taken = new Uint8Array(COLS * ROWS);
  for (const s of snake) if (inBounds(s)) taken[s.y * COLS + s.x] = 1;
  const free = COLS * ROWS - snake.filter(inBounds).length;
  if (free <= 0) return null;
  let target = Math.floor(rng() * free);
  for (let i = 0; i < taken.length; i++) {
    if (taken[i]) continue;
    if (target === 0) return { x: i % COLS, y: Math.floor(i / COLS) };
    target--;
  }
  return null;
}

export function swipeDirection(dx: number, dy: number, min = SWIPE_MIN): Direction | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < min) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
}

export function tapDirection(heading: Direction, head: Cell, x: number, y: number): Direction {
  const cx = (head.x + 0.5) * CELL;
  const cy = (head.y + 0.5) * CELL;
  if (heading === 'left' || heading === 'right') return y < cy ? 'up' : 'down';
  return x < cx ? 'left' : 'right';
}

export function initialSnake(): Cell[] {
  return Array.from({ length: START_LENGTH }, (_, i) => ({ x: START_HEAD.x - i, y: START_HEAD.y }));
}

export class SnakeSimulation implements Simulation<SnakeAction> {
  snake: Cell[] = initialSnake();
  dir: Direction = 'right';
  readonly turns: Direction[] = [];
  food: Cell | null;
  phase: Phase = 'playing';
  deathCause: DeathCause | null = null;
  crashCell: Cell | null = null;

  score = 0;
  foodEaten = 0;
  moves = 0;
  outcome: GameOutcome | null = null;

  time = 0;
  sinceEat = 99;
  sinceLevelUp = 99;
  sinceEnd = 0;
  readonly particles: ParticlePool;

  private readonly rng: Rng;
  private accumulator = 0;
  private endTimer = 0;
  private swipeOrigin: { x: number; y: number } | null = null;
  private swipeUsed = false;
  private cues: SoundCue[] = [];
  private announcements: string[] = [];

  constructor(options: RunOptions) {
    this.rng = createRng(options.seed);
    this.particles = new ParticlePool(80, createRng(deriveSeed(options.seed, 'fx')));
    this.food = placeFood(this.rng, this.snake);
  }

  get level(): number {
    return levelForFood(this.foodEaten);
  }

  get length(): number {
    return this.snake.length;
  }

  get head(): Cell {
    return this.snake[0]!;
  }

  get heading(): Direction {
    return this.turns[this.turns.length - 1] ?? this.dir;
  }

  getStats(): GameStats {
    return { score: this.score, length: this.snake.length, food: this.foodEaten, level: this.level };
  }

  getHud(): readonly HudItem[] {
    return [
      { id: 'length', label: 'Length', value: String(this.snake.length) },
      { id: 'speed', label: 'Speed', value: String(this.level) },
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

  turn(dir: Direction): boolean {
    if (this.phase !== 'playing') return false;
    return queueTurn(this.turns, this.dir, dir);
  }

  update(dt: number, input: InputSnapshot<SnakeAction>): void {
    if (this.outcome) return;
    this.time += dt;
    this.sinceEat += dt;
    this.sinceLevelUp += dt;
    this.particles.update(dt);

    if (this.phase !== 'playing') {
      this.sinceEnd += dt;
      this.endTimer -= dt;
      if (this.endTimer <= 0) {
        this.outcome = this.phase === 'won' ? 'won' : 'lost';
        if (this.outcome === 'lost') this.cues.push('gameOver');
      }
      return;
    }

    this.readInput(input);

    this.accumulator += dt;
    while (this.phase === 'playing' && this.accumulator + 1e-9 >= intervalMs(this.level) / 1000) {
      this.accumulator -= intervalMs(this.level) / 1000;
      this.step();
    }
  }

  private readInput(input: InputSnapshot<SnakeAction>): void {
    for (const action of SNAKE_ACTIONS) {
      if (input.actions[action].pressed) this.turn(action);
    }

    const p = input.pointer;
    if (p.pressed) {
      this.swipeOrigin = { x: p.x, y: p.y };
      this.swipeUsed = false;
    }
    const origin = this.swipeOrigin;
    if (!origin) return;
    if (p.down || p.released) {
      const dir = swipeDirection(p.x - origin.x, p.y - origin.y);
      if (dir) {
        this.turn(dir);
        this.swipeOrigin = { x: p.x, y: p.y };
        this.swipeUsed = true;
      }
    }
    if (p.released) {
      if (!this.swipeUsed) this.turn(tapDirection(this.heading, this.head, origin.x, origin.y));
      this.swipeOrigin = null;
      this.swipeUsed = false;
    }
  }

  step(): void {
    if (this.phase !== 'playing') return;
    const next = this.turns.shift();
    if (next) this.dir = next;
    const d = DELTA[this.dir];
    const head = this.head;
    const target: Cell = { x: head.x + d.x, y: head.y + d.y };

    if (!inBounds(target)) {
      this.die('wall', target);
      return;
    }
    const eating = this.food !== null && sameCell(target, this.food);
    const checkUntil = eating ? this.snake.length : this.snake.length - 1;
    for (let i = 0; i < checkUntil; i++) {
      if (sameCell(this.snake[i]!, target)) {
        this.die('self', target);
        return;
      }
    }

    this.snake.unshift(target);
    this.moves++;
    if (!eating) {
      this.snake.pop();
      return;
    }

    const levelBefore = this.level;
    this.score += foodPoints(levelBefore);
    this.foodEaten++;
    this.sinceEat = 0;
    this.cues.push('collect');
    this.particles.burst({
      x: (target.x + 0.5) * CELL,
      y: (target.y + 0.5) * CELL,
      count: 14,
      color: '#ff4fd8',
      speed: 160,
      life: 0.45,
      size: 4,
    });
    if (this.level > levelBefore) {
      this.sinceLevelUp = 0;
      this.cues.push('levelUp');
      this.announcements.push(`Speed ${this.level}`);
    }

    if (this.snake.length >= COLS * ROWS) {
      this.food = null;
      this.win();
      return;
    }
    this.food = placeFood(this.rng, this.snake);
    if (!this.food) this.win();
  }

  private die(cause: DeathCause, at: Cell): void {
    this.phase = 'dying';
    this.deathCause = cause;
    this.crashCell = at;
    this.turns.length = 0;
    this.endTimer = END_DELAY;
    this.sinceEnd = 0;
    this.cues.push('hit');
    this.announcements.push(cause === 'wall' ? 'You hit the wall.' : 'You ran into your own tail.');
  }

  private win(): void {
    this.phase = 'won';
    this.turns.length = 0;
    this.endTimer = END_DELAY + 0.4;
    this.sinceEnd = 0;
    this.cues.push('win');
    this.announcements.push('The board is full. You win!');
  }
}
