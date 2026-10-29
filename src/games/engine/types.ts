import type { GameId } from '@/config/games';
import type { RunOptions } from '../modifiers';

export type GameStats = Readonly<Record<string, number>>;

export interface ActionState {
  held: boolean;
  pressed: boolean;
  released: boolean;
}

export interface PointerSnapshot {
  inside: boolean;
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
  | 'win'
  | 'select'
  | 'place'
  | 'invalid'
  | 'match'
  | 'flip'
  | 'pop'
  | 'swish'
  | 'tick'
  | 'crash'
  | 'putt';

export type GameOutcome = 'lost' | 'won';

export interface Simulation<A extends string> {
  update(dt: number, input: InputSnapshot<A>): void;
  readonly outcome: GameOutcome | null;
  readonly score: number;
  getStats(): GameStats;
  getHud(): readonly HudItem[];
  drainCues(): SoundCue[];
  drainAnnouncements(): string[];
}

export interface RenderEnv {
  ctx: CanvasRenderingContext2D;
  reducedMotion: boolean;
}

export interface Renderer<S> {
  render(sim: S): void;
}

export interface GameDefinition<A extends string, S extends Simulation<A>> {
  id: GameId;
  width: number;
  height: number;
  bindings: Readonly<Record<A, readonly string[]>>;
  createSimulation(options: RunOptions): S;
  createRenderer(env: RenderEnv): Renderer<S>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGameDefinition = GameDefinition<any, Simulation<any>>;
