import {
  ACE,
  KING,
  cardColor,
  cardName,
  createDeck,
  findFoundation,
  fitsFoundation,
  flipTop,
  isAlternatingRun,
  isAlternatingStep,
  rankName,
  shuffle,
  top,
  withFace,
  type Card,
} from '@/games/cards/model';
import { createRng } from '@/lib/utils/random';

export type DrawCount = 1 | 3;

export interface KlondikeState {
  readonly tableau: readonly (readonly Card[])[];
  readonly foundations: readonly (readonly Card[])[];
  readonly stock: readonly Card[];
  readonly waste: readonly Card[];
  readonly drawCount: DrawCount;
  readonly moves: number;
  readonly recycles: number;
}

export interface PileRef {
  readonly pile: string;
  readonly index: number;
}

export interface KlondikeMove {
  readonly from: PileRef;
  readonly to: string;
}

export const TABLEAU_COUNT = 7;
export const FOUNDATION_COUNT = 4;

export const tableauId = (i: number) => `t${i}`;
export const foundationId = (i: number) => `f${i}`;

export function parsePile(pile: string): { kind: 'stock' | 'waste' | 'tableau' | 'foundation'; index: number } | null {
  if (pile === 'stock') return { kind: 'stock', index: 0 };
  if (pile === 'waste') return { kind: 'waste', index: 0 };
  const m = /^([tf])(\d)$/.exec(pile);
  if (!m) return null;
  const index = Number(m[2]);
  if (m[1] === 't') return index < TABLEAU_COUNT ? { kind: 'tableau', index } : null;
  return index < FOUNDATION_COUNT ? { kind: 'foundation', index } : null;
}

export function dealKlondike(seed: number, drawCount: DrawCount = 1): KlondikeState {
  const deck = shuffle(createDeck(), createRng(seed));
  return dealFromDeck(deck, drawCount);
}

export function dealFromDeck(deck: readonly Card[], drawCount: DrawCount = 1): KlondikeState {
  if (deck.length !== 52) throw new Error('Klondike needs a 52-card deck');
  const cards = deck.map((c) => withFace(c, false));
  const tableau: Card[][] = Array.from({ length: TABLEAU_COUNT }, () => []);
  let next = 0;
  for (let row = 0; row < TABLEAU_COUNT; row++) {
    for (let col = row; col < TABLEAU_COUNT; col++) {
      tableau[col]!.push(cards[next++]!);
    }
  }
  const dealt = tableau.map((col) => flipTop(col));
  const stock = cards.slice(next).reverse();
  return {
    tableau: dealt,
    foundations: Array.from({ length: FOUNDATION_COUNT }, () => []),
    stock,
    waste: [],
    drawCount,
    moves: 0,
    recycles: 0,
  };
}

export function pileCards(state: KlondikeState, pile: string): readonly Card[] {
  const p = parsePile(pile);
  if (!p) return [];
  switch (p.kind) {
    case 'stock':
      return state.stock;
    case 'waste':
      return state.waste;
    case 'tableau':
      return state.tableau[p.index] ?? [];
    case 'foundation':
      return state.foundations[p.index] ?? [];
  }
}

export function canPick(state: KlondikeState, pile: string, index: number): boolean {
  const p = parsePile(pile);
  if (!p || p.kind === 'stock') return false;
  const cards = pileCards(state, pile);
  if (index < 0 || index >= cards.length) return false;
  if (p.kind === 'tableau') return isAlternatingRun(cards.slice(index));
  return index === cards.length - 1 && cards[index]!.faceUp;
}

export function fitsTableau(column: readonly Card[], card: Card): boolean {
  const t = top(column);
  if (!t) return card.rank === KING;
  return t.faceUp && isAlternatingStep(t, card);
}

export function moveError(state: KlondikeState, from: PileRef, to: string): string | null {
  if (!canPick(state, from.pile, from.index)) return 'That card cannot be moved.';
  if (from.pile === to) return 'Choose a different pile.';
  const dest = parsePile(to);
  if (!dest || dest.kind === 'stock' || dest.kind === 'waste') return 'Cards cannot be placed there.';
  const moving = pileCards(state, from.pile).slice(from.index);
  const first = moving[0]!;
  if (dest.kind === 'foundation') {
    if (moving.length > 1) return 'Only one card at a time can go to a foundation.';
    const foundation = state.foundations[dest.index]!;
    if (fitsFoundation(foundation, first)) return null;
    const t = top(foundation);
    return t
      ? `Foundations build up by suit: this one needs the ${cardName({ suit: t.suit, rank: t.rank + 1 })}.`
      : 'An empty foundation must start with an Ace.';
  }
  const column = state.tableau[dest.index]!;
  if (fitsTableau(column, first)) return null;
  const t = top(column);
  if (!t) return 'Only a King can go to an empty column.';
  const needColor = cardColor(t) === 'red' ? 'black' : 'red';
  return t.rank === ACE
    ? 'Nothing can be placed on an Ace in the tableau.'
    : `Build down in alternating colours: this column needs a ${needColor} ${rankName(t.rank - 1).toLowerCase()}.`;
}

