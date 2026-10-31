import {
  ACE,
  findFoundation,
  fitsFoundation,
  foundationRank,
  isAlternatingRun,
  isAlternatingStep,
  rankName,
  suitColor,
  top,
  cardColor,
  cardName,
  type Card,
  type Suit,
} from '@/games/cards/model';

export interface FreeCellState {
  readonly tableau: readonly (readonly Card[])[];
  readonly cells: readonly (Card | null)[];
  readonly foundations: readonly (readonly Card[])[];
  readonly moves: number;
  readonly deal: number;
}

export interface PileRef {
  readonly pile: string;
  readonly index: number;
}

export const TABLEAU_COUNT = 8;
export const CELL_COUNT = 4;
export const FOUNDATION_COUNT = 4;
export const MIN_DEAL = 1;
export const MAX_DEAL = 32000;

const MS_SUITS: readonly Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];

export function numberedDealOrder(dealNumber: number): { suit: Suit; rank: number }[] {
  let seed = dealNumber >>> 0;
  const rnd = () => {
    seed = (seed * 214013 + 2531011) & 0x7fffffff;
    return seed >> 16;
  };
  const deck: number[] = [];
  for (let i = 0; i < 52; i++) deck.push(51 - i);
  for (let i = 0; i < 51; i++) {
    const j = 51 - (rnd() % (52 - i));
    const tmp = deck[i]!;
    deck[i] = deck[j]!;
    deck[j] = tmp;
  }
  return deck.map((v) => ({ suit: MS_SUITS[v % 4]!, rank: Math.floor(v / 4) + 1 }));
}

export function dealFreeCell(dealNumber: number): FreeCellState {
  const order = numberedDealOrder(dealNumber);
  const tableau: Card[][] = Array.from({ length: TABLEAU_COUNT }, () => []);
  order.forEach((c, i) => tableau[i % TABLEAU_COUNT]!.push({ id: i, suit: c.suit, rank: c.rank, faceUp: true }));
  return {
    tableau,
    cells: Array.from({ length: CELL_COUNT }, () => null),
    foundations: Array.from({ length: FOUNDATION_COUNT }, () => []),
    moves: 0,
    deal: dealNumber,
  };
}

export function parsePile(pile: string): { kind: 'tableau' | 'cell' | 'foundation'; index: number } | null {
  const m = /^([tcf])(\d)$/.exec(pile);
  if (!m) return null;
  const index = Number(m[2]);
  if (m[1] === 't') return index < TABLEAU_COUNT ? { kind: 'tableau', index } : null;
  if (m[1] === 'c') return index < CELL_COUNT ? { kind: 'cell', index } : null;
  return index < FOUNDATION_COUNT ? { kind: 'foundation', index } : null;
}

export const tableauId = (i: number) => `t${i}`;
export const cellId = (i: number) => `c${i}`;
export const foundationId = (i: number) => `f${i}`;

export function pileCards(state: FreeCellState, pile: string): readonly Card[] {
  const p = parsePile(pile);
  if (!p) return [];
  if (p.kind === 'tableau') return state.tableau[p.index] ?? [];
  if (p.kind === 'foundation') return state.foundations[p.index] ?? [];
  const card = state.cells[p.index];
  return card ? [card] : [];
}

export function emptyCellCount(state: FreeCellState): number {
  return state.cells.filter((c) => c === null).length;
}

export function emptyColumnCount(state: FreeCellState): number {
  return state.tableau.filter((col) => col.length === 0).length;
}

export function maxMovable(state: FreeCellState, toEmptyColumn: boolean): number {
  const cols = Math.max(0, emptyColumnCount(state) - (toEmptyColumn ? 1 : 0));
  return (1 + emptyCellCount(state)) * 2 ** cols;
}

export function canPick(state: FreeCellState, pile: string, index: number): boolean {
  const p = parsePile(pile);
  if (!p || p.kind === 'foundation') return false;
  const cards = pileCards(state, pile);
  if (index < 0 || index >= cards.length) return false;
  if (p.kind === 'cell') return index === 0;
  return isAlternatingRun(cards.slice(index));
}

export function moveError(state: FreeCellState, from: PileRef, to: string): string | null {
  if (!canPick(state, from.pile, from.index)) return 'That card cannot be moved.';
  if (from.pile === to) return 'Choose a different pile.';
  const dest = parsePile(to);
  if (!dest) return 'Cards cannot be placed there.';
  const moving = pileCards(state, from.pile).slice(from.index);
  const first = moving[0]!;
  if (dest.kind === 'cell') {
    if (moving.length > 1) return 'A free cell holds only one card.';
    return state.cells[dest.index] ? 'That free cell is already in use.' : null;
  }
  if (dest.kind === 'foundation') {
    if (moving.length > 1) return 'Only one card at a time can go to a foundation.';
    const f = state.foundations[dest.index]!;
    if (fitsFoundation(f, first)) return null;
    const t = top(f);
    return t ? `Foundations build up by suit: this one needs the ${cardName({ suit: t.suit, rank: t.rank + 1 })}.` : 'An empty foundation must start with an Ace.';
  }
  const column = state.tableau[dest.index]!;
  const t = top(column);
  if (t && !isAlternatingStep(t, first)) {
    if (t.rank === ACE) return 'Nothing can be placed on an Ace in the tableau.';
    const need = cardColor(t) === 'red' ? 'black' : 'red';
    return `Build down in alternating colours: this column needs a ${need} ${rankName(t.rank - 1).toLowerCase()}.`;
  }
  const limit = maxMovable(state, !t);
  if (moving.length > limit) {
    return `With your free cells and empty columns you can move at most ${limit} card${limit > 1 ? 's' : ''} at once${!t ? ' into an empty column' : ''}.`;
  }
  return null;
}

