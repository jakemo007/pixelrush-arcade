import { describe, expect, it } from 'vitest';
import { meta } from '@/games/typing-speed/meta';
import { PASSAGES } from '@/games/typing-speed/passages';
import {
  applyInput,
  buildText,
  charState,
  commonPrefix,
  computeStats,
  countCorrect,
  durationFor,
  initialState,
  minCharsFor,
  normalizeInput,
  splitWords,
} from '@/games/typing-speed/rules';
import { createRng } from '@/lib/utils/random';

function typeChars(state: ReturnType<typeof initialState>, text: string) {
  let s = state;
  for (const ch of text) s = applyInput(s, s.typed + ch);
  return s;
}

const backspace = (state: ReturnType<typeof initialState>, n = 1) => applyInput(state, state.typed.slice(0, -n));

describe('Typing Speed passages', () => {
  it('has at least 25 original passages of plain typeable text', () => {
    expect(PASSAGES.length).toBeGreaterThanOrEqual(25);
    expect(new Set(PASSAGES).size).toBe(PASSAGES.length);
    for (const p of PASSAGES) {
      expect(p).toMatch(/^[\x20-\x7e]+$/);
      expect(p).not.toMatch(/\s{2}/);
      expect(p.trim()).toBe(p);
      expect(p.length).toBeGreaterThan(150);
    }
  });

  it('offers 60 and 30 second tests', () => {
    expect(meta.variants?.map((v) => v.id)).toEqual(['60s', '30s']);
    expect(meta.variantLabel).toBe('Duration');
    expect(durationFor('60s')).toBe(60_000);
    expect(durationFor('30s')).toBe(30_000);
    expect(durationFor('nope')).toBe(60_000);
  });

  it('builds a long enough text from shuffled passages, deterministically per seed', () => {
    const a = buildText(PASSAGES, createRng(4), minCharsFor(60_000));
    const b = buildText(PASSAGES, createRng(4), minCharsFor(60_000));
    const c = buildText(PASSAGES, createRng(5), minCharsFor(60_000));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a.length).toBeGreaterThanOrEqual(2000);
    expect(buildText(PASSAGES, createRng(4), minCharsFor(30_000)).length).toBeGreaterThanOrEqual(1000);
    expect(a).not.toMatch(/\s{2}/);
    expect(PASSAGES.some((p) => a.startsWith(p))).toBe(true);
  });
});

describe('Typing Speed formulas', () => {
  it('computes gross and net WPM with 5 characters per word', () => {
    const target = 'the cat sat on the mat';
    const state = typeChars(initialState(target), 'the cat sat on the mat'.slice(0, 20));
    const stats = computeStats(state, 60_000);
    expect(stats.correctChars).toBe(20);
    expect(stats.netWpm).toBe(4);
    expect(stats.grossWpm).toBe(4);
    expect(computeStats(state, 30_000).netWpm).toBe(8);
  });

  it('net WPM counts only characters that are correct at the end; gross counts every keystroke', () => {
    const target = 'abcde fghij';
    let s = typeChars(initialState(target), 'abxde');
    expect(s.keystrokes).toBe(5);
    expect(s.correctKeystrokes).toBe(4);
    s = backspace(s, 3);
    s = typeChars(s, 'cde');
    expect(s.keystrokes).toBe(8);
    expect(s.correctKeystrokes).toBe(7);
    const stats = computeStats(s, 6_000);
    expect(stats.correctChars).toBe(5);
    expect(stats.netWpm).toBeCloseTo(10);
    expect(stats.grossWpm).toBeCloseTo(16);
    expect(stats.accuracy).toBeCloseTo(7 / 8);
  });

  it('accuracy is correct keystrokes divided by all keystrokes', () => {
    const s = typeChars(initialState('hello world'), 'hellp wprld');
    expect(s.keystrokes).toBe(11);
    expect(s.correctKeystrokes).toBe(9);
    expect(computeStats(s, 60_000).accuracy).toBeCloseTo(9 / 11);
    expect(computeStats(s, 60_000).incorrectChars).toBe(2);
  });

  it('handles zero elapsed time and empty input', () => {
    const empty = computeStats(initialState('abc'), 0);
    expect(empty).toMatchObject({ grossWpm: 0, netWpm: 0, accuracy: null, correctChars: 0, incorrectChars: 0, keystrokes: 0 });
    const typed = typeChars(initialState('abc'), 'ab');
    expect(computeStats(typed, 0).netWpm).toBe(0);
    expect(computeStats(typed, 0).grossWpm).toBe(0);
    expect(computeStats(typed, -50).netWpm).toBe(0);
    expect(computeStats(initialState('abc'), 60_000).accuracy).toBeNull();
  });

  it('treats characters beyond the end of the passage as errors', () => {
    const s = typeChars(initialState('ab'), 'abcd');
    const stats = computeStats(s, 60_000);
    expect(stats.correctChars).toBe(2);
    expect(stats.incorrectChars).toBe(2);
    expect(s.correctKeystrokes).toBe(2);
    expect(s.keystrokes).toBe(4);
    expect(countCorrect('ab', 'abcd')).toBe(2);
  });
});

describe('Typing Speed character diffing', () => {
  it('marks each passage character as correct, incorrect or pending', () => {
    expect(charState('hello', 'hxl', 0)).toBe('correct');
    expect(charState('hello', 'hxl', 1)).toBe('incorrect');
    expect(charState('hello', 'hxl', 2)).toBe('correct');
    expect(charState('hello', 'hxl', 3)).toBe('pending');
    expect(charState('hello', '', 0)).toBe('pending');
  });

  it('finds the common prefix of old and new input', () => {
    expect(commonPrefix('abc', 'abd')).toBe(2);
    expect(commonPrefix('', 'abc')).toBe(0);
    expect(commonPrefix('abc', 'abc')).toBe(3);
  });

  it('does not count Backspace as a keystroke', () => {
    let s = typeChars(initialState('abc'), 'ab');
    s = backspace(s);
    expect(s.typed).toBe('a');
    expect(s.keystrokes).toBe(2);
  });

  it('counts several characters at once (mobile keyboards, word completion)', () => {
    const s = applyInput(initialState('one two'), 'one');
    expect(s.keystrokes).toBe(3);
    expect(s.correctKeystrokes).toBe(3);
  });

  it('waits for an IME composition to finish before counting keystrokes', () => {
    let s = applyInput(initialState('word'), 'wo', true);
    expect(s.typed).toBe('wo');
    expect(s.keystrokes).toBe(0);
    s = applyInput(s, 'wor', true);
    s = applyInput(s, 'wor', false);
    expect(s.keystrokes).toBe(3);
    expect(s.correctKeystrokes).toBe(3);
  });

  it('accepts curly quotes from phone keyboards and drops line breaks', () => {
    expect(normalizeInput('it’s “ok”')).toBe('it\'s "ok"');
    expect(normalizeInput('a\nb\r\nc')).toBe('abc');
    expect(normalizeInput('a b\tc')).toBe('a b c');
    const s = typeChars(initialState("each other's"), 'each other’s');
    expect(s.typed).toBe("each other's");
    expect(computeStats(s, 60_000).correctChars).toBe(12);
  });

  it('splits the passage into words that keep their spaces', () => {
    const words = splitWords('one two  three');
    expect(words.map((w) => w.text)).toEqual(['one ', 'two  ', 'three']);
    expect(words.map((w) => w.start)).toEqual([0, 4, 9]);
    expect(words.map((w) => w.text).join('')).toBe('one two  three');
  });
});
