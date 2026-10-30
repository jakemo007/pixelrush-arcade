import { ParticlePool } from '../engine/particles';
import type { GameOutcome, GameStats, HudItem, InputSnapshot, Simulation, SoundCue } from '../engine/types';
import type { RunOptions } from '../modifiers';
import { createRng, deriveSeed, type Rng } from '@/lib/utils/random';
import { KICKS, pieceCells, pieceIndex, pieceSize, shuffledBag, type Cell, type PieceType } from './pieces';

export const COLS = 10;
export const ROWS = 20;
export const CELL = 28;
export const BOARD_X = 20;
export const BOARD_Y = 20;
export const PANEL_X = 330;
export const STACKFALL_WIDTH = 480;
export const STACKFALL_HEIGHT = 600;
export const HOLD_BOX = { x: PANEL_X, y: BOARD_Y, w: 130, h: 96 } as const;

export const MAX_LEVEL = 15;
export const ROWS_PER_LEVEL = 10;
export const LOCK_DELAY = 0.5;
export const MAX_LOCK_RESETS = 15;
export const SOFT_DROP_INTERVAL = 0.04;
export const DAS = 0.17;
export const ARR = 0.045;
export const CLEAR_DELAY = 0.3;
export const NEXT_COUNT = 3;
export const TAP_MAX_SECONDS = 0.4;
export const TAP_MAX_TRAVEL = 12;
export const FLICK_MIN_DROP = 90;
export const FLICK_MAX_SECONDS = 0.3;
export const TOUCH_SOFT_DROP_DISTANCE = 50;

const END_DELAY = 1.1;

export type StackfallAction = 'left' | 'right' | 'down' | 'rotate' | 'rotateBack' | 'drop' | 'hold';

export const STACKFALL_ACTIONS: readonly StackfallAction[] = ['left', 'right', 'down', 'rotate', 'rotateBack', 'drop', 'hold'];

export const STACKFALL_BINDINGS: Readonly<Record<StackfallAction, readonly string[]>> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  down: ['ArrowDown', 'KeyS'],
  rotate: ['ArrowUp', 'KeyW', 'KeyX'],
  rotateBack: ['KeyZ'],
  drop: ['Space'],
  hold: ['KeyC', 'ShiftLeft', 'ShiftRight'],
};

export interface ActivePiece {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
}

export type Phase = 'playing' | 'clearing' | 'dying';

export type Board = number[];

export function emptyBoard(): Board {
  return new Array<number>(COLS * ROWS).fill(0);
}

export function absoluteCells(piece: ActivePiece): Cell[] {
  return pieceCells(piece.type, piece.rotation).map((c) => ({ x: piece.x + c.x, y: piece.y + c.y }));
}

export function collides(board: Board, cells: readonly Cell[]): boolean {
  for (const c of cells) {
    if (c.x < 0 || c.x >= COLS || c.y >= ROWS) return true;
    if (c.y >= 0 && board[c.y * COLS + c.x] !== 0) return true;
  }
  return false;
}

export function fullRows(board: Board): number[] {
  const rows: number[] = [];
  for (let y = 0; y < ROWS; y++) {
    let full = true;
    for (let x = 0; x < COLS; x++) {
      if (board[y * COLS + x] === 0) {
        full = false;
        break;
      }
    }
    if (full) rows.push(y);
  }
  return rows;
}

export function removeRows(board: Board, rows: readonly number[]): Board {
  const drop = new Set(rows);
  const kept: number[] = [];
  for (let y = 0; y < ROWS; y++) {
    if (drop.has(y)) continue;
    for (let x = 0; x < COLS; x++) kept.push(board[y * COLS + x]!);
  }
  const padding = new Array<number>(rows.length * COLS).fill(0);
  return [...padding, ...kept];
}

export function levelForRows(rows: number): number {
  return Math.min(MAX_LEVEL, 1 + Math.floor(Math.max(0, rows) / ROWS_PER_LEVEL));
}

