import { ParticlePool } from '../engine/particles';
import type { GameOutcome, GameStats, HudItem, InputSnapshot, Simulation, SoundCue } from '../engine/types';
import type { RunOptions } from '../modifiers';
import { SimEvents } from '../arcade-kit/events';
import { tokenStyle } from '../arcade-kit/tokens';
import { formatPoints } from '@/lib/format';
import { createRng, deriveSeed, type Rng } from '@/lib/utils/random';
import {
  applyGravity,
  CELLS,
  clearCells,
  clearPoints,
  colOf,
  findMatches,
  findValidMove,
  generateBoard,
  inMatch,
  isAdjacent,
  MAX_CASCADES,
  neighbor,
  refill,
  reshuffle,
  rowOf,
  SIZE,
  swap,
  type Board,
  type Move,
} from './board';

export const M3_WIDTH = 540;
export const M3_HEIGHT = 720;
export const CELL = 64;
export const BOARD_X = (M3_WIDTH - CELL * SIZE) / 2;
export const BOARD_Y = 150;
export const MOVES_PER_LEVEL = 25;
export const MOVE_BONUS = 30;
export const SWAP_TIME = 0.16;
export const CLEAR_TIME = 0.24;
const FALL_ROWS_PER_SECOND = 16;
const LEVEL_UP_TIME = 2.4;
const SHUFFLE_TIME = 1.3;
const END_TIME = 1.6;
const HINT_DELAY = 7;
const DRAG_THRESHOLD = CELL * 0.38;
const REPEAT_DELAY = 0.38;
const REPEAT_EVERY = 0.11;

export function levelTarget(level: number): number {
  return 1000 + 250 * (level - 1);
}

export type Match3Action = 'up' | 'down' | 'left' | 'right' | 'select';
export const MATCH3_BINDINGS: Readonly<Record<Match3Action, readonly string[]>> = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  select: ['Space', 'Enter', 'NumpadEnter'],
};

