import { KING, createDeck, flipTop, isSameSuitRun, rankName, shuffle, top, withFace, type Card, type Suit } from '@/games/cards/model';
import { createRng } from '@/lib/utils/random';

export type SuitCount = 1 | 2 | 4;

export interface SpiderState {
  readonly tableau: readonly (readonly Card[])[];
  readonly stock: readonly Card[];
  readonly completed: readonly (readonly Card[])[];
  readonly suitCount: SuitCount;
  readonly moves: number;
}

export interface PileRef {
  readonly pile: string;
  readonly index: number;
}

export const TABLEAU_COUNT = 10;
export const RUNS_TO_WIN = 8;
export const START_SCORE = 500;
export const RUN_BONUS = 100;
const COLUMN_SIZES = [6, 6, 6, 6, 5, 5, 5, 5, 5, 5];

export const tableauId = (i: number) => `t${i}`;
export const runId = (i: number) => `r${i}`;

export function suitsFor(count: SuitCount): Suit[] {
  if (count === 1) return ['spades'];
  if (count === 2) return ['spades', 'hearts'];
  return ['spades', 'hearts', 'diamonds', 'clubs'];
}

export function spiderDeck(count: SuitCount): Card[] {
  const suits = suitsFor(count);
  return createDeck({ suits, copies: 8 / suits.length });
}

export function dealSpider(seed: number, suitCount: SuitCount): SpiderState {
  return dealSpiderFromDeck(shuffle(spiderDeck(suitCount), createRng(seed)), suitCount);
}

export function dealSpiderFromDeck(deck: readonly Card[], suitCount: SuitCount): SpiderState {
  if (deck.length !== 104) throw new Error('Spider needs 104 cards');
  const cards = deck.map((c) => withFace(c, false));
  let next = 0;
  const tableau = COLUMN_SIZES.map((size) => {
    const col = cards.slice(next, next + size);
    next += size;
    return flipTop(col);
  });
  return { tableau, stock: cards.slice(next), completed: [], suitCount, moves: 0 };
}

export function parsePile(pile: string): number | null {
  const m = /^t(\d)$/.exec(pile);
  if (!m) return null;
  const i = Number(m[1]);
  return i < TABLEAU_COUNT ? i : null;
}

export function score(state: SpiderState): number {
  return Math.max(0, START_SCORE - state.moves + RUN_BONUS * state.completed.length);
}

export function dealsLeft(state: SpiderState): number {
  return Math.floor(state.stock.length / TABLEAU_COUNT);
}

export function canPick(state: SpiderState, pile: string, index: number): boolean {
  const col = parsePile(pile);
  if (col === null) return false;
  const cards = state.tableau[col]!;
  if (index < 0 || index >= cards.length) return false;
  return isSameSuitRun(cards.slice(index));
}

export function movableRunStart(cards: readonly Card[]): number {
  if (cards.length === 0) return -1;
  let i = cards.length - 1;
  while (i > 0) {
    const prev = cards[i - 1]!;
    const cur = cards[i]!;
    if (!prev.faceUp || prev.suit !== cur.suit || prev.rank !== cur.rank + 1) break;
    i--;
  }
  return i;
}

export function moveError(state: SpiderState, from: PileRef, to: string): string | null {
  if (!canPick(state, from.pile, from.index)) return 'Only a run of one suit in descending order can be moved together.';
  const dest = parsePile(to);
  if (dest === null) return 'Cards cannot be placed there.';
  if (from.pile === to) return 'Choose a different column.';
  const moving = state.tableau[parsePile(from.pile)!]![from.index]!;
  const t = top(state.tableau[dest]!);
  if (!t) return null;
  if (t.rank === moving.rank + 1) return null;
  return t.rank === 1 ? 'Nothing can be placed on an Ace.' : `This column needs a ${rankName(t.rank - 1).toLowerCase()} (any suit).`;
}

export function canMove(state: SpiderState, from: PileRef, to: string): boolean {
  return moveError(state, from, to) === null;
}

function collectRun(state: SpiderState, col: number): SpiderState {
  const cards = state.tableau[col]!;
  if (cards.length < 13) return state;
  const tail = cards.slice(cards.length - 13);
  if (tail[0]!.rank !== KING || !isSameSuitRun(tail)) return state;
  const remaining = flipTop(cards.slice(0, cards.length - 13));
  return {
    ...state,
    tableau: state.tableau.map((c, i) => (i === col ? remaining : c)),
    completed: [...state.completed, tail],
  };
}

export function applyMove(state: SpiderState, from: PileRef, to: string): SpiderState | null {
  if (!canMove(state, from, to)) return null;
  const src = parsePile(from.pile)!;
  const dst = parsePile(to)!;
  const source = state.tableau[src]!;
  const moving = source.slice(from.index);
  const tableau = state.tableau.map((c, i) => {
    if (i === src) return flipTop(source.slice(0, from.index));
    if (i === dst) return [...c, ...moving];
    return c;
  });
  return collectRun({ ...state, tableau, moves: state.moves + 1 }, dst);
}

export function dealBlockedReason(state: SpiderState): string | null {
  if (state.stock.length === 0) return 'There are no more cards to deal.';
  if (state.tableau.some((c) => c.length === 0)) return 'Fill every empty column before dealing a new row.';
  return null;
}

export function dealRow(state: SpiderState): SpiderState | null {
  if (dealBlockedReason(state) !== null) return null;
  const n = state.stock.length;
  const row = state.stock.slice(n - TABLEAU_COUNT);
  let next: SpiderState = {
    ...state,
    stock: state.stock.slice(0, n - TABLEAU_COUNT),
    tableau: state.tableau.map((c, i) => [...c, withFace(row[i]!, true)]),
    moves: state.moves + 1,
  };
  for (let i = 0; i < TABLEAU_COUNT; i++) next = collectRun(next, i);
  return next;
}

export function undoTo(previous: SpiderState, current: SpiderState): SpiderState {
  return { ...previous, moves: current.moves + 1 };
}

export function bestDestination(state: SpiderState, from: PileRef): string | null {
  if (!canPick(state, from.pile, from.index)) return null;
  const src = parsePile(from.pile)!;
  const moving = state.tableau[src]![from.index]!;
  let anySuit: number | null = null;
  let empty: number | null = null;
  for (let i = 0; i < TABLEAU_COUNT; i++) {
    if (i === src) continue;
    const t = top(state.tableau[i]!);
    if (!t) {
      if (empty === null && from.index > 0) empty = i;
      continue;
    }
    if (t.rank !== moving.rank + 1) continue;
    if (t.suit === moving.suit) return tableauId(i);
    if (anySuit === null) anySuit = i;
  }
  const pick = anySuit ?? empty;
  return pick === null ? null : tableauId(pick);
}

export function isWon(state: SpiderState): boolean {
  return state.completed.length === RUNS_TO_WIN;
}

export function hasAnyMove(state: SpiderState): boolean {
  if (dealBlockedReason(state) === null) return true;
  for (let s = 0; s < TABLEAU_COUNT; s++) {
    const col = state.tableau[s]!;
    const start = movableRunStart(col);
    if (start < 0) continue;
    for (let k = col.length - 1; k >= start; k--) {
      for (let d = 0; d < TABLEAU_COUNT; d++) {
        if (d !== s && canMove(state, { pile: tableauId(s), index: k }, tableauId(d))) return true;
      }
    }
  }
  return false;
}
