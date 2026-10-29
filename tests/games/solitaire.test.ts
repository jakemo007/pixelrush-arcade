import { describe, expect, it } from 'vitest';
import { createDeck, parseCardCode, type Card } from '@/games/cards/model';
import {
  applyMove,
  autoCompleteMoves,
  autoMoveTarget,
  canAutoComplete,
  canMove,
  canPick,
  dealKlondike,
  drawFromStock,
  foundationTotal,
  hiddenCount,
  isWon,
  moveError,
  nextAutoCompleteMove,
  type KlondikeState,
} from '@/games/solitaire/rules';

let nextId = 0;
function c(code: string, faceUp = true): Card {
  return { id: nextId++, ...parseCardCode(code), faceUp };
}
const cards = (codes: string, faceUp = true) => (codes.trim() ? codes.trim().split(/\s+/).map((x) => c(x, faceUp)) : []);

function state(partial: Partial<KlondikeState>): KlondikeState {
  return {
    tableau: Array.from({ length: 7 }, () => []),
    foundations: Array.from({ length: 4 }, () => []),
    stock: [],
    waste: [],
    drawCount: 1,
    moves: 0,
    recycles: 0,
    ...partial,
  };
}

function run(suit: string, toRank: number): Card[] {
  const labels = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  return labels.slice(0, toRank).map((r) => c(`${r}${suit}`));
}

