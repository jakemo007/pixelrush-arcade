import type { GateRule, StarDirection, StarThresholds } from '@/lib/progress/levels';
import { meta as solitaire } from '@/games/solitaire/meta';
import { meta as sudoku } from '@/games/sudoku/meta';
import { meta as snake } from '@/games/snake/meta';
import { meta as game2048 } from '@/games/2048/meta';
import { meta as minesweeper } from '@/games/minesweeper/meta';
import { meta as chess } from '@/games/chess/meta';
import { meta as checkers } from '@/games/checkers/meta';
import { meta as spiderSolitaire } from '@/games/spider-solitaire/meta';
import { meta as freecell } from '@/games/freecell/meta';
import { meta as mahjongSolitaire } from '@/games/mahjong-solitaire/meta';
import { meta as dailyWord } from '@/games/daily-word/meta';
import { meta as crosswordMini } from '@/games/crossword-mini/meta';
import { meta as wordSearch } from '@/games/word-search/meta';
import { meta as bubbleShooter } from '@/games/bubble-shooter/meta';
import { meta as match3 } from '@/games/match-3/meta';
import { meta as typingSpeed } from '@/games/typing-speed/meta';
import { meta as memoryMatch } from '@/games/memory-match/meta';
import { meta as carRacing } from '@/games/car-racing/meta';
import { meta as miniGolf } from '@/games/mini-golf/meta';
import { meta as basketball } from '@/games/basketball/meta';
import { meta as stackfall } from '@/games/stackfall/meta';
import { meta as dropFour } from '@/games/drop-four/meta';

export const GAME_IDS = [
  'neon-dash',
  'brick-breaker',
  'space-survival',
  'solitaire',
  'sudoku',
  'snake',
  '2048',
  'minesweeper',
  'chess',
  'checkers',
  'spider-solitaire',
  'freecell',
  'mahjong-solitaire',
  'daily-word',
  'crossword-mini',
  'word-search',
  'bubble-shooter',
  'match-3',
  'typing-speed',
  'memory-match',
  'car-racing',
  'mini-golf',
  'basketball',
  'stackfall',
  'drop-four',
] as const;
export type GameId = (typeof GAME_IDS)[number];

export const CHALLENGE_GAME_IDS = ['neon-dash', 'brick-breaker', 'space-survival'] as const;
export type ChallengeGameId = (typeof CHALLENGE_GAME_IDS)[number];

export type Accent = 'cyan' | 'violet' | 'magenta' | 'amber' | 'green';

export type GameEngine = 'canvas' | 'dom';

export const CATEGORY_IDS = ['arcade', 'puzzle', 'card', 'board', 'word', 'sports', 'racing'] as const;
export type GameCategory = (typeof CATEGORY_IDS)[number];

export interface CategoryInfo {
  id: GameCategory;
  name: string;
  slug: string;
}

export const CATEGORIES: readonly CategoryInfo[] = [
  { id: 'arcade', name: 'Arcade', slug: 'arcade-games' },
  { id: 'puzzle', name: 'Puzzle', slug: 'puzzle-games' },
  { id: 'card', name: 'Card Games', slug: 'card-games' },
  { id: 'board', name: 'Board Games', slug: 'board-games' },
  { id: 'word', name: 'Word Games', slug: 'word-games' },
  { id: 'sports', name: 'Sports', slug: 'sports-games' },
  { id: 'racing', name: 'Racing', slug: 'racing-games' },
];

export type ValueFormat = 'points' | 'duration' | 'racetime' | 'count';

export interface BestConfig {
  label: string;
  format: ValueFormat;
  unit?: string;
  direction: 'higher' | 'lower';
  requiresWin?: boolean;
}

export interface GameVariant {
  id: string;
  label: string;
}

interface BaseGameInfo {
  id: GameId;
  name: string;
  tagline: string;
  summary: string;
  genre: string;
  categories: readonly GameCategory[];
  tags: readonly string[];
  sessionLength: string;
  controls: {
    keyboard: string;
    touch: string;
  };
  accent: Accent;
  best: BestConfig | null;
  guideSlug?: string;
  added: string;
  featured?: boolean;
}

export interface LevelsConfig {
  count: number;
  direction: StarDirection;
  thresholds: StarThresholds;
  valueLabel: string;
  gate?: GateRule;
}

export interface CanvasGameInfo extends BaseGameInfo {
  engine: 'canvas';
  canvas: { width: number; height: number };
  levels?: LevelsConfig;
}

export interface DomGameInfo extends BaseGameInfo {
  engine: 'dom';
  variants?: readonly GameVariant[];
  variantLabel?: string;
  pausable?: boolean;
  aspectRatio?: number;
}

export type GameInfo = CanvasGameInfo | DomGameInfo;

export const POINTS_BEST: BestConfig = { label: 'Score', format: 'points', direction: 'higher' };

