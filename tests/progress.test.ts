import { describe, expect, it } from 'vitest';
import {
  achievementProgress,
  emptyAchievements,
  isAchievementState,
  isUnlocked,
  loadAchievements,
  recordCounter,
  saveAchievements,
  validateDefinitions,
  type AchievementDef,
} from '@/lib/progress/achievements';
import {
  completedLevels,
  emptyProgress,
  highestUnlockedLevel,
  isGameProgress,
  isLevelUnlocked,
  isValidThresholds,
  loadProgress,
  MAX_LEVELS,
  nextLevelToPlay,
  recordLevelResult,
  saveProgress,
  starsFor,
  starsForLevel,
  totalStars,
  type GateRule,
  type StarThresholds,
} from '@/lib/progress/levels';
import { isThemeUnlocked, loadThemeId, resolveTheme, saveThemeId, validateThemes, type ThemeDef } from '@/lib/progress/themes';
import { createGameStorage } from '@/lib/storage/game-data';
import { MemoryStore, ThrowingStore } from './helpers';

const NOW = '2026-10-30T00:00:00.000Z';
const HIGHER: StarThresholds = [100, 300, 600];
const LOWER: StarThresholds = [6, 4, 2];

describe('star thresholds', () => {
  it('awards stars for higher-is-better values', () => {
    expect([0, 99, 100, 299, 300, 599, 600, 9999].map((v) => starsFor(v, HIGHER, 'higher'))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('awards stars for lower-is-better values such as strokes', () => {
    expect([9, 7, 6, 5, 4, 3, 2, 1].map((v) => starsFor(v, LOWER, 'lower'))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('gives no stars for non-finite values', () => {
    expect(starsFor(NaN, HIGHER, 'higher')).toBe(0);
    expect(starsFor(Infinity, LOWER, 'lower')).toBe(0);
  });

  it('accepts only strictly ordered thresholds for the direction', () => {
    expect(isValidThresholds([1, 2, 3], 'higher')).toBe(true);
    expect(isValidThresholds([3, 2, 1], 'lower')).toBe(true);
    expect(isValidThresholds([3, 2, 1], 'higher')).toBe(false);
    expect(isValidThresholds([1, 1, 2], 'higher')).toBe(false);
    expect(isValidThresholds([1, 2], 'higher')).toBe(false);
    expect(isValidThresholds([1, 2, NaN], 'higher')).toBe(false);
  });
});

describe('recording level results', () => {
  it('records a first clear with its stars', () => {
    const out = recordLevelResult(emptyProgress(), 1, 350, HIGHER, 'higher', NOW);
    expect(out).toMatchObject({ stars: 2, improved: true, firstClear: true });
    expect(out.progress.levels['1']).toEqual({ stars: 2, best: 350, at: NOW });
  });

  it('does not record a result that earns no stars', () => {
    const start = emptyProgress();
    const out = recordLevelResult(start, 1, 50, HIGHER, 'higher', NOW);
    expect(out.progress).toBe(start);
    expect(out).toMatchObject({ stars: 0, improved: false, firstClear: false });
  });

  it('keeps the better result and never lowers stars', () => {
    let p = recordLevelResult(emptyProgress(), 2, 700, HIGHER, 'higher', NOW).progress;
    const worse = recordLevelResult(p, 2, 150, HIGHER, 'higher', 'later');
    expect(worse.improved).toBe(false);
    expect(worse.stars).toBe(3);
    expect(worse.progress).toBe(p);
    const better = recordLevelResult(p, 2, 900, HIGHER, 'higher', 'later');
    expect(better.improved).toBe(true);
    expect(better.progress.levels['2']).toEqual({ stars: 3, best: 900, at: 'later' });
    p = better.progress;
    expect(starsForLevel(p, 2)).toBe(3);
  });

  it('improves a lower-is-better best, such as strokes', () => {
    let p = recordLevelResult(emptyProgress(), 1, 5, LOWER, 'lower', NOW).progress;
    expect(p.levels['1']).toMatchObject({ stars: 1, best: 5 });
    const out = recordLevelResult(p, 1, 3, LOWER, 'lower', 'later');
    expect(out.progress.levels['1']).toMatchObject({ stars: 2, best: 3 });
    p = out.progress;
    expect(recordLevelResult(p, 1, 4, LOWER, 'lower', 'x').progress.levels['1']!.best).toBe(3);
  });

  it('does not mutate the previous progress object', () => {
    const start = emptyProgress();
    recordLevelResult(start, 1, 700, HIGHER, 'higher', NOW);
    expect(start.levels).toEqual({});
  });

  it('rejects invalid levels and values', () => {
    const start = emptyProgress();
    for (const level of [0, -1, 1.5, MAX_LEVELS + 1, NaN]) expect(recordLevelResult(start, level, 700, HIGHER, 'higher', NOW).progress).toBe(start);
    for (const value of [-1, 1.5, 1e9]) expect(recordLevelResult(start, 1, value, [-5, -4, -3], 'lower', NOW).progress).toBe(start);
  });

  it('totals stars and completed levels', () => {
    let p = emptyProgress();
    p = recordLevelResult(p, 1, 700, HIGHER, 'higher', NOW).progress;
    p = recordLevelResult(p, 2, 120, HIGHER, 'higher', NOW).progress;
    expect(totalStars(p)).toBe(4);
    expect(completedLevels(p)).toBe(2);
  });
});

describe('unlocking levels', () => {
  const clear = (levels: number[], stars = 1) => {
    let p = emptyProgress();
    for (const level of levels) p = recordLevelResult(p, level, stars === 3 ? 700 : 120, HIGHER, 'higher', NOW).progress;
    return p;
  };

  it('always unlocks level 1 and nothing outside the level range', () => {
    expect(isLevelUnlocked(emptyProgress(), 1, 30)).toBe(true);
    expect(isLevelUnlocked(emptyProgress(), 2, 30)).toBe(false);
    expect(isLevelUnlocked(emptyProgress(), 0, 30)).toBe(false);
    expect(isLevelUnlocked(clear([1, 2, 3]), 31, 30)).toBe(false);
  });

  it('unlocks the next level once the previous one is cleared', () => {
    const p = clear([1, 2]);
    expect(isLevelUnlocked(p, 3, 30)).toBe(true);
    expect(isLevelUnlocked(p, 4, 30)).toBe(false);
    expect(highestUnlockedLevel(p, 30)).toBe(3);
  });

  it('stops at the last level', () => {
    expect(highestUnlockedLevel(clear([1, 2, 3]), 3)).toBe(3);
  });

  it('holds back a level behind a star gate', () => {
    const gate: GateRule = { every: 3, starsPerGate: 6 };
    const oneStar = clear([1, 2, 3]);
    expect(isLevelUnlocked(oneStar, 4, 30, gate)).toBe(false);
    expect(highestUnlockedLevel(oneStar, 30, gate)).toBe(3);
    const threeStars = clear([1, 2, 3], 3);
    expect(isLevelUnlocked(threeStars, 4, 30, gate)).toBe(true);
    expect(isLevelUnlocked(threeStars, 5, 30, gate)).toBe(false);
  });

  it('points to the first level not yet cleared, or the highest unlocked when all are cleared', () => {
    expect(nextLevelToPlay(emptyProgress(), 30)).toBe(1);
    expect(nextLevelToPlay(clear([1, 2]), 30)).toBe(3);
    expect(nextLevelToPlay(clear([1, 2, 3]), 3)).toBe(3);
    expect(nextLevelToPlay(clear([2]), 30)).toBe(1);
  });
});

describe('stored progress', () => {
  it('round-trips through game storage', () => {
    const store = new MemoryStore();
    const storage = createGameStorage('brick-breaker', store);
    const progress = recordLevelResult(emptyProgress(), 4, 700, HIGHER, 'higher', NOW).progress;
    expect(saveProgress(storage, progress)).toBe(true);
    expect(loadProgress(createGameStorage('brick-breaker', store))).toEqual(progress);
    expect(loadProgress(createGameStorage('mini-golf', store))).toEqual(emptyProgress());
  });

  it('ignores hand-edited or malformed data', () => {
    const bad: unknown[] = [
      null,
      [],
      {},
      { levels: [] },
      { levels: { '0': { stars: 1, best: 1, at: 'x' } } },
      { levels: { '1': { stars: 4, best: 1, at: 'x' } } },
      { levels: { '1': { stars: 1, best: 1.5, at: 'x' } } },
      { levels: { '1': { stars: 1, best: -1, at: 'x' } } },
      { levels: { '501': { stars: 1, best: 1, at: 'x' } } },
      { levels: { abc: { stars: 1, best: 1, at: 'x' } } },
      { levels: { '1': { stars: 1, best: 1 } } },
    ];
    for (const value of bad) expect(isGameProgress(value)).toBe(false);
    const store = new MemoryStore();
    store.setItem('pixelrush:v1:game:brick-breaker:progress', '{broken');
    expect(loadProgress(createGameStorage('brick-breaker', store))).toEqual(emptyProgress());
  });

  it('never throws when storage is unavailable', () => {
    const storage = createGameStorage('brick-breaker', new ThrowingStore());
    expect(loadProgress(storage)).toEqual(emptyProgress());
    expect(saveProgress(storage, emptyProgress())).toBe(false);
    expect(saveProgress(createGameStorage('brick-breaker', null), emptyProgress())).toBe(false);
  });
});

const DEFS: AchievementDef[] = [
  { id: 'first-clear', name: 'First clear', description: 'Clear a level.', counter: 'levels-cleared', target: 1 },
  { id: 'ten-clears', name: 'Ten clears', description: 'Clear ten levels.', counter: 'levels-cleared', target: 10 },
  { id: 'big-combo', name: 'Big combo', description: 'Reach a combo of 8.', counter: 'best-combo', target: 8 },
];

describe('achievements', () => {
  it('validates definitions', () => {
    expect(validateDefinitions(DEFS)).toEqual([]);
    expect(validateDefinitions([DEFS[0]!, DEFS[0]!])).toContain('duplicate id: first-clear');
    expect(validateDefinitions([{ ...DEFS[0]!, target: 0 }]).join()).toContain('invalid target');
    expect(validateDefinitions([{ ...DEFS[0]!, counter: 'Bad Counter' }]).join()).toContain('invalid counter');
    expect(validateDefinitions([{ ...DEFS[0]!, name: ' ' }]).join()).toContain('missing text');
  });

  it('adds to a counter and unlocks when the target is reached, once', () => {
    let state = emptyAchievements();
    let out = recordCounter(state, DEFS, { counter: 'levels-cleared', value: 1, mode: 'add' }, NOW);
    expect(out.unlocked.map((d) => d.id)).toEqual(['first-clear']);
    state = out.state;
    expect(isUnlocked(state, 'first-clear')).toBe(true);
    expect(state.unlocked['first-clear']).toBe(NOW);
    out = recordCounter(state, DEFS, { counter: 'levels-cleared', value: 1, mode: 'add' }, 'later');
    expect(out.unlocked).toEqual([]);
    expect(out.state.unlocked['first-clear']).toBe(NOW);
    expect(out.state.counters['levels-cleared']).toBe(2);
  });

  it('can unlock several achievements from one event', () => {
    const out = recordCounter(emptyAchievements(), DEFS, { counter: 'levels-cleared', value: 12, mode: 'add' }, NOW);
    expect(out.unlocked.map((d) => d.id).sort()).toEqual(['first-clear', 'ten-clears']);
  });

  it('keeps the maximum for max counters and ignores lower values', () => {
    let out = recordCounter(emptyAchievements(), DEFS, { counter: 'best-combo', value: 5, mode: 'max' }, NOW);
    expect(out.unlocked).toEqual([]);
    const lower = recordCounter(out.state, DEFS, { counter: 'best-combo', value: 3, mode: 'max' }, NOW);
    expect(lower.state).toBe(out.state);
    out = recordCounter(out.state, DEFS, { counter: 'best-combo', value: 9, mode: 'max' }, NOW);
    expect(out.unlocked.map((d) => d.id)).toEqual(['big-combo']);
    expect(out.state.counters['best-combo']).toBe(9);
  });

  it('ignores invalid events', () => {
    const start = emptyAchievements();
    for (const e of [
      { counter: 'Bad', value: 1, mode: 'add' as const },
      { counter: 'levels-cleared', value: -1, mode: 'add' as const },
      { counter: 'levels-cleared', value: 1.5, mode: 'add' as const },
      { counter: 'levels-cleared', value: NaN, mode: 'add' as const },
    ]) {
      expect(recordCounter(start, DEFS, e, NOW).state).toBe(start);
    }
  });

  it('reports progress towards a target without exceeding it', () => {
    const out = recordCounter(emptyAchievements(), DEFS, { counter: 'levels-cleared', value: 4, mode: 'add' }, NOW);
    expect(achievementProgress(out.state, DEFS[1]!)).toEqual({ value: 4, target: 10, done: false });
    const done = recordCounter(out.state, DEFS, { counter: 'levels-cleared', value: 20, mode: 'add' }, NOW);
    expect(achievementProgress(done.state, DEFS[1]!)).toEqual({ value: 10, target: 10, done: true });
  });

  it('persists, validates and survives broken storage', () => {
    const store = new MemoryStore();
    const state = recordCounter(emptyAchievements(), DEFS, { counter: 'levels-cleared', value: 1, mode: 'add' }, NOW).state;
    expect(saveAchievements(state, store)).toBe(true);
    expect(loadAchievements(store)).toEqual(state);
    store.setItem('pixelrush:v1:achievements', JSON.stringify({ counters: { ok: -1 }, unlocked: {} }));
    expect(loadAchievements(store)).toEqual(emptyAchievements());
    expect(isAchievementState({ counters: {}, unlocked: { Bad: 'x' } })).toBe(false);
    expect(loadAchievements(new ThrowingStore())).toEqual(emptyAchievements());
    expect(saveAchievements(state, new ThrowingStore())).toBe(false);
    expect(saveAchievements(state, null)).toBe(false);
  });
});

const THEMES: ThemeDef[] = [
  { id: 'classic', gameId: 'brick-breaker', name: 'Classic', unlock: { kind: 'default' } },
  { id: 'sunset', gameId: 'brick-breaker', name: 'Sunset', unlock: { kind: 'stars', stars: 10 } },
  { id: 'gold', gameId: 'brick-breaker', name: 'Gold', unlock: { kind: 'achievement', id: 'first-clear' } },
  { id: 'classic', gameId: 'mini-golf', name: 'Classic', unlock: { kind: 'default' } },
];

describe('themes', () => {
  const none = emptyAchievements();
  const withFirstClear = recordCounter(none, DEFS, { counter: 'levels-cleared', value: 1, mode: 'add' }, NOW).state;

  it('validates definitions', () => {
    expect(validateThemes(THEMES)).toEqual([]);
    expect(validateThemes(THEMES.slice(1))).toContain('brick-breaker: needs exactly one default theme');
    expect(validateThemes([...THEMES, THEMES[0]!]).join()).toContain('duplicate theme');
    expect(validateThemes([...THEMES, { id: 'x', gameId: 'snake', name: 'X', unlock: { kind: 'default' } }, { id: 'y', gameId: 'snake', name: 'Y', unlock: { kind: 'default' } }]).join()).toContain('snake: needs exactly one');
    expect(validateThemes([...THEMES, { id: 'cheap', gameId: 'mini-golf', name: 'C', unlock: { kind: 'stars', stars: 0 } }]).join()).toContain('invalid star cost');
  });

  it('unlocks by default, by stars and by achievement', () => {
    expect(isThemeUnlocked(THEMES[0]!, 0, none)).toBe(true);
    expect(isThemeUnlocked(THEMES[1]!, 9, none)).toBe(false);
    expect(isThemeUnlocked(THEMES[1]!, 10, none)).toBe(true);
    expect(isThemeUnlocked(THEMES[2]!, 99, none)).toBe(false);
    expect(isThemeUnlocked(THEMES[2]!, 0, withFirstClear)).toBe(true);
  });

  it('falls back to the default theme when the saved one is unknown or still locked', () => {
    expect(resolveTheme(THEMES, 'brick-breaker', null, 0, none)?.id).toBe('classic');
    expect(resolveTheme(THEMES, 'brick-breaker', 'sunset', 3, none)?.id).toBe('classic');
    expect(resolveTheme(THEMES, 'brick-breaker', 'sunset', 12, none)?.id).toBe('sunset');
    expect(resolveTheme(THEMES, 'brick-breaker', 'missing', 12, none)?.id).toBe('classic');
    expect(resolveTheme(THEMES, 'mini-golf', 'sunset', 12, none)?.id).toBe('classic');
    expect(resolveTheme(THEMES, 'snake', 'x', 0, none)).toBeNull();
  });

  it('saves the chosen theme per game and rejects malformed ids', () => {
    const store = new MemoryStore();
    const storage = createGameStorage('brick-breaker', store);
    expect(saveThemeId(storage, 'sunset')).toBe(true);
    expect(loadThemeId(storage)).toBe('sunset');
    expect(loadThemeId(createGameStorage('mini-golf', store))).toBeNull();
    expect(saveThemeId(storage, 'Bad Id')).toBe(false);
    store.setItem('pixelrush:v1:game:brick-breaker:theme', '"Bad Id"');
    expect(loadThemeId(storage)).toBeNull();
  });
});
