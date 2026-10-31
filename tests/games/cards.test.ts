import { describe, expect, it } from 'vitest';
import { canUndo, createHistory, pushHistory, replacePresent, undoHistory } from '@/games/cards/history';
import {
  SUIT_SYMBOL,
  cardCode,
  cardColor,
  cardName,
  createDeck,
  faceDownCount,
  flipTop,
  isAlternatingRun,
  isSameSuitRun,
  parseCardCode,
  rankLabel,
  shuffle,
  type Card,
} from '@/games/cards/model';
import { bumpStats, formatWinStats, isStatsByVariant, loadStats, recordStat, statsFor } from '@/games/cards/stats';
import { createGameStorage } from '@/lib/storage/game-data';
import { createRng } from '@/lib/utils/random';
import { MemoryStore, ThrowingStore } from '../helpers';

let nextId = 1000;
function card(code: string, faceUp = true): Card {
  return { id: nextId++, ...parseCardCode(code), faceUp };
}

describe('deck', () => {
  it('builds a standard 52-card deck with unique ids, all face down', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((c) => c.id)).size).toBe(52);
    expect(new Set(deck.map(cardCode)).size).toBe(52);
    expect(deck.every((c) => !c.faceUp)).toBe(true);
  });

  it('builds multi-copy decks for Spider', () => {
    const oneSuit = createDeck({ suits: ['spades'], copies: 8 });
    expect(oneSuit).toHaveLength(104);
    expect(oneSuit.every((c) => c.suit === 'spades')).toBe(true);
    expect(new Set(oneSuit.map((c) => c.id)).size).toBe(104);
  });

  it('shuffles deterministically from a seed and keeps every card', () => {
    const deck = createDeck();
    const a = shuffle(deck, createRng(42));
    const b = shuffle(deck, createRng(42));
    const c = shuffle(deck, createRng(43));
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(a.map((x) => x.id)).not.toEqual(c.map((x) => x.id));
    expect([...a].sort((x, y) => x.id - y.id)).toEqual(deck);
    expect(deck.map((x) => x.id)).toEqual([...Array(52).keys()]);
  });
});

describe('card helpers', () => {
  it('names and labels cards', () => {
    expect(cardName(card('QH'))).toBe('Queen of hearts');
    expect(cardName(card('AS'))).toBe('Ace of spades');
    expect(rankLabel(10)).toBe('10');
    expect(cardCode(card('TD'))).toBe('10D');
    expect(cardColor(card('2D'))).toBe('red');
    expect(cardColor(card('2C'))).toBe('black');
  });

  it('uses text-presentation suit symbols', () => {
    for (const symbol of Object.values(SUIT_SYMBOL)) {
      expect(symbol.endsWith('︎')).toBe(true);
      expect(symbol).toHaveLength(2);
    }
  });

  it('rejects malformed card codes', () => {
    expect(() => parseCardCode('1H')).toThrow();
    expect(() => parseCardCode('QX')).toThrow();
  });

  it('detects alternating and same-suit runs', () => {
    expect(isAlternatingRun([card('9S'), card('8H'), card('7C')])).toBe(true);
    expect(isAlternatingRun([card('9S'), card('8C')])).toBe(false);
    expect(isAlternatingRun([card('9S'), card('7H')])).toBe(false);
    expect(isAlternatingRun([card('9S', false), card('8H')])).toBe(false);
    expect(isSameSuitRun([card('KS'), card('QS'), card('JS')])).toBe(true);
    expect(isSameSuitRun([card('KS'), card('QH')])).toBe(false);
    expect(isSameSuitRun([])).toBe(true);
  });

  it('flips only a face-down top card', () => {
    const pile = [card('2C', false), card('3D', false)];
    const flipped = flipTop(pile);
    expect(flipped[1]!.faceUp).toBe(true);
    expect(flipped[1]!.id).toBe(pile[1]!.id);
    expect(flipped[0]!.faceUp).toBe(false);
    expect(flipTop(flipped)).toBe(flipped);
    expect(faceDownCount(flipped)).toBe(1);
  });
});

describe('undo history', () => {
  it('pushes, replaces and undoes states', () => {
    let h = createHistory(1);
    expect(canUndo(h)).toBe(false);
    h = pushHistory(h, 2);
    h = pushHistory(h, 3);
    expect(h.present).toBe(3);
    h = replacePresent(h, 4);
    expect(h.past).toEqual([1, 2]);
    h = undoHistory(h);
    expect(h.present).toBe(2);
    h = undoHistory(undoHistory(h));
    expect(h.present).toBe(1);
    expect(undoHistory(h)).toBe(h);
  });

  it('caps the number of undo steps', () => {
    let h = createHistory(0);
    for (let i = 1; i <= 10; i++) h = pushHistory(h, i, 4);
    expect(h.past).toEqual([6, 7, 8, 9]);
  });
});

describe('win statistics', () => {
  it('counts played and won games per variant', () => {
    let s = bumpStats(null, 'draw-1', 'played');
    s = bumpStats(s, 'draw-1', 'won');
    s = bumpStats(s, 'draw-3', 'played');
    expect(statsFor(s, 'draw-1')).toEqual({ played: 1, won: 1 });
    expect(statsFor(s, 'draw-3')).toEqual({ played: 1, won: 0 });
    expect(formatWinStats({ played: 4, won: 1 })).toBe('Played 4 · Won 1 (25%)');
  });

  it('persists through game storage and rejects corrupt data', () => {
    const store = new MemoryStore();
    const storage = createGameStorage('solitaire', store);
    recordStat(storage, 'draw-1', 'played');
    expect(recordStat(storage, 'draw-1', 'won')).toEqual({ played: 1, won: 1 });
    expect(loadStats(storage)).toEqual({ 'draw-1': { played: 1, won: 1 } });
    expect(isStatsByVariant({ a: { played: 1, won: 2 } })).toBe(false);
    expect(isStatsByVariant({ a: { played: -1, won: 0 } })).toBe(false);
    store.setItem('pixelrush:v1:game:solitaire:stats', '{"x":"bad"}');
    expect(loadStats(storage)).toEqual({});
    const blocked = createGameStorage('solitaire', new ThrowingStore());
    expect(recordStat(blocked, 'draw-1', 'played')).toEqual({ played: 1, won: 0 });
  });
});
