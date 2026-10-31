import type { HudItem, SoundCue } from '@/games/engine/types';
import type { GameId } from '@/config/games';
import type { GameStorage } from '@/lib/storage/game-data';

export type { HudItem, SoundCue } from '@/games/engine/types';
export type { GameStorage } from '@/lib/storage/game-data';

export type DomOutcome = 'won' | 'lost' | 'draw';

export interface DomRunResult {
  outcome: DomOutcome;
  value?: number;
  title?: string;
  detail?: string;
  continuable?: boolean;
  canReplay?: boolean;
}

export interface GameHost {
  readonly gameId: GameId;
  setHud(items: readonly HudItem[]): void;
  setInProgress(inProgress: boolean): void;
  finish(result: DomRunResult): void;
  announce(message: string): void;
  playSound(cue: SoundCue): void;
  readonly storage: GameStorage;
  readonly reducedMotion: boolean;
  newGame(): void;
}

export interface DomGameProps {
  host: GameHost;
  variant: string;
  paused: boolean;
}