export function gravityInterval(level: number): number {
  const l = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
  return Math.max(0.02, Math.pow(0.8 - (l - 1) * 0.007, l - 1));
}

const ROW_POINTS = [0, 100, 300, 500, 800] as const;

export function clearPoints(rowsCleared: number, level: number): number {
  const n = Math.min(4, Math.max(0, Math.floor(rowsCleared)));
  return ROW_POINTS[n]! * Math.max(1, Math.floor(level));
}

export function spawnPiece(type: PieceType): ActivePiece {
  return { type, rotation: 0, x: Math.floor((COLS - pieceSize(type)) / 2), y: 0 };
}

export class StackfallSimulation implements Simulation<StackfallAction> {
  board: Board = emptyBoard();
  active: ActivePiece | null = null;
  hold: PieceType | null = null;
  holdUsed = false;
  readonly queue: PieceType[] = [];
  phase: Phase = 'playing';
  clearingRows: number[] = [];

  score = 0;
  rows = 0;
  pieces = 0;
  outcome: GameOutcome | null = null;

  time = 0;
  sinceLock = 99;
  sinceLevelUp = 99;
  sinceEnd = 0;
  readonly particles: ParticlePool;

  private readonly rng: Rng;
  private dropTimer = 0;
  private lockTimer = 0;
  private lockResets = 0;
  private lowestY = 0;
  private moveDir: -1 | 0 | 1 = 0;
  private moveTimer = 0;
  private clearTimer = 0;
  private endTimer = 0;
  private touch: { x: number; y: number; t: number; lastX: number; acc: number; travel: number; onHold: boolean } | null = null;
  private touchSoft = false;
  private cues: SoundCue[] = [];
  private announcements: string[] = [];

  constructor(options: RunOptions) {
    this.rng = createRng(options.seed);
    this.particles = new ParticlePool(120, createRng(deriveSeed(options.seed, 'fx')));
    this.refillQueue();
    this.spawnNext();
  }

  get level(): number {
    return levelForRows(this.rows);
  }

  getStats(): GameStats {
    return { score: this.score, rows: this.rows, level: this.level, pieces: this.pieces };
  }

