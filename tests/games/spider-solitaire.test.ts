import { describe, expect, it } from 'vitest';
import { parseCardCode, type Card } from '@/games/cards/model';
import {
  applyMove,
  bestDestination,
  canMove,
  canPick,
  dealBlockedReason,
  dealRow,
  dealSpider,
  dealsLeft,
  hasAnyMove,
  isWon,
  movableRunStart,
  moveError,
  score,
  spiderDeck,
  undoTo,
  type SpiderState,
} from '@/games/spider-solitaire/rules';

let nextId = 0;
const c = (code: string, faceUp = true): Card => ({ id: nextId++, ...parseCardCode(code), faceUp });
const cards = (codes: string, faceUp = true) => (codes.trim() ? codes.trim().split(/\s+/).map((x) => c(x, faceUp)) : []);
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const kingDown = (suit: string, lowRank: number) => RANKS.slice(lowRank - 1).reverse().map((r) => c(`${r}${suit}`));

function state(partial: Partial<SpiderState>): SpiderState {
  return {
    tableau: Array.from({ length: 10 }, () => cards('KD')),
    stock: [],
    completed: [],
    suitCount: 4,
    moves: 0,
    ...partial,
  };
}
const withColumns = (base: SpiderState, columns: Record<number, Card[]>) => ({
  ...base,
  tableau: base.tableau.map((col, i) => columns[i] ?? col),
});

