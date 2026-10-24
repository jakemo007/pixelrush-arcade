/**
 * Deterministic daily challenge.
 *
 * Time zone convention: the challenge day is the UTC calendar date. It changes
 * at 00:00 UTC (8:00 PM US Eastern during daylight saving time, 7:00 PM in
 * standard time). Every browser that asks for the same UTC date gets exactly
 * the same challenge, because everything is derived from a hash of that date.
 *
 * - The featured game rotates through the catalogue one day at a time.
 * - The goal, target and modifier are chosen by a PRNG seeded from the date.
 * - The same seed drives the game's course/spawns, so all players face the
 *   same layout that day.
 *
 * Changing CHALLENGE_SALT (or the template lists) changes every future and
 * past challenge, so only do it deliberately.
 */

import { GAME_IDS, type GameId } from '@/config/games';
import type { GameStats } from '@/games/engine/types';
import { MODIFIERS, type ModifierInfo } from '@/games/modifiers';
import { createRng, hashString, pick, type Rng } from '@/lib/utils/random';

export const CHALLENGE_SALT = 'pixelrush-daily-v1';
const MS_PER_DAY = 86_400_000;

export interface ChallengeGoal {
  /** Key in the game's stats object, e.g. "score" or "shards". */
  metric: string;
  target: number;
  /** Player-facing sentence, e.g. "Score at least 900 points in a single run." */
  description: string;
}

export interface DailyChallenge {
  /** UTC date, YYYY-MM-DD. */
  dateKey: string;
  /** Whole days since 1970-01-01 UTC. */
  dayNumber: number;
  /** Seed passed to the game for that day's course/spawns. */
  seed: number;
  gameId: GameId;
  title: string;
  goal: ChallengeGoal;
  modifier: ModifierInfo | null;
}

interface GoalTemplate {
  title: string;
  metric: string;
  min: number;
  max: number;
  step: number;
  describe: (target: number) => string;
}

const fmt = (n: number) => n.toLocaleString('en-US');

export const GOAL_TEMPLATES: Record<GameId, readonly GoalTemplate[]> = {
  'neon-dash': [
    { title: 'Distance Run', metric: 'score', min: 400, max: 1200, step: 50, describe: (t) => `Score at least ${fmt(t)} points in a single run.` },
    { title: 'Shard Collector', metric: 'shards', min: 5, max: 14, step: 1, describe: (t) => `Collect ${t} energy shards in a single run.` },
    { title: 'Steady Nerves', metric: 'timeSurvived', min: 30, max: 75, step: 5, describe: (t) => `Survive for ${t} seconds in a single run.` },
  ],
  'brick-breaker': [
    { title: 'Score Rush', metric: 'score', min: 600, max: 1800, step: 100, describe: (t) => `Score at least ${fmt(t)} points in a single game.` },
    { title: 'Brick Buster', metric: 'bricksBroken', min: 30, max: 80, step: 5, describe: (t) => `Break ${t} bricks in a single game.` },
    { title: 'Wall Climber', metric: 'levelReached', min: 2, max: 3, step: 1, describe: (t) => `Reach level ${t} in a single game.` },
  ],
  'space-survival': [
    { title: 'Hold the Line', metric: 'timeSurvived', min: 45, max: 120, step: 15, describe: (t) => `Survive for ${t} seconds in a single run.` },
    { title: 'Ace Pilot', metric: 'enemiesDestroyed', min: 20, max: 60, step: 5, describe: (t) => `Destroy ${t} enemy ships in a single run.` },
    { title: 'High Scorer', metric: 'score', min: 600, max: 2000, step: 100, describe: (t) => `Score at least ${fmt(t)} points in a single run.` },
  ],
};

/** Probability that a day has a modifier at all. */
const MODIFIER_CHANCE = 0.6;

/** Formats a Date as its UTC calendar date, YYYY-MM-DD. */
export function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parses YYYY-MM-DD as a UTC date; returns null for invalid input. */
export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return toUtcDateKey(date) === key ? date : null;
}

export function utcDayNumber(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY);
}

function pickTarget(rng: Rng, template: GoalTemplate): number {
  const steps = Math.floor((template.max - template.min) / template.step);
  return template.min + template.step * Math.floor(rng() * (steps + 1));
}

export function getDailyChallenge(date: Date = new Date()): DailyChallenge {
  const dateKey = toUtcDateKey(date);
  const dayNumber = utcDayNumber(date);
  const seed = hashString(`${CHALLENGE_SALT}:${dateKey}`);
  const rng = createRng(seed);

  const gameId = GAME_IDS[((dayNumber % GAME_IDS.length) + GAME_IDS.length) % GAME_IDS.length]!;
  const template = pick(rng, GOAL_TEMPLATES[gameId]);
  const target = pickTarget(rng, template);
  const modifier = rng() < MODIFIER_CHANCE ? pick(rng, MODIFIERS[gameId]) : null;

  return {
    dateKey,
    dayNumber,
    seed,
    gameId,
    title: template.title,
    goal: { metric: template.metric, target, description: template.describe(target) },
    modifier,
  };
}

/** Challenge for a YYYY-MM-DD key, or null if the key is invalid. */
export function getChallengeForDateKey(dateKey: string): DailyChallenge | null {
  const date = parseDateKey(dateKey);
  return date ? getDailyChallenge(date) : null;
}

export function isGoalMet(goal: ChallengeGoal, stats: GameStats): boolean {
  const value = stats[goal.metric];
  return typeof value === 'number' && Number.isFinite(value) && value >= goal.target;
}

/** Milliseconds until the next challenge (next 00:00 UTC). */
export function msUntilNextChallenge(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

/** Long, human-readable form of a date key, always interpreted in UTC. */
export function formatDateKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
