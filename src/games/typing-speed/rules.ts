import type { Rng } from '@/lib/utils/random';

export const CHARS_PER_WORD = 5;

export const DURATIONS: Readonly<Record<string, number>> = {
  '60s': 60_000,
  '30s': 30_000,
};

export function durationFor(variant: string): number {
  return DURATIONS[variant] ?? DURATIONS['60s']!;
}

export function minCharsFor(durationMs: number): number {
  return Math.ceil((durationMs / 60_000) * 2000);
}

export function buildText(passages: readonly string[], rng: Rng, minChars: number): string {
  if (passages.length === 0) return '';
  const order = passages.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  const parts: string[] = [];
  let length = 0;
  for (let k = 0; length < minChars; k++) {
    const text = passages[order[k % order.length]!]!;
    parts.push(text);
    length += text.length + 1;
  }
  return parts.join(' ');
}

export function normalizeInput(raw: string): string {
  return raw
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[\r\n]/g, '')
    .replace(/[\t   ]/g, ' ');
}

export interface TypingState {
  target: string;
  typed: string;
  committed: string;
  keystrokes: number;
  correctKeystrokes: number;
}

export function initialState(target: string): TypingState {
  return { target, typed: '', committed: '', keystrokes: 0, correctKeystrokes: 0 };
}

export function commonPrefix(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
}

export function applyInput(state: TypingState, raw: string, composing = false): TypingState {
  const value = normalizeInput(raw);
  if (composing) return { ...state, typed: value };
  const p = commonPrefix(state.committed, value);
  let keystrokes = state.keystrokes;
  let correct = state.correctKeystrokes;
  for (let i = p; i < value.length; i++) {
    keystrokes++;
    if (value[i] === state.target[i]) correct++;
  }
  return { ...state, typed: value, committed: value, keystrokes, correctKeystrokes: correct };
}

export type CharState = 'correct' | 'incorrect' | 'pending';

export function charState(target: string, typed: string, index: number): CharState {
  if (index >= typed.length) return 'pending';
  return typed[index] === target[index] ? 'correct' : 'incorrect';
}

export function countCorrect(target: string, typed: string): number {
  const n = Math.min(target.length, typed.length);
  let correct = 0;
  for (let i = 0; i < n; i++) if (typed[i] === target[i]) correct++;
  return correct;
}

export interface TypingStats {
  grossWpm: number;
  netWpm: number;
  accuracy: number | null;
  correctChars: number;
  incorrectChars: number;
  keystrokes: number;
}

export function computeStats(state: Pick<TypingState, 'target' | 'typed' | 'keystrokes' | 'correctKeystrokes'>, elapsedMs: number): TypingStats {
  const minutes = Math.max(0, elapsedMs) / 60_000;
  const correctChars = countCorrect(state.target, state.typed);
  const incorrectChars = state.typed.length - correctChars;
  const perMinute = (chars: number) => (minutes > 0 ? chars / CHARS_PER_WORD / minutes : 0);
  return {
    grossWpm: perMinute(state.keystrokes),
    netWpm: perMinute(correctChars),
    accuracy: state.keystrokes > 0 ? state.correctKeystrokes / state.keystrokes : null,
    correctChars,
    incorrectChars,
    keystrokes: state.keystrokes,
  };
}

export function splitWords(text: string): { start: number; text: string }[] {
  const words: { start: number; text: string }[] = [];
  const re = /\S+\s*|\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) words.push({ start: m.index, text: m[0] });
  return words;
}
