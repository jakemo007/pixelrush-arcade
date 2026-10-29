import type { Rng } from '@/lib/utils/random';
import { SYMBOLS } from './symbols';

export interface Card {
  id: number;
  symbol: number;
}

export interface MemoryState {
  cards: Card[];
  matched: boolean[];
  open: number[];
  moves: number;
  pairsFound: number;
  pairs: number;
}

export type FlipEvent = 'ignored' | 'first' | 'match' | 'mismatch' | 'closed';

export interface BoardSize {
  rows: number;
  cols: number;
  pairs: number;
}

export const BOARD_SIZES: Readonly<Record<string, BoardSize>> = {
  '4x4': { rows: 4, cols: 4, pairs: 8 },
  '6x6': { rows: 6, cols: 6, pairs: 18 },
};

export function boardSizeFor(variant: string): BoardSize {
  return BOARD_SIZES[variant] ?? BOARD_SIZES['4x4']!;
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export function createDeck(pairs: number, rng: Rng): Card[] {
  if (pairs < 1 || pairs > SYMBOLS.length) throw new Error(`Unsupported number of pairs: ${pairs}`);
  const chosen = shuffle(
    SYMBOLS.map((_, i) => i),
    rng,
  ).slice(0, pairs);
  return shuffle([...chosen, ...chosen], rng).map((symbol, id) => ({ id, symbol }));
}

export function newGame(pairs: number, rng: Rng): MemoryState {
  const cards = createDeck(pairs, rng);
  return { cards, matched: cards.map(() => false), open: [], moves: 0, pairsFound: 0, pairs };
}

export function isFaceUp(state: MemoryState, index: number): boolean {
  return state.matched[index] === true || state.open.includes(index);
}

export function closeOpen(state: MemoryState): MemoryState {
  if (state.open.length < 2) return state;
  return { ...state, open: [] };
}

export function flip(state: MemoryState, index: number): { state: MemoryState; event: FlipEvent } {
  if (index < 0 || index >= state.cards.length || state.matched[index]) return { state, event: 'ignored' };
  let s = state;
  if (s.open.length === 2) {
    if (s.open.includes(index)) return { state: closeOpen(s), event: 'closed' };
    s = closeOpen(s);
  }
  if (s.open.includes(index)) return { state: s, event: 'ignored' };
  if (s.open.length === 0) return { state: { ...s, open: [index] }, event: 'first' };

  const first = s.open[0]!;
  const moves = s.moves + 1;
  if (s.cards[first]!.symbol === s.cards[index]!.symbol) {
    const matched = [...s.matched];
    matched[first] = true;
    matched[index] = true;
    return { state: { ...s, matched, open: [], moves, pairsFound: s.pairsFound + 1 }, event: 'match' };
  }
  return { state: { ...s, open: [first, index], moves }, event: 'mismatch' };
}

export function isComplete(state: MemoryState): boolean {
  return state.pairsFound === state.pairs;
}

export function symbolName(state: MemoryState, index: number): string {
  const card = state.cards[index];
  return card ? (SYMBOLS[card.symbol]?.name ?? 'card') : 'card';
}