describe('deal', () => {
  it.each([
    [1, ['spades']],
    [2, ['hearts', 'spades']],
    [4, ['clubs', 'diamonds', 'hearts', 'spades']],
  ] as const)('uses 104 cards made from %i suit(s)', (count, suits) => {
    const deck = spiderDeck(count);
    expect(deck).toHaveLength(104);
    expect([...new Set(deck.map((x) => x.suit))].sort()).toEqual(suits);
    for (const s of suits) expect(deck.filter((x) => x.suit === s && x.rank === 13)).toHaveLength(8 / suits.length);
  });

  it('deals 6,6,6,6,5,5,5,5,5,5 with the top card face up and 50 cards in the stock', () => {
    const s = dealSpider(99, 2);
    expect(s.tableau.map((col) => col.length)).toEqual([6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
    for (const col of s.tableau) {
      expect(col[col.length - 1]!.faceUp).toBe(true);
      expect(col.slice(0, -1).every((x) => !x.faceUp)).toBe(true);
    }
    expect(s.stock).toHaveLength(50);
    expect(dealsLeft(s)).toBe(5);
    expect(new Set([...s.stock, ...s.tableau.flat()].map((x) => x.id)).size).toBe(104);
    expect(score(s)).toBe(500);
    expect(dealSpider(99, 2)).toEqual(s);
  });

  it('deals a row of ten face-up cards, five times', () => {
    let s: SpiderState | null = dealSpider(5, 1);
    for (let d = 0; d < 5; d++) {
      const before = s!;
      s = dealRow(before);
      expect(s).not.toBeNull();
      expect(s!.tableau.every((col, i) => col.length >= before.tableau[i]!.length + 1 - 13)).toBe(true);
      expect(s!.tableau.every((col) => col.length === 0 || col[col.length - 1]!.faceUp)).toBe(true);
    }
    expect(s!.stock).toHaveLength(0);
    expect(dealRow(s!)).toBeNull();
    expect(dealBlockedReason(s!)).toBe('There are no more cards to deal.');
  });

  it('refuses to deal while a column is empty', () => {
    const s = state({ stock: cards('2S 3S 4S 5S 6S 7S 8S 9S 10S JS', false) });
    expect(dealRow(s)).not.toBeNull();
    const gap = withColumns(s, { 4: [] });
    expect(dealRow(gap)).toBeNull();
    expect(dealBlockedReason(gap)).toMatch(/empty column/);
  });
});

describe('moving cards', () => {
  it('detects the movable run at the bottom of a column', () => {
    expect(movableRunStart(cards('9H 8S 7S 6S'))).toBe(1);
    expect(movableRunStart([c('7S', false), ...cards('6S 5S')])).toBe(1);
    expect(movableRunStart(cards('5D'))).toBe(0);
    expect(movableRunStart([])).toBe(-1);
    const s = withColumns(state({}), { 0: cards('9H 8S 7S 6S') });
    expect(canPick(s, 't0', 1)).toBe(true);
    expect(canPick(s, 't0', 0)).toBe(false);
    expect(canPick(s, 't0', 3)).toBe(true);
  });

  it('places any card on a card one rank higher, regardless of suit', () => {
    const s = withColumns(state({}), { 0: cards('7S 6S'), 1: cards('8H'), 2: cards('8S'), 3: cards('9C') });
    expect(canMove(s, { pile: 't0', index: 0 }, 't1')).toBe(true);
    expect(canMove(s, { pile: 't0', index: 0 }, 't2')).toBe(true);
    expect(canMove(s, { pile: 't0', index: 0 }, 't3')).toBe(false);
    expect(moveError(s, { pile: 't0', index: 0 }, 't3')).toMatch(/eight/);
    const moved = applyMove(s, { pile: 't0', index: 0 }, 't1')!;
    expect(moved.tableau[1]!.map((x) => x.rank)).toEqual([8, 7, 6]);
    expect(moved.tableau[0]).toHaveLength(0);
    expect(moved.moves).toBe(1);
    expect(score(moved)).toBe(499);
  });

  it('accepts any card or run in an empty column and turns over exposed cards', () => {
    const s = withColumns(state({}), { 0: [c('QD', false), ...cards('5C 4C')], 1: [] });
    const moved = applyMove(s, { pile: 't0', index: 1 }, 't1')!;
    expect(moved.tableau[1]!.map((x) => x.rank)).toEqual([5, 4]);
    expect(moved.tableau[0]![0]!.faceUp).toBe(true);
  });

  it('suggests the best double-click destination', () => {
    const s = withColumns(state({}), { 0: cards('5H 4S'), 1: cards('5D'), 2: cards('5S'), 3: [] });
    expect(bestDestination(s, { pile: 't0', index: 1 })).toBe('t2');
    const noSame = withColumns(s, { 2: cards('9C') });
    expect(bestDestination(noSame, { pile: 't0', index: 1 })).toBe('t1');
    const onlyEmpty = withColumns(noSame, { 1: cards('9C') });
    expect(bestDestination(onlyEmpty, { pile: 't0', index: 1 })).toBe('t3');
    expect(bestDestination(onlyEmpty, { pile: 't0', index: 0 })).toBeNull();
  });
});

describe('completed runs', () => {
  it('removes a full King-to-Ace run of one suit and scores 100', () => {
    const s = withColumns(state({}), { 0: [c('3D', false), ...kingDown('S', 2)], 1: cards('AS') });
    const moved = applyMove(s, { pile: 't1', index: 0 }, 't0')!;
    expect(moved.completed).toHaveLength(1);
    expect(moved.completed[0]!.map((x) => x.rank)).toEqual([13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(moved.tableau[0]!.map((x) => x.faceUp)).toEqual([true]);
    expect(score(moved)).toBe(500 - 1 + 100);
  });

  it('does not remove a run of mixed suits', () => {
    const mixed = [...kingDown('S', 3), c('2H')];
    const s = withColumns(state({}), { 0: mixed, 1: cards('AS') });
    const moved = applyMove(s, { pile: 't1', index: 0 }, 't0')!;
    expect(moved.completed).toHaveLength(0);
    expect(moved.tableau[0]).toHaveLength(13);
  });

  it('collects runs completed by a deal', () => {
    const s = withColumns(state({}), { 0: kingDown('S', 2) });
    const stock = [...cards('2D 3D 4D 5D 6D 7D 8D 9D 10D', false), c('AS', false)].reverse();
    const dealt = dealRow({ ...s, stock })!;
    expect(dealt.completed).toHaveLength(1);
    expect(dealt.tableau[0]).toHaveLength(0);
  });

  it('wins with eight completed runs', () => {
    const seven = Array.from({ length: 7 }, () => kingDown('S', 1));
    const s = withColumns(state({ completed: seven }), { 0: kingDown('S', 2), 1: cards('AS') });
    expect(isWon(s)).toBe(false);
    const won = applyMove(s, { pile: 't1', index: 0 }, 't0')!;
    expect(isWon(won)).toBe(true);
    expect(score(won)).toBe(500 - 1 + 800);
  });
});

describe('undo and stalemate', () => {
  it('restores the position but still costs a point', () => {
    const s0 = withColumns(state({}), { 0: cards('7S'), 1: cards('8H') });
    const s1 = applyMove(s0, { pile: 't0', index: 0 }, 't1')!;
    const back = undoTo(s0, s1);
    expect(back.tableau).toBe(s0.tableau);
    expect(back.moves).toBe(2);
    expect(score(back)).toBe(498);
  });

  it('knows when nothing can be moved or dealt', () => {
    const stuck = state({ tableau: Array.from({ length: 10 }, () => cards('KD')) });
    expect(hasAnyMove(stuck)).toBe(false);
    expect(hasAnyMove({ ...stuck, stock: cards('2S 3S 4S 5S 6S 7S 8S 9S 10S JS', false) })).toBe(true);
    expect(hasAnyMove(withColumns(stuck, { 0: cards('QS') }))).toBe(true);
  });
});