  getHud(): readonly HudItem[] {
    return [
      { id: 'level', label: 'Level', value: String(this.level) },
      { id: 'rows', label: 'Rows', value: String(this.rows) },
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

  peekNext(count = NEXT_COUNT): PieceType[] {
    return this.queue.slice(0, count);
  }

  ghostY(): number {
    const piece = this.active;
    if (!piece) return 0;
    let y = piece.y;
    while (!collides(this.board, absoluteCells({ ...piece, y: y + 1 }))) y++;
    return y;
  }

  update(dt: number, input: InputSnapshot<StackfallAction>): void {
    if (this.outcome) return;
    this.time += dt;
    this.sinceLock += dt;
    this.sinceLevelUp += dt;
    this.particles.update(dt);

    if (this.phase === 'dying') {
      this.sinceEnd += dt;
      this.endTimer -= dt;
      if (this.endTimer <= 0) {
        this.outcome = 'lost';
        this.cues.push('gameOver');
      }
      return;
    }
    if (this.phase === 'clearing') {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) this.finishClear();
      return;
    }

    this.readKeys(input, dt);
    this.readPointer(input);
    if (this.phase === 'playing') this.applyGravity(dt, input.actions.down.held || this.touchSoft);
  }

  private readKeys(input: InputSnapshot<StackfallAction>, dt: number): void {
    const a = input.actions;
    if (a.hold.pressed) this.holdPiece();
    if (a.rotate.pressed) this.rotate(1);
    if (a.rotateBack.pressed) this.rotate(-1);
    if (a.drop.pressed) this.hardDrop();
    if (this.phase !== 'playing') return;

    if (a.left.pressed) this.startRepeat(-1);
    if (a.right.pressed) this.startRepeat(1);
    if (this.moveDir === -1 && !a.left.held) this.moveDir = a.right.held ? 1 : 0;
    if (this.moveDir === 1 && !a.right.held) this.moveDir = a.left.held ? -1 : 0;
    if (this.moveDir === 0) return;

    this.moveTimer += dt;
    let guard = 0;
    while (this.moveTimer >= DAS && guard++ < 10) {
      this.moveTimer -= ARR;
      if (!this.move(this.moveDir)) break;
    }
  }

  private startRepeat(dir: -1 | 1): void {
    this.moveDir = dir;
    this.moveTimer = 0;
    this.move(dir);
  }

  private readPointer(input: InputSnapshot<StackfallAction>): void {
    const p = input.pointer;
    if (p.pressed) {
      const onHold =
        p.x >= HOLD_BOX.x && p.x <= HOLD_BOX.x + HOLD_BOX.w && p.y >= HOLD_BOX.y && p.y <= HOLD_BOX.y + HOLD_BOX.h;
      this.touch = { x: p.x, y: p.y, t: this.time, lastX: p.x, acc: 0, travel: 0, onHold };
    }
    const t = this.touch;
    if (!t) {
      this.touchSoft = false;
      return;
    }

    if (p.down || p.released) {
      const dx = p.x - t.lastX;
      t.lastX = p.x;
      t.acc += dx;
      t.travel = Math.max(t.travel, Math.hypot(p.x - t.x, p.y - t.y));
      if (!t.onHold) {
        while (t.acc >= CELL) {
          this.move(1);
          t.acc -= CELL;
        }
        while (t.acc <= -CELL) {
          this.move(-1);
          t.acc += CELL;
        }
      }
    }
    this.touchSoft = !t.onHold && p.down && p.y - t.y > TOUCH_SOFT_DROP_DISTANCE;

    if (p.released) {
      const elapsed = this.time - t.t;
      const dy = p.y - t.y;
      const dx = p.x - t.x;
      if (t.travel <= TAP_MAX_TRAVEL && elapsed <= TAP_MAX_SECONDS) {
        if (t.onHold) this.holdPiece();
        else this.rotate(1);
      } else if (!t.onHold && dy >= FLICK_MIN_DROP && elapsed <= FLICK_MAX_SECONDS && Math.abs(dy) > Math.abs(dx)) {
        this.hardDrop();
      }
      this.touch = null;
      this.touchSoft = false;
    }
  }

  private isGrounded(): boolean {
    const piece = this.active;
    return !piece || collides(this.board, absoluteCells({ ...piece, y: piece.y + 1 }));
  }

  private registerAdjust(): void {
    if (this.isGrounded() && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  move(dx: number): boolean {
    const piece = this.active;
    if (!piece || this.phase !== 'playing') return false;
    const moved = { ...piece, x: piece.x + dx };
    if (collides(this.board, absoluteCells(moved))) return false;
    this.active = moved;
    this.registerAdjust();
    return true;
  }

  rotate(direction: 1 | -1): boolean {
    const piece = this.active;
    if (!piece || this.phase !== 'playing' || piece.type === 'O') return false;
    const rotation = (piece.rotation + direction + 4) % 4;
    for (const kick of KICKS) {
      const candidate = { ...piece, rotation, x: piece.x + kick.x, y: piece.y + kick.y };
      if (collides(this.board, absoluteCells(candidate))) continue;
      this.active = candidate;
      this.cues.push('tick');
      this.registerAdjust();
      return true;
    }
    return false;
  }

  holdPiece(): boolean {
    const piece = this.active;
    if (!piece || this.phase !== 'playing') return false;
    if (this.holdUsed) {
      this.cues.push('invalid');
      return false;
    }
    const swapped = this.hold;
    this.hold = piece.type;
    this.cues.push('flip');
    if (swapped) {
      this.placeActive(swapped);
    } else {
      this.spawnNext();
    }
    this.holdUsed = true;
    return true;
  }

  hardDrop(): void {
    const piece = this.active;
    if (!piece || this.phase !== 'playing') return;
    const target = this.ghostY();
    this.score += (target - piece.y) * 2;
    this.active = { ...piece, y: target };
    this.lockActive();
  }

  private applyGravity(dt: number, soft: boolean): void {
    const piece = this.active;
    if (!piece) return;
    if (this.isGrounded()) {
      this.lockTimer += dt;
      if (this.lockTimer >= LOCK_DELAY) this.lockActive();
      return;
    }
    const interval = soft ? Math.min(gravityInterval(this.level), SOFT_DROP_INTERVAL) : gravityInterval(this.level);
    this.dropTimer += dt;
    let guard = 0;
    while (this.dropTimer >= interval && guard++ < 40) {
      const current = this.active;
      if (!current || this.isGrounded()) break;
      this.dropTimer -= interval;
      this.active = { ...current, y: current.y + 1 };
      if (soft) this.score += 1;
      if (this.active.y > this.lowestY) {
        this.lowestY = this.active.y;
        this.lockResets = 0;
        this.lockTimer = 0;
      }
    }
    if (this.isGrounded()) this.dropTimer = 0;
  }

  private lockActive(): void {
    const piece = this.active;
    if (!piece) return;
    const index = pieceIndex(piece.type);
    for (const c of absoluteCells(piece)) {
      if (c.y >= 0) this.board[c.y * COLS + c.x] = index;
    }
    this.active = null;
    this.pieces++;
    this.sinceLock = 0;
    this.cues.push('place');

    const cleared = fullRows(this.board);
    if (cleared.length === 0) {
      this.spawnNext();
      return;
    }

    const levelBefore = this.level;
    this.score += clearPoints(cleared.length, levelBefore);
    this.rows += cleared.length;
    this.clearingRows = cleared;
    this.phase = 'clearing';
    this.clearTimer = CLEAR_DELAY;
    this.cues.push(cleared.length >= 4 ? 'explode' : 'match');
    this.announcements.push(cleared.length === 1 ? '1 row cleared.' : `${cleared.length} rows cleared.`);
    for (const y of cleared) {
      for (const fraction of [0.2, 0.5, 0.8]) {
        this.particles.burst({
          x: BOARD_X + COLS * CELL * fraction,
          y: BOARD_Y + (y + 0.5) * CELL,
          count: 4,
          color: '#38e8ff',
          speed: 190,
          life: 0.5,
          size: 3,
        });
      }
    }
    if (this.level > levelBefore) {
      this.sinceLevelUp = 0;
      this.cues.push('levelUp');
      this.announcements.push(`Level ${this.level}`);
    }
  }

  private finishClear(): void {
    this.board = removeRows(this.board, this.clearingRows);
    this.clearingRows = [];
    this.phase = 'playing';
    this.spawnNext();
  }

  private refillQueue(): void {
    while (this.queue.length < 7 + NEXT_COUNT) this.queue.push(...shuffledBag(this.rng));
  }

  private spawnNext(): void {
    const type = this.queue.shift()!;
    this.refillQueue();
    this.placeActive(type);
    this.holdUsed = false;
  }

  private placeActive(type: PieceType): void {
    const piece = spawnPiece(type);
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.lowestY = piece.y;
    this.moveDir = 0;
    this.moveTimer = 0;
    if (collides(this.board, absoluteCells(piece))) {
      this.active = piece;
      this.die();
      return;
    }
    this.active = piece;
  }

  private die(): void {
    this.phase = 'dying';
    this.endTimer = END_DELAY;
    this.sinceEnd = 0;
    this.moveDir = 0;
    this.touch = null;
    this.touchSoft = false;
    this.cues.push('hit');
    this.announcements.push('The stack reached the top. Game over.');
  }
}
