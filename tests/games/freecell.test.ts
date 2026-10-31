import { describe, expect, it } from 'vitest';
import { cardCode, parseCardCode, type Card } from '@/games/cards/model';
import {
  applyMove,
  autoMoveSafe,
  autoMoveTarget,
  canMove,
  canPick,
  dealFreeCell,
  foundationTotal,
  hasLegalMove,
  isSafeForFoundation,
  isWon,
  maxMovable,
  moveError,
  numberedDealOrder,
  type FreeCellState,
} from '@/games/freecell/rules';

let nextId = 0;
const c = (code: string): Card => ({ id: nextId++, ...parseCardCode(code), faceUp: true });
const cards = (codes: string) => (codes.trim() ? codes.trim().split(/\s+/).map(c) : []);
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const run = (suit: string, toRank: number) => RANKS.slice(0, toRank).map((r) => c(`${r}${suit}`));

function state(partial: Partial<FreeCellState>): FreeCellState {
  return {
    tableau: Array.from({ length: 8 }, () => []),
    cells: [null, null, null, null],
    foundations: [[], [], [], []],
    moves: 0,
    deal: 1,
    ...partial,
  };
}
const cols = (...columns: string[]) => [...columns.map(cards), ...Array.from({ length: 8 - columns.length }, () => [] as Card[])];

describe('numbered deals', () => {
  it('reproduces the classic deal #1', () => {
    const s = dealFreeCell(1);
    const firstRow = s.tableau.map((col) => cardCode(col[0]!));
    expect(firstRow).toEqual(['JD', '2D', '9H', 'JC', '5D', '7H', '7C', '5H']);
    const lastRow = s.tableau.slice(0, 4).map((col) => cardCode(col[6]!));
    expect(lastRow).toEqual(['6S', '9C', '2H', '6H']);
  });

  it('reproduces the classic deal #617', () => {
    const order = numberedDealOrder(617).map(cardCode);
    expect(order.slice(0, 8)).toEqual(['7D', 'AD', '5C', '3S', '5S', '8C', '2D', 'AH']);
    expect(order.slice(48)).toEqual(['JD', 'KS', 'KC', '4H']);
  });

  it('deals 52 distinct face-up cards in columns of 7,7,7,7,6,6,6,6', () => {
    const s = dealFreeCell(11982);
    expect(s.tableau.map((col) => col.length)).toEqual([7, 7, 7, 7, 6, 6, 6, 6]);
    const all = s.tableau.flat();
    expect(new Set(all.map(cardCode)).size).toBe(52);
    expect(all.every((x) => x.faceUp)).toBe(true);
    expect(s.cells.every((x) => x === null)).toBe(true);
    expect(dealFreeCell(11982)).toEqual(s);
  });
});

describe('supermove capacity', () => {
  it('is (1 + empty cells) x 2^(empty columns)', () => {
    expect(maxMovable(state({ tableau: cols('KS', 'KH', 'KD', 'KC', 'QS', 'QH', 'QD', 'QC') }), false)).toBe(5);
    const oneCellUsed = state({ tableau: cols('KS', 'KH', 'KD', 'KC', 'QS', 'QH', 'QD', 'QC'), cells: [c('2S'), null, null, null] });
    expect(maxMovable(oneCellUsed, false)).toBe(4);
    const twoEmptyCols = state({ tableau: cols('KS', 'KH', 'KD', 'KC', 'QS', 'QH'), cells: [c('2S'), c('3S'), null, null] });
    expect(maxMovable(twoEmptyCols, false)).toBe(12);
  });

  it('halves the empty-column factor when the destination is an empty column', () => {
    const twoEmptyCols = state({ tableau: cols('KS', 'KH', 'KD', 'KC', 'QS', 'QH'), cells: [c('2S'), c('3S'), null, null] });
    expect(maxMovable(twoEmptyCols, true)).toBe(6);
    const oneEmpty = state({ tableau: cols('KS', 'KH', 'KD', 'KC', 'QS', 'QH', 'QD'), cells: [c('2S'), c('3S'), c('4S'), c('5S')] });
    expect(maxMovable(oneEmpty, true)).toBe(1);
    expect(maxMovable(oneEmpty, false)).toBe(2);
  });

  it('allows a sequence only as long as the capacity', () => {
    const full = state({
      tableau: cols('9S 8H 7C', '10D', '2C', '3C', '4C', '5C', '6C', '7S'),
      cells: [c('KS'), c('KH'), c('KD'), c('KC')],
    });
    expect(canPick(full, 't0', 0)).toBe(true);
    expect(canMove(full, { pile: 't0', index: 0 }, 't1')).toBe(false);
    expect(moveError(full, { pile: 't0', index: 0 }, 't1')).toMatch(/at most 1 card/);
    const roomy = { ...full, cells: [c('KS'), c('KH'), null, null] };
    const moved = applyMove(roomy, { pile: 't0', index: 0 }, 't1')!;
    expect(moved.tableau[1]!.map(cardCode)).toEqual(['10D', '9S', '8H', '7C']);
    expect(moved.moves).toBe(1);
  });
});

