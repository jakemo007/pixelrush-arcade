/**
 * Game catalogue. Adding a game means: add an entry here, add its engine
 * module under src/games/<id>/, register its loader in
 * src/components/games/game-loaders.ts and add its page + content.
 */

export const GAME_IDS = ['neon-dash', 'brick-breaker', 'space-survival'] as const;
export type GameId = (typeof GAME_IDS)[number];

export type Accent = 'cyan' | 'violet' | 'magenta';

export interface GameInfo {
  id: GameId;
  name: string;
  /** One-line hook used on cards. */
  tagline: string;
  /** Two-sentence description for cards and meta descriptions. */
  summary: string;
  genre: string;
  tags: readonly string[];
  /** Typical length of a single run, written for players. */
  sessionLength: string;
  controls: {
    keyboard: string;
    touch: string;
  };
  accent: Accent;
  /** Logical canvas size; also used to reserve layout space before load. */
  canvas: { width: number; height: number };
  /** Slug of the matching strategy guide. */
  guideSlug: string;
  /** ISO date the game was added (shown nowhere as "new" unless true). */
  added: string;
}

export const GAMES: readonly GameInfo[] = [
  {
    id: 'neon-dash',
    name: 'Neon Dash',
    tagline: 'One button. Endless neon. How far can you run?',
    summary:
      'An endless runner through a glowing synth city. Jump spikes, clear pits, stay low under drones and grab energy shards as the speed climbs.',
    genre: 'Endless runner',
    tags: ['One-button', 'Reflexes', 'Quick runs'],
    sessionLength: '30 seconds to a few minutes',
    controls: {
      keyboard: 'Space, W or Up Arrow to jump (hold for a higher jump)',
      touch: 'Tap the game to jump (hold for a higher jump)',
    },
    accent: 'cyan',
    canvas: { width: 960, height: 540 },
    guideSlug: 'endless-runner-beginner-tips',
    added: '2026-10-24',
  },
  {
    id: 'brick-breaker',
    name: 'Brick Breaker',
    tagline: 'Aim every bounce. Clear all eight walls.',
    summary:
      'A classic paddle-and-ball game with eight hand-built levels. Angle your shots, chain combos for bonus points and catch power-ups before they fall.',
    genre: 'Paddle arcade',
    tags: ['Classic', 'Aim & angles', '8 levels'],
    sessionLength: '5 to 15 minutes',
    controls: {
      keyboard: 'Left/Right Arrows or A/D to move, Space to launch',
      touch: 'Drag anywhere on the game to move, tap to launch',
    },
    accent: 'violet',
    canvas: { width: 540, height: 720 },
    guideSlug: 'how-to-get-better-at-brick-breaker',
    added: '2026-10-24',
  },
  {
    id: 'space-survival',
    name: 'Space Survival',
    tagline: 'Your cannons fire on their own. Your job is to stay alive.',
    summary:
      'A vertical space shooter built around dodging. Your ship fires automatically while you weave through drifters, weavers, chargers and gunships.',
    genre: 'Survival shooter',
    tags: ['Auto-fire', 'Dodging', 'Waves'],
    sessionLength: '1 to 5 minutes',
    controls: {
      keyboard: 'Arrow keys or WASD to fly (firing is automatic)',
      touch: 'Drag anywhere on the game to fly (firing is automatic)',
    },
    accent: 'magenta',
    canvas: { width: 480, height: 720 },
    guideSlug: 'space-survival-strategies',
    added: '2026-10-24',
  },
];

export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && (GAME_IDS as readonly string[]).includes(value);
}

export function getGame(id: GameId): GameInfo {
  const game = GAMES.find((g) => g.id === id);
  if (!game) throw new Error(`Unknown game id: ${id}`);
  return game;
}

export function gamePath(id: GameId): string {
  return `/games/${id}/`;
}

export function otherGames(id: GameId): GameInfo[] {
  return GAMES.filter((g) => g.id !== id);
}
