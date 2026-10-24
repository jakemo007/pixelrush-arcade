import type { GameId } from '@/config/games';

export interface GuideMeta {
  slug: string;
  title: string;
  /** Short label for footers and lists. */
  shortTitle: string;
  /** The player question this guide answers (used as the intro hook). */
  question: string;
  description: string;
  gameId: GameId;
  /** YYYY-MM-DD */
  published: string;
  updated: string;
  readingMinutes: number;
}

export const GUIDES: readonly GuideMeta[] = [
  {
    slug: 'endless-runner-beginner-tips',
    title: 'Beginner Tips for Endless Runner Games',
    shortTitle: 'Endless runner tips',
    question: 'How do you get better at endless runner games?',
    description:
      'Practical beginner tips for endless runners: where to look, how to time jumps, how forgiveness mechanics work and how to practice, with examples from Neon Dash.',
    gameId: 'neon-dash',
    published: '2026-10-24',
    updated: '2026-10-24',
    readingMinutes: 7,
  },
  {
    slug: 'how-to-get-better-at-brick-breaker',
    title: 'How to Get Better at Brick Breaker',
    shortTitle: 'Brick Breaker tips',
    question: 'How do you aim, score more and stop losing the ball in Brick Breaker?',
    description:
      'Learn how paddle angles work, how to tunnel behind the bricks, build combos, handle steel bricks and finish the last stubborn brick in Brick Breaker.',
    gameId: 'brick-breaker',
    published: '2026-10-24',
    updated: '2026-10-24',
    readingMinutes: 7,
  },
  {
    slug: 'space-survival-strategies',
    title: 'Space Survival Game Strategies',
    shortTitle: 'Space Survival strategies',
    question: 'How do you survive longer and score more in Space Survival?',
    description:
      'Strategies for Space Survival: positioning, reading every enemy type, dodging chargers and gunships, using pickups and balancing survival time against kills.',
    gameId: 'space-survival',
    published: '2026-10-24',
    updated: '2026-10-24',
    readingMinutes: 7,
  },
];

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
