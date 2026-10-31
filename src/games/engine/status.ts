export type GameStatus = 'ready' | 'playing' | 'paused' | 'over';
export type StatusEvent = 'start' | 'pause' | 'resume' | 'end' | 'restart';

const TRANSITIONS: Readonly<Record<GameStatus, Partial<Record<StatusEvent, GameStatus>>>> = {
  ready: { start: 'playing' },
  playing: { pause: 'paused', end: 'over' },
  paused: { resume: 'playing', restart: 'playing', end: 'over' },
  over: { restart: 'playing' },
};

export function transition(status: GameStatus, event: StatusEvent): GameStatus | null {
  return TRANSITIONS[status][event] ?? null;
}