const DIRS: Record<'up' | 'down' | 'left' | 'right', [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

export type Match3Phase = 'idle' | 'swap' | 'swapBack' | 'clear' | 'fall' | 'shuffle' | 'levelUp' | 'ending';

export function cellAt(x: number, y: number): number {
  const c = Math.floor((x - BOARD_X) / CELL);
  const r = Math.floor((y - BOARD_Y) / CELL);
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE ? r * SIZE + c : -1;
}

function describe(board: Board, i: number): string {
  return `Row ${rowOf(i) + 1}, column ${colOf(i) + 1}: ${tokenStyle(board[i] ?? 0).name}`;
}

export class Match3Simulation implements Simulation<Match3Action> {
  readonly particles: ParticlePool;
  board: Board;
  level = 1;
  target = levelTarget(1);
  movesLeft = MOVES_PER_LEVEL;
  score = 0;
  levelScore = 0;
  phase: Match3Phase = 'idle';
  phaseTime = 0;
  time = 0;
  chain = 0;
  bestChain = 0;
  gemsCleared = 0;
  movesMade = 0;
  swapA = -1;
  swapB = -1;
  clearing: number[] = [];
  readonly fallRows = new Float32Array(CELLS);
  fallDuration = 0;
  selected = -1;
  cursor = 3 * SIZE + 3;
  cursorVisible = false;
  hint: Move | null = null;
  moveGain = 0;
  lastGainTime = -10;
  levelBonus = 0;
  outcome: GameOutcome | null = null;

  private readonly rng: Rng;
  private readonly events = new SimEvents();
  private idleTime = 0;
  private drag: { cell: number; x: number; y: number; deselect: boolean } | null = null;
  private readonly holds: Record<'up' | 'down' | 'left' | 'right', number> = { up: 0, down: 0, left: 0, right: 0 };

  constructor(options: RunOptions) {
    this.rng = createRng(options.seed);
    this.particles = new ParticlePool(220, createRng(deriveSeed(options.seed, 'fx')));
    this.board = generateBoard(this.rng);
    this.events.say(`Level 1. Score ${formatPoints(this.target)} points in ${MOVES_PER_LEVEL} moves.`);
  }

  getStats(): GameStats {
    return {
      score: this.score,
      level: this.level,
      gemsCleared: this.gemsCleared,
      bestCascade: this.bestChain,
      moves: this.movesMade,
    };
  }

  getHud(): readonly HudItem[] {
    return [
      { id: 'level', label: 'Level', value: String(this.level) },
      { id: 'moves', label: 'Moves', value: String(this.movesLeft) },
    ];
  }

  drainCues(): SoundCue[] {
    return this.events.drainCues();
  }

  drainAnnouncements(): string[] {
    return this.events.drainAnnouncements();
  }

  get progress(): number {
    switch (this.phase) {
      case 'swap':
      case 'swapBack':
        return Math.min(1, this.phaseTime / SWAP_TIME);
      case 'clear':
        return Math.min(1, this.phaseTime / CLEAR_TIME);
      case 'fall':
        return this.fallDuration > 0 ? Math.min(1, this.phaseTime / this.fallDuration) : 1;
      default:
        return 1;
    }
  }

  update(dt: number, input: InputSnapshot<Match3Action>): void {
    if (this.outcome) return;
    this.time += dt;
    this.phaseTime += dt;
    this.particles.update(dt);

    if (this.phase === 'ending') {
      if (this.phaseTime >= END_TIME) this.outcome = 'lost';
      return;
    }

    this.handleKeyboard(dt, input);
    this.handlePointer(input);

    switch (this.phase) {
      case 'idle':
        this.idleTime += dt;
        if (this.idleTime >= HINT_DELAY && !this.hint) this.hint = findValidMove(this.board);
        break;
      case 'swap':
        if (this.phaseTime >= SWAP_TIME) this.finishSwap();
        break;
      case 'swapBack':
        if (this.phaseTime >= SWAP_TIME) this.setPhase('idle');
        break;
      case 'clear':
        if (this.phaseTime >= CLEAR_TIME) this.finishClear();
        break;
      case 'fall':
        if (this.phaseTime >= this.fallDuration) this.finishFall();
        break;
      case 'shuffle':
        if (this.phaseTime >= SHUFFLE_TIME) {
          this.board = reshuffle(this.board, this.rng);
          this.setPhase('idle');
        }
        break;
      case 'levelUp':
        if (this.phaseTime >= LEVEL_UP_TIME) this.startNextLevel();
        break;
    }
  }

  private setPhase(phase: Match3Phase): void {
    this.phase = phase;
    this.phaseTime = 0;
    if (phase === 'idle') {
      this.idleTime = 0;
      this.hint = null;
    }
  }

  private nudge(): void {
    this.idleTime = 0;
    this.hint = null;
  }

  private handleKeyboard(dt: number, input: InputSnapshot<Match3Action>): void {
    for (const dir of ['up', 'down', 'left', 'right'] as const) {
      const state = input.actions[dir];
      let fire = state.pressed;
      if (state.held) {
        const before = this.holds[dir];
        this.holds[dir] += dt;
        if (this.selected < 0 && this.holds[dir] >= REPEAT_DELAY) {
          const k0 = before < REPEAT_DELAY ? -1 : Math.floor((before - REPEAT_DELAY) / REPEAT_EVERY);
          const k1 = Math.floor((this.holds[dir] - REPEAT_DELAY) / REPEAT_EVERY);
          if (k1 > k0) fire = true;
        }
      } else {
        this.holds[dir] = 0;
      }
      if (fire) this.arrow(dir);
    }
    if (input.actions.select.pressed) {
      this.nudge();
      this.cursorVisible = true;
      if (this.selected === this.cursor) {
        this.selected = -1;
        this.events.say('Selection cleared.');
      } else {
        this.selected = this.cursor;
        this.events.cue('select');
        this.events.say(`Selected ${describe(this.board, this.cursor)}. Press an arrow key to swap.`);
      }
    }
  }

  private arrow(dir: 'up' | 'down' | 'left' | 'right'): void {
    this.nudge();
    const [dr, dc] = DIRS[dir];
    if (this.selected >= 0) {
      const target = neighbor(this.selected, dr, dc);
      const from = this.selected;
      this.selected = -1;
      if (target >= 0) this.trySwap(from, target);
      return;
    }
    if (!this.cursorVisible) {
      this.cursorVisible = true;
    } else {
      const next = neighbor(this.cursor, dr, dc);
      if (next >= 0) this.cursor = next;
    }
    this.events.say(describe(this.board, this.cursor));
  }

  private handlePointer(input: InputSnapshot<Match3Action>): void {
    const p = input.pointer;
    if (p.pressed) {
      this.nudge();
      this.cursorVisible = false;
      const cell = cellAt(p.x, p.y);
      if (cell < 0) {
        this.selected = -1;
        this.drag = null;
      } else if (this.selected >= 0 && this.selected !== cell && isAdjacent(this.selected, cell)) {
        const from = this.selected;
        this.selected = -1;
        this.drag = null;
        this.trySwap(from, cell);
      } else {
        const deselect = this.selected === cell;
        if (!deselect) this.events.cue('select');
        this.selected = cell;
        this.cursor = cell;
        this.drag = { cell, x: p.x, y: p.y, deselect };
      }
    }
    if (this.drag && p.down) {
      const dx = p.x - this.drag.x;
      const dy = p.y - this.drag.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= DRAG_THRESHOLD) {
        const horizontal = Math.abs(dx) >= Math.abs(dy);
        const target = neighbor(this.drag.cell, horizontal ? 0 : Math.sign(dy), horizontal ? Math.sign(dx) : 0);
        const from = this.drag.cell;
        this.drag = null;
        this.selected = -1;
        if (target >= 0) this.trySwap(from, target);
      }
    }
    if (p.released && this.drag) {
      if (this.drag.deselect) this.selected = -1;
      this.drag = null;
    }
  }

  trySwap(a: number, b: number): boolean {
    if (this.phase !== 'idle' || !isAdjacent(a, b)) return false;
    this.swapA = a;
    this.swapB = b;
    swap(this.board, a, b);
    this.events.cue('place');
    this.setPhase('swap');
    return true;
  }

  private finishSwap(): void {
    if (inMatch(this.board, this.swapA) || inMatch(this.board, this.swapB)) {
      this.movesLeft--;
      this.movesMade++;
      this.chain = 0;
      this.moveGain = 0;
      this.startClear();
    } else {
      swap(this.board, this.swapA, this.swapB);
      this.events.cue('invalid');
      this.events.say('No match. Swap undone.');
      this.setPhase('swapBack');
    }
  }

  private startClear(): void {
    const match = findMatches(this.board);
    this.chain++;
    this.bestChain = Math.max(this.bestChain, this.chain);
    const points = clearPoints(match, this.chain);
    this.score += points;
    this.levelScore += points;
    this.moveGain += points;
    this.lastGainTime = this.time;
    this.gemsCleared += match.cells.length;
    this.clearing = match.cells;
    this.events.cue(this.chain === 1 ? 'match' : 'collect');
    for (const i of match.cells) {
      this.particles.burst({
        x: BOARD_X + colOf(i) * CELL + CELL / 2,
        y: BOARD_Y + rowOf(i) * CELL + CELL / 2,
        count: 5,
        color: tokenStyle(this.board[i] ?? 0).color,
        speed: 180,
        life: 0.45,
        size: 4,
      });
    }
    this.setPhase('clear');
  }

  private finishClear(): void {
    clearCells(this.board, this.clearing);
    this.clearing = [];
    this.fallRows.fill(0);
    let maxRows = 0;
    for (const f of applyGravity(this.board)) {
      this.fallRows[f.to] = f.rows;
      maxRows = Math.max(maxRows, f.rows);
    }
    for (const f of refill(this.board, this.rng)) {
      this.fallRows[f.to] = f.rows;
      maxRows = Math.max(maxRows, f.rows);
    }
    this.fallDuration = Math.min(0.45, Math.max(0.12, maxRows / FALL_ROWS_PER_SECOND));
    this.setPhase('fall');
  }

  private finishFall(): void {
    this.fallRows.fill(0);
    if (findMatches(this.board).cells.length > 0) {
      if (this.chain >= MAX_CASCADES) {
        this.board = reshuffle(this.board, this.rng);
      } else {
        if (this.chain === 1) this.events.say('Cascade!');
        this.startClear();
        return;
      }
    }
    this.endMove();
  }

  private endMove(): void {
    this.events.say(
      `${formatPoints(this.moveGain)} points${this.chain > 1 ? `, cascade x${this.chain}` : ''}. ${formatPoints(this.levelScore)} of ${formatPoints(this.target)}. ${this.movesLeft} ${this.movesLeft === 1 ? 'move' : 'moves'} left.`,
    );
    if (this.levelScore >= this.target) {
      this.levelBonus = this.movesLeft * MOVE_BONUS;
      this.score += this.levelBonus;
      this.events.cue('levelUp');
      this.events.say(`Target reached! ${this.movesLeft} moves left: ${this.levelBonus} bonus points.`);
      this.setPhase('levelUp');
      return;
    }
    if (this.movesLeft <= 0) {
      this.events.cue('gameOver');
      this.events.say('Out of moves. Game over.');
      this.setPhase('ending');
      return;
    }
    if (this.movesLeft <= 3) this.events.cue('tick');
    if (!findValidMove(this.board)) {
      this.events.say('No moves left on the board. Shuffling.');
      this.setPhase('shuffle');
      return;
    }
    this.setPhase('idle');
  }

  private startNextLevel(): void {
    this.level++;
    this.target = levelTarget(this.level);
    this.movesLeft = MOVES_PER_LEVEL;
    this.levelScore = 0;
    this.levelBonus = 0;
    this.selected = -1;
    if (!findValidMove(this.board) || findMatches(this.board).cells.length > 0) this.board = reshuffle(this.board, this.rng);
    this.events.say(`Level ${this.level}. Score ${formatPoints(this.target)} points in ${MOVES_PER_LEVEL} moves.`);
    this.setPhase('idle');
  }
}
