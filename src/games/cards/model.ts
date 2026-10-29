import type { Rng } from '@/lib/utils/random';

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardColor = 'red' | 'black';

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

export type Rank = number;
export const ACE = 1;
export const KING = 13;

export interface Card {
  readonly id: number;
  readonly suit: Suit;
  readonly rank: Rank;
  readonly faceUp: boolean;
}

export const SUIT_SYMBOL: Readonly<Record<Suit, string>> = {
  spades: '♠︎',
  hearts: '♥︎',
  diamonds: '♦︎',
  clubs: '♣︎',
};

const RANK_LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
const RANK_NAMES = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'] as const;

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function suitColor(suit: Suit): CardColor {
  return isRedSuit(suit) ? 'red' : 'black';
}

export function cardColor(card: Pick<Card, 'suit'>): CardColor {
  return suitColor(card.suit);
}

export function rankLabel(rank: Rank): string {
  return RANK_LABELS[rank] ?? '?';
}

export function rankName(rank: Rank): string {
  return RANK_NAMES[rank] ?? 'Unknown';
}

export function cardName(card: Pick<Card, 'suit' | 'rank'>): string {
  return `${rankName(card.rank)} of ${card.suit}`;
}

export function cardCode(card: Pick<Card, 'suit' | 'rank'>): string {
  return `${rankLabel(card.rank)}${card.suit[0]!.toUpperCase()}`;
}

export function parseCardCode(code: string): { suit: Suit; rank: Rank } {
  const match = /^(10|[2-9TAJQK])([SHDC])$/i.exec(code.trim());
  if (!match) throw new Error(`Invalid card code: ${code}`);
  const r = match[1]!.toUpperCase();
  const rank = r === 'A' ? 1 : r === 'J' ? 11 : r === 'Q' ? 12 : r === 'K' ? 13 : r === 'T' ? 10 : Number(r);
  const s = match[2]!.toUpperCase();
  const suit: Suit = s === 'S' ? 'spades' : s === 'H' ? 'hearts' : s === 'D' ? 'diamonds' : 'clubs';
  return { suit, rank };
}

export function withFace(card: Card, faceUp: boolean): Card {
  return card.faceUp === faceUp ? card : { ...card, faceUp };
}

export interface DeckOptions {
  suits?: readonly Suit[];
  copies?: number;
}

export function createDeck(options: DeckOptions = {}): Card[] {
  const suits = options.suits ?? SUITS;
  const copies = options.copies ?? 1;
  const deck: Card[] = [];
  for (let c = 0; c < copies; c++) {
    for (const suit of suits) {
      for (let rank = ACE; rank <= KING; rank++) {
        deck.push({ id: deck.length, suit, rank, faceUp: false });
      }
    }
  }
  return deck;
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export function isAlternatingStep(prev: Card, next: Card): boolean {
  return next.rank === prev.rank - 1 && cardColor(next) !== cardColor(prev);
}

export function isAlternatingRun(cards: readonly Card[]): boolean {
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]!;
    if (!card.faceUp) return false;
    if (i > 0 && !isAlternatingStep(cards[i - 1]!, card)) return false;
  }
  return true;
}

export function isSameSuitRun(cards: readonly Card[]): boolean {
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]!;
    if (!card.faceUp) return false;
    if (i > 0) {
      const prev = cards[i - 1]!;
      if (card.suit !== prev.suit || card.rank !== prev.rank - 1) return false;
    }
  }
  return true;
}

export function top<T>(pile: readonly T[]): T | undefined {
  return pile[pile.length - 1];
}

export function flipTop(pile: readonly Card[]): readonly Card[] {
  const last = top(pile);
  if (!last || last.faceUp) return pile;
  return [...pile.slice(0, -1), withFace(last, true)];
}

export function faceDownCount(pile: readonly Card[]): number {
  let n = 0;
  while (n < pile.length && !pile[n]!.faceUp) n++;
  return n;
}

export function fitsFoundation(foundation: readonly Card[], card: Pick<Card, 'suit' | 'rank'>): boolean {
  const t = top(foundation);
  if (!t) return card.rank === ACE;
  return t.suit === card.suit && card.rank === t.rank + 1;
}

export function findFoundation(foundations: readonly (readonly Card[])[], card: Pick<Card, 'suit' | 'rank'>): number {
  for (let i = 0; i < foundations.length; i++) {
    const f = foundations[i]!;
    if (f.length > 0 && fitsFoundation(f, card)) return i;
  }
  if (card.rank === ACE) return foundations.findIndex((f) => f.length === 0);
  return -1;
}

export function foundationRank(foundations: readonly (readonly Card[])[], suit: Suit): number {
  for (const f of foundations) {
    const t = top(f);
    if (t && t.suit === suit) return t.rank;
  }
  return 0;
}