export function canMove(state: KlondikeState, from: PileRef, to: string): boolean {
  return moveError(state, from, to) === null;
}

function setPile(state: KlondikeState, pile: string, cards: readonly Card[]): KlondikeState {
  const p = parsePile(pile)!;
  switch (p.kind) {
    case 'stock':
      return { ...state, stock: cards };
    case 'waste':
      return { ...state, waste: cards };
    case 'tableau':
      return { ...state, tableau: state.tableau.map((c, i) => (i === p.index ? cards : c)) };
    case 'foundation':
      return { ...state, foundations: state.foundations.map((c, i) => (i === p.index ? cards : c)) };
  }
}

export function applyMove(state: KlondikeState, from: PileRef, to: string): KlondikeState | null {
  if (!canMove(state, from, to)) return null;
  const source = pileCards(state, from.pile);
  const moving = source.slice(from.index);
  let remaining: readonly Card[] = source.slice(0, from.index);
  if (parsePile(from.pile)!.kind === 'tableau') remaining = flipTop(remaining);
  let next = setPile(state, from.pile, remaining);
  next = setPile(next, to, [...pileCards(next, to), ...moving.map((c) => withFace(c, true))]);
  return { ...next, moves: state.moves + 1 };
}

export function revealsCard(state: KlondikeState, from: PileRef): boolean {
  if (parsePile(from.pile)?.kind !== 'tableau' || from.index === 0) return false;
  const below = pileCards(state, from.pile)[from.index - 1];
  return Boolean(below && !below.faceUp);
}

export function drawFromStock(state: KlondikeState): KlondikeState | null {
  if (state.stock.length > 0) {
    const n = Math.min(state.drawCount, state.stock.length);
    const drawn = state.stock.slice(state.stock.length - n).reverse().map((c) => withFace(c, true));
    return {
      ...state,
      stock: state.stock.slice(0, state.stock.length - n),
      waste: [...state.waste, ...drawn],
      moves: state.moves + 1,
    };
  }
  if (state.waste.length > 0) {
    return {
      ...state,
      stock: state.waste.slice().reverse().map((c) => withFace(c, false)),
      waste: [],
      moves: state.moves + 1,
      recycles: state.recycles + 1,
    };
  }
  return null;
}

export function foundationFor(state: KlondikeState, card: Card): number {
  return findFoundation(state.foundations, card);
}

export function autoMoveTarget(state: KlondikeState, from: PileRef): string | null {
  const p = parsePile(from.pile);
  if (!p || p.kind === 'foundation' || p.kind === 'stock') return null;
  const cards = pileCards(state, from.pile);
  if (from.index !== cards.length - 1 || !canPick(state, from.pile, from.index)) return null;
  const f = foundationFor(state, cards[from.index]!);
  return f >= 0 ? foundationId(f) : null;
}

export function isWon(state: KlondikeState): boolean {
  return state.foundations.every((f) => f.length === 13);
}

export function canAutoComplete(state: KlondikeState): boolean {
  if (isWon(state) || state.stock.length > 0 || state.waste.length > 0) return false;
  return state.tableau.every((col) => col.every((c) => c.faceUp));
}

export function nextAutoCompleteMove(state: KlondikeState): KlondikeMove | null {
  let best: KlondikeMove | null = null;
  let bestRank = Infinity;
  state.tableau.forEach((col, i) => {
    const card = top(col);
    if (!card || !card.faceUp || card.rank >= bestRank) return;
    const f = foundationFor(state, card);
    if (f < 0) return;
    best = { from: { pile: tableauId(i), index: col.length - 1 }, to: foundationId(f) };
    bestRank = card.rank;
  });
  return best;
}

export function autoCompleteMoves(state: KlondikeState): KlondikeMove[] {
  if (!canAutoComplete(state)) return [];
  const moves: KlondikeMove[] = [];
  let current: KlondikeState | null = state;
  while (current && !isWon(current)) {
    const m = nextAutoCompleteMove(current);
    if (!m) break;
    moves.push(m);
    current = applyMove(current, m.from, m.to);
  }
  return moves;
}

export function hiddenCount(state: KlondikeState): number {
  return state.tableau.reduce((n, col) => n + col.filter((c) => !c.faceUp).length, 0);
}

export function foundationTotal(state: KlondikeState): number {
  return state.foundations.reduce((n, f) => n + f.length, 0);
}