export function canMove(state: FreeCellState, from: PileRef, to: string): boolean {
  return moveError(state, from, to) === null;
}

function setPile(state: FreeCellState, pile: string, cards: readonly Card[]): FreeCellState {
  const p = parsePile(pile)!;
  if (p.kind === 'tableau') return { ...state, tableau: state.tableau.map((c, i) => (i === p.index ? cards : c)) };
  if (p.kind === 'foundation') return { ...state, foundations: state.foundations.map((c, i) => (i === p.index ? cards : c)) };
  return { ...state, cells: state.cells.map((c, i) => (i === p.index ? (cards[0] ?? null) : c)) };
}

function relocate(state: FreeCellState, from: PileRef, to: string): FreeCellState {
  const source = pileCards(state, from.pile);
  const moving = source.slice(from.index);
  const next = setPile(state, from.pile, source.slice(0, from.index));
  return setPile(next, to, [...pileCards(next, to), ...moving]);
}

export function applyMove(state: FreeCellState, from: PileRef, to: string): FreeCellState | null {
  if (!canMove(state, from, to)) return null;
  return { ...relocate(state, from, to), moves: state.moves + 1 };
}

export function isSafeForFoundation(state: FreeCellState, card: Card): boolean {
  if (findFoundation(state.foundations, card) < 0) return false;
  if (card.rank <= 2) return true;
  const opposite: Suit[] = suitColor(card.suit) === 'red' ? ['spades', 'clubs'] : ['hearts', 'diamonds'];
  return opposite.every((s) => foundationRank(state.foundations, s) >= card.rank - 1);
}

export interface AutoMove {
  readonly from: PileRef;
  readonly to: string;
  readonly card: Card;
}

export function autoMoveSafe(state: FreeCellState): { state: FreeCellState; moved: AutoMove[] } {
  const moved: AutoMove[] = [];
  let current = state;
  for (;;) {
    let found: AutoMove | null = null;
    for (let i = 0; i < CELL_COUNT && !found; i++) {
      const card = current.cells[i];
      if (card && isSafeForFoundation(current, card)) found = { from: { pile: cellId(i), index: 0 }, to: foundationId(findFoundation(current.foundations, card)), card };
    }
    for (let i = 0; i < TABLEAU_COUNT && !found; i++) {
      const col = current.tableau[i]!;
      const card = top(col);
      if (card && isSafeForFoundation(current, card)) found = { from: { pile: tableauId(i), index: col.length - 1 }, to: foundationId(findFoundation(current.foundations, card)), card };
    }
    if (!found) break;
    current = relocate(current, found.from, found.to);
    moved.push(found);
  }
  return { state: current, moved };
}

export function autoMoveTarget(state: FreeCellState, from: PileRef): string | null {
  const p = parsePile(from.pile);
  if (!p || p.kind === 'foundation') return null;
  const cards = pileCards(state, from.pile);
  if (from.index !== cards.length - 1 || !canPick(state, from.pile, from.index)) return null;
  const card = cards[from.index]!;
  const f = findFoundation(state.foundations, card);
  if (f >= 0) return foundationId(f);
  if (p.kind === 'cell') return null;
  const cell = state.cells.findIndex((c) => c === null);
  return cell >= 0 ? cellId(cell) : null;
}

export function isWon(state: FreeCellState): boolean {
  return state.foundations.every((f) => f.length === 13);
}

export function hasLegalMove(state: FreeCellState): boolean {
  const sources: PileRef[] = [];
  state.cells.forEach((c, i) => {
    if (c) sources.push({ pile: cellId(i), index: 0 });
  });
  state.tableau.forEach((col, i) => {
    for (let k = col.length - 1; k >= 0 && canPick(state, tableauId(i), k); k--) sources.push({ pile: tableauId(i), index: k });
  });
  const dests = [
    ...Array.from({ length: CELL_COUNT }, (_, i) => cellId(i)),
    ...Array.from({ length: FOUNDATION_COUNT }, (_, i) => foundationId(i)),
    ...Array.from({ length: TABLEAU_COUNT }, (_, i) => tableauId(i)),
  ];
  return sources.some((from) => dests.some((to) => canMove(state, from, to)));
}

export function foundationTotal(state: FreeCellState): number {
  return state.foundations.reduce((n, f) => n + f.length, 0);
}
