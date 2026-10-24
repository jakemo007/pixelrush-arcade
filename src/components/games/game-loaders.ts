import type { GameId } from '@/config/games';
import type { AnyGameDefinition } from '@/games/engine/types';

/**
 * Lazy loaders: each game's engine code is split into its own chunk and only
 * downloaded on that game's page, after the page content has rendered.
 */
const LOADERS: Record<GameId, () => Promise<{ default: AnyGameDefinition }>> = {
  'neon-dash': () => import('@/games/neon-dash'),
  'brick-breaker': () => import('@/games/brick-breaker'),
  'space-survival': () => import('@/games/space-survival'),
};

export async function loadGameDefinition(id: GameId): Promise<AnyGameDefinition> {
  const mod = await LOADERS[id]();
  return mod.default;
}
