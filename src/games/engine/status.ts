/**
 * The lifecycle shared by all games:
 *
 *   ready --start--> playing --pause--> paused --resume--> playing
 *                       |                  |
 *                       +--end--> over <---+ (end)
 *   paused/over --restart--> playing
 *
 * Restart is deliberately not allowed straight from "playing" so a stray key
 * press can never wipe out a run in progress; pause first.
 */

export type GameStatus = 'ready' | 'playing' | 'paused' | 'over';
export type StatusEvent = 'start' | 'pause' | 'resume' | 'end' | 'restart';

const TRANSITIONS: Readonly<Record<GameStatus, Partial<Record<StatusEvent, GameStatus>>>> = {
  ready: { start: 'playing' },
  playing: { pause: 'paused', end: 'over' },
  paused: { resume: 'playing', restart: 'playing', end: 'over' },
  over: { restart: 'playing' },
};

/** Returns the next status, or null if the event is not valid in this status. */
export function transition(status: GameStatus, event: StatusEvent): GameStatus | null {
  return TRANSITIONS[status][event] ?? null;
}