describe('legality', () => {
  it('requires alternating colours and descending ranks', () => {
    const s = state({ tableau: cols('9S', '8H', '8C', '7H') });
    expect(canMove(s, { pile: 't1', index: 0 }, 't0')).toBe(true);
    expect(canMove(s, { pile: 't2', index: 0 }, 't0')).toBe(false);
    expect(canMove(s, { pile: 't3', index: 0 }, 't0')).toBe(false);
    expect(canPick(state({ tableau: cols('9S 8S') }), 't0', 0)).toBe(false);
  });

  it('lets any card or valid run go to an empty column', () => {
    const s = state({ tableau: cols('5D', '9C 8D') });
    expect(canMove(s, { pile: 't0', index: 0 }, 't2')).toBe(true);
    expect(canMove(s, { pile: 't1', index: 0 }, 't2')).toBe(true);
  });

  it('uses free cells for single cards only', () => {
    const s = state({ tableau: cols('9C 8D'), cells: [c('KS'), null, null, null] });
    expect(canMove(s, { pile: 't0', index: 1 }, 'c1')).toBe(true);
    expect(canMove(s, { pile: 't0', index: 1 }, 'c0')).toBe(false);
    expect(canMove(s, { pile: 't0', index: 0 }, 'c1')).toBe(false);
    const parked = applyMove(s, { pile: 't0', index: 1 }, 'c1')!;
    expect(parked.cells[1] && cardCode(parked.cells[1])).toBe('8D');
    expect(canMove(parked, { pile: 'c1', index: 0 }, 't0')).toBe(true);
  });

  it('builds foundations up by suit and never takes cards back', () => {
    const s = state({ tableau: cols('AH', '2H', '2S'), foundations: [[], [], [], []] });
    const a = applyMove(s, { pile: 't0', index: 0 }, 'f2')!;
    expect(canMove(a, { pile: 't2', index: 0 }, 'f2')).toBe(false);
    expect(canMove(a, { pile: 't1', index: 0 }, 'f2')).toBe(true);
    expect(canPick(a, 'f2', 0)).toBe(false);
  });

  it('finds double-click targets: foundation first, then a free cell', () => {
    const s = state({ tableau: cols('AS', '7D'), cells: [c('KS'), null, null, null] });
    expect(autoMoveTarget(s, { pile: 't0', index: 0 })).toBe('f0');
    expect(autoMoveTarget(s, { pile: 't1', index: 0 })).toBe('c1');
    expect(autoMoveTarget(s, { pile: 'c0', index: 0 })).toBeNull();
  });
});

describe('safe automatic moves', () => {
  it('always moves aces and twos', () => {
    const s = state({ tableau: cols('KS AH', '2H'), foundations: [[], [], [], []] });
    const { state: after, moved } = autoMoveSafe(s);
    expect(moved.map((m) => cardCode(m.card))).toEqual(['AH', '2H']);
    expect(foundationTotal(after)).toBe(2);
    expect(after.moves).toBe(0);
  });

  it('holds back a card that an opposite-colour card might still need', () => {
    const s = state({ tableau: cols('3H', '2S'), foundations: [run('H', 2), run('S', 1), run('C', 2), []] });
    expect(isSafeForFoundation(s, s.tableau[0]![0]!)).toBe(false);
    const safe = state({ tableau: cols('3H'), foundations: [run('H', 2), run('S', 2), run('C', 2), []] });
    expect(isSafeForFoundation(safe, safe.tableau[0]![0]!)).toBe(true);
    expect(isSafeForFoundation(safe, c('5H'))).toBe(false);
  });

  it('moves from free cells and chains several moves', () => {
    const s = state({
      tableau: cols('3S', '3C'),
      cells: [c('3H'), c('3D'), null, null],
      foundations: [run('H', 2), run('D', 2), run('S', 2), run('C', 2)],
    });
    const { state: after, moved } = autoMoveSafe(s);
    expect(moved).toHaveLength(4);
    expect(after.cells.every((x) => x === null)).toBe(true);
  });
});

describe('winning and being stuck', () => {
  it('detects a win', () => {
    const won = state({ foundations: [run('S', 13), run('H', 13), run('D', 13), run('C', 13)] });
    expect(isWon(won)).toBe(true);
    expect(isWon(state({ foundations: [run('S', 13), run('H', 13), run('D', 13), run('C', 12)], tableau: cols('KC') }))).toBe(false);
  });

  it('auto-moves the last cards to win', () => {
    const s = state({ tableau: cols('KC', 'QC'), foundations: [run('S', 13), run('H', 13), run('D', 13), run('C', 11)] });
    const { state: after } = autoMoveSafe(s);
    expect(isWon(after)).toBe(true);
  });

  it('knows when no legal move is left', () => {
    const stuck = state({
      tableau: cols('2C', '2S', '4H', '4D', '6C', '6S', '8H', '8D'),
      cells: [c('KS'), c('KH'), c('KD'), c('KC')],
      foundations: [[], [], [], []],
    });
    expect(hasLegalMove(stuck)).toBe(false);
    expect(hasLegalMove({ ...stuck, cells: [c('KS'), c('KH'), c('KD'), null] })).toBe(true);
    expect(hasLegalMove(dealFreeCell(1))).toBe(true);
  });
});
