import { describe, expect, it } from 'vitest';
import { CHALLENGE_GAME_IDS, GAME_IDS } from '@/config/games';
import { MODIFIERS } from '@/games/modifiers';
import {
  formatDateKey,
  getChallengeForDateKey,
  getDailyChallenge,
  GOAL_TEMPLATES,
  isGoalMet,
  msUntilNextChallenge,
  parseDateKey,
  toUtcDateKey,
} from '@/lib/daily/challenge';

const day = (iso: string) => new Date(iso);

describe('daily challenge', () => {
  it('is identical for every moment of the same UTC day', () => {
    const morning = getDailyChallenge(day('2026-10-24T00:00:00Z'));
    const night = getDailyChallenge(day('2026-10-24T23:59:59.999Z'));
    expect(night).toEqual(morning);
    expect(morning.dateKey).toBe('2026-10-24');
  });

  it('uses UTC regardless of the local offset used to create the Date', () => {
    const fromOffset = getDailyChallenge(new Date('2026-10-24T20:30:00-04:00'));
    expect(fromOffset.dateKey).toBe('2026-10-25');
    expect(fromOffset).toEqual(getDailyChallenge(day('2026-10-25T12:00:00Z')));
  });

  it('changes at the UTC date boundary', () => {
    const before = getDailyChallenge(day('2026-10-24T23:59:59Z'));
    const after = getDailyChallenge(day('2026-10-25T00:00:00Z'));
    expect(after.dateKey).not.toBe(before.dateKey);
    expect(after.seed).not.toBe(before.seed);
    expect(after.gameId).not.toBe(before.gameId);
  });

  it('rotates through every challenge game and varies the challenge across dates', () => {
    const challenges = Array.from({ length: 60 }, (_, i) => getDailyChallenge(new Date(Date.UTC(2026, 0, 1 + i))));
    expect(new Set(challenges.map((c) => c.seed)).size).toBe(60);
    for (const id of CHALLENGE_GAME_IDS) {
      expect(challenges.filter((c) => c.gameId === id).length).toBe(20);
    }
    expect(new Set(challenges.map((c) => `${c.title}:${c.goal.target}`)).size).toBeGreaterThan(15);
    for (let i = 1; i < challenges.length; i++) expect(challenges[i]!.gameId).not.toBe(challenges[i - 1]!.gameId);
  });

  it('only produces goals and modifiers that belong to the featured game', () => {
    for (let i = 0; i < 365; i++) {
      const c = getDailyChallenge(new Date(Date.UTC(2026, 0, 1 + i)));
      const template = GOAL_TEMPLATES[c.gameId].find((t) => t.metric === c.goal.metric && t.title === c.title);
      expect(template).toBeDefined();
      expect(c.goal.target).toBeGreaterThanOrEqual(template!.min);
      expect(c.goal.target).toBeLessThanOrEqual(template!.max);
      expect((c.goal.target - template!.min) % template!.step).toBe(0);
      if (c.modifier) expect(MODIFIERS[c.gameId]).toContainEqual(c.modifier);
      expect(c.goal.description.length).toBeGreaterThan(10);
    }
  });

  it('has a known, stable value for a fixed date (guards against accidental changes)', () => {
    const a = getChallengeForDateKey('2026-10-24');
    const b = getChallengeForDateKey('2026-10-24');
    expect(a).toEqual(b);
    expect(a?.gameId).toBe(CHALLENGE_GAME_IDS[Math.floor(Date.UTC(2026, 9, 24) / 86_400_000) % CHALLENGE_GAME_IDS.length]);
  });

  it('keeps the original three-game rotation now that the catalogue is larger', () => {
    expect([...CHALLENGE_GAME_IDS]).toEqual(['neon-dash', 'brick-breaker', 'space-survival']);
    expect(GAME_IDS.slice(0, 3)).toEqual([...CHALLENGE_GAME_IDS]);
    expect(getChallengeForDateKey('2026-10-24')?.gameId).toBe('space-survival');
  });

  it('checks goals against run stats', () => {
    const goal = { metric: 'score', target: 500, description: '' };
    expect(isGoalMet(goal, { score: 500 })).toBe(true);
    expect(isGoalMet(goal, { score: 499 })).toBe(false);
    expect(isGoalMet(goal, { shards: 900 })).toBe(false);
    expect(isGoalMet(goal, { score: NaN })).toBe(false);
  });
});

describe('date helpers', () => {
  it('formats and parses UTC date keys', () => {
    expect(toUtcDateKey(day('2026-03-05T22:00:00Z'))).toBe('2026-03-05');
    expect(parseDateKey('2026-02-30')).toBeNull();
    expect(parseDateKey('26-1-1')).toBeNull();
    expect(parseDateKey('2026-10-24')?.toISOString()).toBe('2026-10-24T00:00:00.000Z');
    expect(getChallengeForDateKey('garbage')).toBeNull();
    expect(formatDateKey('2026-10-24')).toBe('Saturday, October 24, 2026');
  });

  it('counts down to the next UTC midnight', () => {
    expect(msUntilNextChallenge(day('2026-10-24T23:00:00Z'))).toBe(3_600_000);
    expect(msUntilNextChallenge(day('2026-10-24T00:00:00Z'))).toBe(86_400_000);
  });
});
