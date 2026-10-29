export interface History<S> {
  readonly past: readonly S[];
  readonly present: S;
}

export const HISTORY_LIMIT = 2000;

export function createHistory<S>(initial: S): History<S> {
  return { past: [], present: initial };
}

export function pushHistory<S>(history: History<S>, next: S, limit = HISTORY_LIMIT): History<S> {
  const past = history.past.length >= limit ? history.past.slice(history.past.length - limit + 1) : history.past;
  return { past: [...past, history.present], present: next };
}

export function replacePresent<S>(history: History<S>, next: S): History<S> {
  return { past: history.past, present: next };
}

export function canUndo<S>(history: History<S>): boolean {
  return history.past.length > 0;
}

export function undoHistory<S>(history: History<S>): History<S> {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1]!;
  return { past: history.past.slice(0, -1), present: previous };
}
