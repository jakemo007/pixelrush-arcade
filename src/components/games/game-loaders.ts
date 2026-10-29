import type { ComponentType } from 'react';
import type { GameId } from '@/config/games';
import type { DomGameProps } from '@/games/dom/types';
import type { AnyGameDefinition } from '@/games/engine/types';

export const CANVAS_LOADERS: Partial<Record<GameId, () => Promise<{ default: AnyGameDefinition }>>> = {
  'neon-dash': () => import('@/games/neon-dash'),
  'brick-breaker': () => import('@/games/brick-breaker'),
  'space-survival': () => import('@/games/space-survival'),
  snake: () => import('@/games/snake'),
  'bubble-shooter': () => import('@/games/bubble-shooter'),
  'match-3': () => import('@/games/match-3'),
  'car-racing': () => import('@/games/car-racing'),
  'mini-golf': () => import('@/games/mini-golf'),
  basketball: () => import('@/games/basketball'),
};

export const DOM_LOADERS: Partial<Record<GameId, () => Promise<{ default: ComponentType<DomGameProps> }>>> = {
  solitaire: () => import('@/games/solitaire'),
  sudoku: () => import('@/games/sudoku'),
  '2048': () => import('@/games/2048'),
  minesweeper: () => import('@/games/minesweeper'),
  chess: () => import('@/games/chess'),
  checkers: () => import('@/games/checkers'),
  'spider-solitaire': () => import('@/games/spider-solitaire'),
  freecell: () => import('@/games/freecell'),
  'mahjong-solitaire': () => import('@/games/mahjong-solitaire'),
  'daily-word': () => import('@/games/daily-word'),
  'crossword-mini': () => import('@/games/crossword-mini'),
  'word-search': () => import('@/games/word-search'),
  'typing-speed': () => import('@/games/typing-speed'),
  'memory-match': () => import('@/games/memory-match'),
};

export async function loadGameDefinition(id: GameId): Promise<AnyGameDefinition> {
  const loader = CANVAS_LOADERS[id];
  if (!loader) throw new Error(`No canvas loader for ${id}`);
  const mod = await loader();
  return mod.default;
}

export async function loadDomGame(id: GameId): Promise<ComponentType<DomGameProps>> {
  const loader = DOM_LOADERS[id];
  if (!loader) throw new Error(`No DOM game loader for ${id}`);
  const mod = await loader();
  return mod.default;
}
