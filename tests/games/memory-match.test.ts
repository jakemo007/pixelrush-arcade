import { describe, expect, it } from 'vitest';
import { meta } from '@/games/memory-match/meta';
import {
  BOARD_SIZES,
  boardSizeFor,
  closeOpen,
  createDeck,
  flip,
  isComplete,
  isFaceUp,
  newGame,
  shuffle,
  type MemoryState,
} from '@/games/memory-match/rules';
import { SYMBOLS } from '@/games/memory-match/symbols';
import { createRng } from '@/lib/utils/random';

function partnerOf(state: MemoryState, index: number): number {
  return state.cards.findIndex((c, i) => i !== index && c.symbol === state.cards[index]!.symbol);
}

function strangerOf(state: MemoryState, index: number): number {
  return state.cards.findIndex((c, i) => !state.matched[i] && c.symbol !== state.cards[index]!.symbol);
}

describe('Memory Match boards and symbols', () => {
  it('offers 4x4 with 8 pairs and 6x6 with 18 pairs', () => {
    expect(BOARD_SIZES['4x4']).toEqual({ rows: 4, cols: 4, pairs: 8 });
    expect(BOARD_SIZES['6x6']).toEqual({ rows: 6, cols: 6, pairs: 18 });
    expect(meta.variants?.map((v) => v.id)).toEqual(['4x4', '6x6']);
    expect(boardSizeFor('unknown')).toEqual(BOARD_SIZES['4x4']);
  });

  it('has 18 distinct symbols with distinct shapes and names', () => {
    expect(SYMBOLS).toHaveLength(18);
    expect(new Set(SYMBOLS.map((s) => s.key)).size).toBe(18);
    expect(new Set(SYMBOLS.map((s) => s.name)).size).toBe(18);
    const shapes = SYMBOLS.map((s) => s.name.split(' ').slice(-1)[0]);
    expect(new Set(shapes).size).toBe(18);
  });
});

describe('Memory Match deck', () => {
  it('contains each chosen symbol exactly twice', () => {
    for (const pairs of [8, 18]) {
      for (let seed = 1; seed <= 20; seed++) {
        const deck = createDeck(pairs, createRng(seed));
        expect(deck).toHaveLength(pairs * 2);
        const counts = new Map<number, number>();
        for (const card of deck) counts.set(card.symbol, (counts.get(card.symbol) ?? 0) + 1);
        expect(counts.size).toBe(pairs);
        for (const n of counts.values()) expect(n).toBe(2);
        expect(new Set(deck.map((c) => c.id)).size).toBe(deck.length);
      }
    }
  });

  it('shuffles deterministically for a seed and differently across seeds', () => {
    const a = createDeck(18, createRng(42)).map((c) => c.symbol);
    const b = createDeck(18, createRng(42)).map((c) => c.symbol);
    const c = createDeck(18, createRng(43)).map((c2) => c2.symbol);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('shuffle keeps every item', () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    expect([...shuffle(items, createRng(1))].sort((x, y) => x - y)).toEqual(items);
  });

  it('rejects impossible pair counts', () => {
    expect(() => createDeck(0, createRng(1))).toThrow();
    expect(() => createDeck(19, createRng(1))).toThrow();
  });
});

describe('Memory Match moves', () => {
  it('turns over a first card without counting a move', () => {
    const s0 = newGame(8, createRng(3));
    const { state, event } = flip(s0, 0);
    expect(event).toBe('first');
    expect(state.open).toEqual([0]);
    expect(state.moves).toBe(0);
    expect(isFaceUp(state, 0)).toBe(true);
  });

  it('keeps a matching pair face up and counts one move', () => {
    const s0 = newGame(8, createRng(3));
    const partner = partnerOf(s0, 0);
    const s1 = flip(s0, 0).state;
    const { state, event } = flip(s1, partner);
    expect(event).toBe('match');
    expect(state.moves).toBe(1);
    expect(state.pairsFound).toBe(1);
    expect(state.matched[0]).toBe(true);
    expect(state.matched[partner]).toBe(true);
    expect(state.open).toEqual([]);
  });

  it('leaves a mismatch showing until it is closed, and counts it as a move', () => {
    const s0 = newGame(8, createRng(3));
    const other = strangerOf(s0, 0);
    const s1 = flip(flip(s0, 0).state, other);
    expect(s1.event).toBe('mismatch');
    expect(s1.state.moves).toBe(1);
    expect(s1.state.open).toEqual([0, other]);
    const closed = closeOpen(s1.state);
    expect(closed.open).toEqual([]);
    expect(isFaceUp(closed, 0)).toBe(false);
    expect(closed.moves).toBe(1);
  });

  it('a third card closes a mismatch at once and becomes the new first card', () => {
    const s0 = newGame(8, createRng(3));
    const other = strangerOf(s0, 0);
    const shown = flip(flip(s0, 0).state, other).state;
    const third = shown.cards.findIndex((_, i) => i !== 0 && i !== other);
    const { state, event } = flip(shown, third);
    expect(event).toBe('first');
    expect(state.open).toEqual([third]);
    expect(state.moves).toBe(1);
  });

  it('tapping one of the mismatched cards just turns them back', () => {
    const s0 = newGame(8, createRng(3));
    const other = strangerOf(s0, 0);
    const shown = flip(flip(s0, 0).state, other).state;
    const { state, event } = flip(shown, other);
    expect(event).toBe('closed');
    expect(state.open).toEqual([]);
  });

  it('ignores matched cards and the card already showing', () => {
    const s0 = newGame(8, createRng(3));
    const s1 = flip(s0, 0).state;
    expect(flip(s1, 0).event).toBe('ignored');
    const matched = flip(s1, partnerOf(s0, 0)).state;
    expect(flip(matched, 0).event).toBe('ignored');
    expect(flip(matched, -1).event).toBe('ignored');
    expect(flip(matched, 99).event).toBe('ignored');
  });
});

describe('Memory Match completion', () => {
  it('is complete when every pair is found, with a perfect game taking one move per pair', () => {
    for (const pairs of [8, 18]) {
      let s = newGame(pairs, createRng(pairs));
      while (!isComplete(s)) {
        const first = s.matched.findIndex((m) => !m);
        s = flip(s, first).state;
        s = flip(s, partnerOf(s, first)).state;
      }
      expect(s.pairsFound).toBe(pairs);
      expect(s.moves).toBe(pairs);
      expect(s.matched.every(Boolean)).toBe(true);
    }
  });

  it('counts every pair turned over, including misses', () => {
    let s = newGame(8, createRng(5));
    s = flip(s, 0).state;
    s = flip(s, strangerOf(s, 0)).state;
    s = closeOpen(s);
    s = flip(s, 0).state;
    s = flip(s, partnerOf(s, 0)).state;
    expect(s.moves).toBe(2);
    expect(isComplete(s)).toBe(false);
  });
});
