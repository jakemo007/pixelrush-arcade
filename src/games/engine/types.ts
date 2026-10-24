/**
 * Contracts shared by every game.
 *
 * A game is split into:
 *   - a Simulation: pure TypeScript game rules, no DOM access. It is stepped
 *     with a fixed timestep and an input snapshot, which makes it testable in
 *     Node (see tests/).
 *   - a Renderer: draws a simulation onto a 2D canvas. Never changes game state.
 *   - a GameDefinition: metadata + factories, consumed by the controller.
 */

import type { GameId } from '@/config/games';
import type { RunOptions } from '../modifiers';

export type GameStats = Readonly<Record<string, number>>;

export interface ActionState {
  held: boolean;
  /** Became held since the previous step. */
  pressed: boolean;
  /** Was released since the previous step. */
  released: boolean;
}

export interface PointerSnapshot {
  /** A pointer is over the game (mouse hover or an active touch). */
  inside: boolean;
  /** Last known position in logical game coordinates. */
  x: number;
  y: number;
  down: boolean;
  pressed: boolean;
  released: boolean;
  moved: boolean;
}

export interface InputSnapshot<A extends string> {
  actions: Readonly<Record<A, ActionState>>;
  pointer: Readonly<PointerSnapshot>;
}

export interface HudItem {
  id: string;
  label: string;
  value: string;
}

export type SoundCue =
  | 'jump'
  | 'land'
  | 'collect'
  | 'hit'
  | 'explode'
  | 'bounce'
  | 'brick'
  | 'brickHit'
  | 'steel'
  | 'powerup'
  | 'shoot'
  | 'launch'
  | 'levelUp'
  | 'lifeLost'
  | 'milestone'
  | 'gameOver'
  | 'win';

export type GameOutcome = 'lost' | 'won';

export interface Simulation<A extends string> {
  /** Advances the game by `dt` seconds (always the fixed step). */
  update(dt: number, input: InputSnapshot<A>): void;
  /** Non-null once the run has ended and its end animation has finished. */
  readonly outcome: GameOutcome | null;
  readonly score: number;
  getStats(): GameStats;
  /** Game-specific HUD entries (lives, level...). Score/best are added by the shell. */
  getHud(): readonly HudItem[];
  /** Sound cues raised since the last call. */
  drainCues(): SoundCue[];
  /** Short messages for the screen-reader live region (e.g. "Level 3"). */
  drainAnnouncements(): string[];
}

export interface RenderEnv {
  ctx: CanvasRenderingContext2D;
  /** True when the player prefers reduced motion: no shake, fewer flashes. */
  reducedMotion: boolean;
}

export interface Renderer<S> {
  render(sim: S): void;
}

export interface GameDefinition<A extends string, S extends Simulation<A>> {
  id: GameId;
  /** Logical resolution; the canvas is scaled to fit while keeping this aspect ratio. */
  width: number;
  height: number;
  /** KeyboardEvent.code values for each action. */
  bindings: Readonly<Record<A, readonly string[]>>;
  createSimulation(options: RunOptions): S;
  createRenderer(env: RenderEnv): Renderer<S>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameDefinition = GameDefinition<any, Simulation<any>>;