describe('deal', () => {
  const s = dealKlondike(12345);

  it('deals 28 tableau cards in columns of 1 to 7 with only the top card face up', () => {
    expect(s.tableau.map((col) => col.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const col of s.tableau) {
      expect(col[col.length - 1]!.faceUp).toBe(true);
      expect(col.slice(0, -1).every((x) => !x.faceUp)).toBe(true);
    }
    expect(hiddenCount(s)).toBe(21);
  });

  it('puts the other 24 cards face down in the stock and uses every card once', () => {
    expect(s.stock).toHaveLength(24);
    expect(s.stock.every((x) => !x.faceUp)).toBe(true);
    expect(s.waste).toHaveLength(0);
    const ids = [...s.stock, ...s.tableau.flat()].map((x) => x.id);
    expect(new Set(ids).size).toBe(52);
    expect(s.foundations.every((f) => f.length === 0)).toBe(true);
    expect(s.moves).toBe(0);
  });

  it('is deterministic for a seed', () => {
    expect(dealKlondike(12345)).toEqual(s);
    expect(dealKlondike(54321).stock.map((x) => x.id)).not.toEqual(s.stock.map((x) => x.id));
  });

  it('builds a complete deck', () => {
    expect(createDeck()).toHaveLength(52);
  });
});

describe('tableau rules', () => {
  it('builds down in alternating colours', () => {
    const s = state({ tableau: [cards('9S'), cards('8H'), cards('8C'), cards('7D'), [], [], []] });
    expect(canMove(s, { pile: 't1', index: 0 }, 't0')).toBe(true);
    expect(canMove(s, { pile: 't2', index: 0 }, 't0')).toBe(false);
    expect(canMove(s, { pile: 't3', index: 0 }, 't0')).toBe(false);
    expect(moveError(s, { pile: 't2', index: 0 }, 't0')).toMatch(/alternating colours/);
  });

  it('only allows a King (or a King-led run) into an empty column', () => {
    const s = state({ tableau: [cards('KH QS JD'), cards('QC'), [], [], [], [], []] });
    expect(canMove(s, { pile: 't0', index: 0 }, 't2')).toBe(true);
    expect(canMove(s, { pile: 't0', index: 1 }, 't2')).toBe(false);
    expect(canMove(s, { pile: 't1', index: 0 }, 't2')).toBe(false);
    expect(moveError(s, { pile: 't1', index: 0 }, 't2')).toBe('Only a King can go to an empty column.');
  });

  it('moves any valid face-up sequence and rejects broken sequences', () => {
    const s = state({ tableau: [[c('2S', false), ...cards('10H 9C 8D')], cards('JS'), cards('9H 8S'), [], [], [], []] });
    expect(canPick(s, 't0', 0)).toBe(false);
    expect(canPick(s, 't0', 1)).toBe(true);
    const moved = applyMove(s, { pile: 't0', index: 1 }, 't1')!;
    expect(moved.tableau[1]!.map((x) => x.rank)).toEqual([11, 10, 9, 8]);
    expect(moved.moves).toBe(1);
    expect(canMove(s, { pile: 't2', index: 0 }, 't0')).toBe(false);
  });

  it('turns over a hidden card when it is exposed', () => {
    const s = state({ tableau: [[c('4D', false), c('3C')], cards('4H'), [], [], [], [], []] });
    const moved = applyMove(s, { pile: 't0', index: 1 }, 't1')!;
    expect(moved.tableau[0]).toHaveLength(1);
    expect(moved.tableau[0]![0]!.faceUp).toBe(true);
    expect(s.tableau[0]![0]!.faceUp).toBe(false);
  });

  it('rejects moves onto the same pile, the stock or the waste', () => {
    const s = state({ tableau: [cards('5D'), [], [], [], [], [], []] });
    expect(canMove(s, { pile: 't0', index: 0 }, 't0')).toBe(false);
    expect(canMove(s, { pile: 't0', index: 0 }, 'stock')).toBe(false);
    expect(canMove(s, { pile: 't0', index: 0 }, 'waste')).toBe(false);
    expect(applyMove(s, { pile: 't0', index: 0 }, 'waste')).toBeNull();
  });
});

describe('foundation rules', () => {
  it('starts with an Ace and builds up by suit', () => {
    const s = state({ tableau: [cards('AH'), cards('2H'), cards('2S'), cards('3H'), [], [], []] });
    expect(canMove(s, { pile: 't1', index: 0 }, 'f0')).toBe(false);
    const a = applyMove(s, { pile: 't0', index: 0 }, 'f0')!;
    expect(canMove(a, { pile: 't2', index: 0 }, 'f0')).toBe(false);
    expect(canMove(a, { pile: 't3', index: 0 }, 'f0')).toBe(false);
    const b = applyMove(a, { pile: 't1', index: 0 }, 'f0')!;
    expect(b.foundations[0]!.map((x) => x.rank)).toEqual([1, 2]);
    expect(moveError(b, { pile: 't2', index: 0 }, 'f0')).toMatch(/Three of hearts/);
  });

  it('accepts only one card at a time', () => {
    const s = state({ tableau: [cards('2C AH'), [], [], [], [], [], []], foundations: [cards('AC'), [], [], []] });
    expect(canMove(s, { pile: 't0', index: 0 }, 'f0')).toBe(false);
  });

  it('lets the top foundation card move back to the tableau', () => {
    const s = state({ tableau: [cards('8S'), [], [], [], [], [], []], foundations: [run('H', 7), [], [], []] });
    expect(canPick(s, 'f0', 6)).toBe(true);
    expect(canPick(s, 'f0', 5)).toBe(false);
    const back = applyMove(s, { pile: 'f0', index: 6 }, 't0')!;
    expect(back.tableau[0]!.map((x) => x.rank)).toEqual([8, 7]);
    expect(back.foundations[0]).toHaveLength(6);
  });

  it('finds the double-click target for top cards only', () => {
    const s = state({ tableau: [cards('AS'), cards('AD 5C'), [], [], [], [], []], waste: cards('AH') });
    expect(autoMoveTarget(s, { pile: 't0', index: 0 })).toBe('f0');
    expect(autoMoveTarget(s, { pile: 't1', index: 0 })).toBeNull();
    expect(autoMoveTarget(s, { pile: 'waste', index: 0 })).toBe('f0');
    expect(autoMoveTarget(s, { pile: 't1', index: 1 })).toBeNull();
  });
});

describe('stock and waste', () => {
  it('draws one card at a time face up and recycles the waste when the stock is empty', () => {
    const s = state({ stock: cards('2C 3C 4C', false) });
    const a = drawFromStock(s)!;
    expect(a.waste.map((x) => x.rank)).toEqual([4]);
    expect(a.waste[0]!.faceUp).toBe(true);
    const b = drawFromStock(drawFromStock(a)!)!;
    expect(b.stock).toHaveLength(0);
    expect(b.waste.map((x) => x.rank)).toEqual([4, 3, 2]);
    const recycled = drawFromStock(b)!;
    expect(recycled.waste).toHaveLength(0);
    expect(recycled.stock.map((x) => x.rank)).toEqual([2, 3, 4]);
    expect(recycled.stock.every((x) => !x.faceUp)).toBe(true);
    expect(recycled.recycles).toBe(1);
    expect(drawFromStock(recycled)!.waste.map((x) => x.rank)).toEqual([4]);
    expect(recycled.moves).toBe(4);
    expect(drawFromStock(state({}))).toBeNull();
  });

  it('draws three at a time in draw-three mode, with the third card on top', () => {
    const s = state({ drawCount: 3, stock: cards('2C 3C 4C 5C', false) });
    const a = drawFromStock(s)!;
    expect(a.waste.map((x) => x.rank)).toEqual([5, 4, 3]);
    expect(canPick(a, 'waste', 2)).toBe(true);
    expect(canPick(a, 'waste', 1)).toBe(false);
    const b = drawFromStock(a)!;
    expect(b.waste.map((x) => x.rank)).toEqual([5, 4, 3, 2]);
    const recycled = drawFromStock(b)!;
    expect(recycled.stock).toHaveLength(4);
    expect(drawFromStock(recycled)!.waste.map((x) => x.rank)).toEqual([5, 4, 3]);
  });

  it('plays the waste top card', () => {
    const s = state({ waste: cards('9D 6H'), tableau: [cards('7S'), [], [], [], [], [], []] });
    const moved = applyMove(s, { pile: 'waste', index: 1 }, 't0')!;
    expect(moved.waste.map((x) => x.rank)).toEqual([9]);
    expect(canPick(s, 'waste', 0)).toBe(false);
  });
});

describe('undo', () => {
  it('restores the exact previous state because states are immutable', async () => {
    const { createHistory, pushHistory, undoHistory } = await import('@/games/cards/history');
    const s0 = dealKlondike(7);
    let h = createHistory(s0);
    h = pushHistory(h, drawFromStock(h.present)!);
    expect(h.present.waste).toHaveLength(1);
    h = undoHistory(h);
    expect(h.present).toBe(s0);
    expect(h.present.stock).toHaveLength(24);
    expect(h.present.waste).toHaveLength(0);
  });
});

describe('winning and auto-complete', () => {
  it('detects a win when all 52 cards are on the foundations', () => {
    const won = state({ foundations: [run('S', 13), run('H', 13), run('D', 13), run('C', 13)] });
    expect(isWon(won)).toBe(true);
    expect(canAutoComplete(won)).toBe(false);
    const almost = state({ foundations: [run('S', 13), run('H', 13), run('D', 13), run('C', 12)], tableau: [cards('KC'), [], [], [], [], [], []] });
    expect(isWon(almost)).toBe(false);
    expect(isWon(applyMove(almost, { pile: 't0', index: 0 }, 'f3')!)).toBe(true);
  });

  it('is offered only when the stock and waste are empty and every card is face up', () => {
    const base = {
      foundations: [run('S', 10), run('H', 10), run('D', 10), run('C', 10)],
      tableau: [cards('KS QH JC'), cards('KD QC JH'), cards('KH QS'), cards('KC QD JS'), cards('JD'), [], []],
    };
    expect(canAutoComplete(state(base))).toBe(true);
    expect(canAutoComplete(state({ ...base, waste: cards('2S') }))).toBe(false);
    expect(canAutoComplete(state({ ...base, stock: cards('2S', false) }))).toBe(false);
    const hidden = state({ ...base, tableau: [[c('KS', false), ...cards('QH JC')], ...base.tableau.slice(1)] });
    expect(canAutoComplete(hidden)).toBe(false);
  });

  it('auto-completes to a win by always playing the lowest card', () => {
    const s = state({
      foundations: [run('S', 6), run('H', 4), run('D', 5), run('C', 3)],
      tableau: [
        cards('KS QH JS 10H 9S 8H 7S 6D'),
        cards('KH QS JH 10S 9H 8S 7H'),
        cards('KD QC JD 10C 9D 8C 7D'),
        cards('KC QD JC 10D 9C 8D 7C 6H 5C'),
        cards('6C 5H'),
        cards('4C'),
        [],
      ],
    });
    expect(foundationTotal(s)).toBe(18);
    expect(canAutoComplete(s)).toBe(true);
    expect(nextAutoCompleteMove(s)).toEqual({ from: { pile: 't5', index: 0 }, to: 'f3' });
    const moves = autoCompleteMoves(s);
    expect(moves).toHaveLength(34);
    let cur: KlondikeState = s;
    for (const m of moves) cur = applyMove(cur, m.from, m.to)!;
    expect(isWon(cur)).toBe(true);
  });
});