export const GAMES: readonly GameInfo[] = [
  {
    id: 'neon-dash',
    name: 'Neon Dash',
    tagline: 'One button. Endless neon. How far can you run?',
    summary:
      'An endless runner through a glowing synth city. Jump spikes, clear pits, stay low under drones and grab energy shards as the speed climbs.',
    genre: 'Endless runner',
    categories: ['arcade'],
    tags: ['One-button', 'Reflexes', 'Quick runs'],
    sessionLength: '30 seconds to a few minutes',
    controls: {
      keyboard: 'Space, W or Up Arrow to jump (hold for a higher jump)',
      touch: 'Tap the game to jump (hold for a higher jump)',
    },
    accent: 'cyan',
    engine: 'canvas',
    canvas: { width: 960, height: 540 },
    best: POINTS_BEST,
    guideSlug: 'endless-runner-beginner-tips',
    added: '2026-10-24',
    featured: true,
  },
  {
    id: 'brick-breaker',
    name: 'Brick Breaker',
    tagline: 'Aim every bounce. Clear all thirty walls.',
    summary:
      'A classic paddle-and-ball game with 30 levels. Earn up to three stars on each, angle your shots, chain combos for bonus points and catch power-ups before they fall.',
    genre: 'Paddle arcade',
    categories: ['arcade'],
    tags: ['Classic', 'Aim & angles', '30 levels'],
    sessionLength: '5 to 15 minutes',
    controls: {
      keyboard: 'Left/Right Arrows or A/D to move, Space to launch',
      touch: 'Drag anywhere on the game to move, tap to launch',
    },
    accent: 'violet',
    engine: 'canvas',
    canvas: { width: 540, height: 720 },
    best: POINTS_BEST,
    levels: {
      count: 30,
      direction: 'lower',
      thresholds: [2, 1, 0],
      valueLabel: 'balls lost',
      gate: { every: 10, starsPerGate: 15 },
    },
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
    categories: ['arcade'],
    tags: ['Auto-fire', 'Dodging', 'Waves'],
    sessionLength: '1 to 5 minutes',
    controls: {
      keyboard: 'Arrow keys or WASD to fly (firing is automatic)',
      touch: 'Drag anywhere on the game to fly (firing is automatic)',
    },
    accent: 'magenta',
    engine: 'canvas',
    canvas: { width: 480, height: 720 },
    best: POINTS_BEST,
    guideSlug: 'space-survival-strategies',
    added: '2026-10-24',
  },
  solitaire,
  sudoku,
  snake,
  game2048,
  minesweeper,
  chess,
  checkers,
  spiderSolitaire,
  freecell,
  mahjongSolitaire,
  dailyWord,
  crosswordMini,
  wordSearch,
  bubbleShooter,
  match3,
  typingSpeed,
  memoryMatch,
  carRacing,
  miniGolf,
  basketball,
  stackfall,
  dropFour,
];

export function isGameId(value: unknown): value is GameId {
  return typeof value === 'string' && (GAME_IDS as readonly string[]).includes(value);
}

export function isChallengeGameId(value: unknown): value is ChallengeGameId {
  return typeof value === 'string' && (CHALLENGE_GAME_IDS as readonly string[]).includes(value);
}

export function getGame(id: GameId): GameInfo {
  const game = GAMES.find((g) => g.id === id);
  if (!game) throw new Error(`Unknown game id: ${id}`);
  return game;
}

export function getCanvasGame(id: GameId): CanvasGameInfo {
  const game = getGame(id);
  if (game.engine !== 'canvas') throw new Error(`${id} is not a canvas game`);
  return game;
}

export function getDomGame(id: GameId): DomGameInfo {
  const game = getGame(id);
  if (game.engine !== 'dom') throw new Error(`${id} is not a DOM game`);
  return game;
}

export function gamePath(id: GameId): string {
  return `/games/${id}/`;
}

export function otherGames(id: GameId): GameInfo[] {
  return GAMES.filter((g) => g.id !== id);
}

export function getCategory(id: GameCategory): CategoryInfo {
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category: ${id}`);
  return category;
}

export function categoryPath(id: GameCategory): string {
  return `/categories/${getCategory(id).slug}/`;
}

export function gamesInCategory(id: GameCategory): GameInfo[] {
  return GAMES.filter((g) => g.categories.includes(id));
}

export function relatedGames(id: GameId, limit = 6): GameInfo[] {
  const game = getGame(id);
  const primary = game.categories[0];
  const rank = (g: GameInfo): number => {
    if (g.categories[0] === primary) return 0;
    if (g.categories.some((c) => game.categories.includes(c))) return 1;
    if (g.featured) return 2;
    return 3;
  };
  return otherGames(id)
    .map((g, index) => ({ g, index, r: rank(g) }))
    .sort((a, b) => a.r - b.r || a.index - b.index)
    .slice(0, limit)
    .map((x) => x.g);
}

export function defaultVariant(game: GameInfo): string | undefined {
  return game.engine === 'dom' ? game.variants?.[0]?.id : undefined;
}
