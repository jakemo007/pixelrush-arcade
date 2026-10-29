import { isChallengeGameId, type ChallengeGameId, type GameId } from '@/config/games';

export interface ModifierInfo {
  id: string;
  name: string;
  description: string;
}

export const MODIFIERS: Record<ChallengeGameId, readonly ModifierInfo[]> = {
  'neon-dash': [
    { id: 'turbo-start', name: 'Turbo Start', description: 'The run starts 20% faster than usual.' },
    { id: 'moon-gravity', name: 'Moon Gravity', description: 'Lower gravity: jumps float longer, so time your landings.' },
    { id: 'shard-storm', name: 'Shard Storm', description: 'Energy shards appear far more often.' },
  ],
  'brick-breaker': [
    { id: 'fast-ball', name: 'Fast Ball', description: 'The ball travels 15% faster.' },
    { id: 'narrow-paddle', name: 'Narrow Paddle', description: 'Your paddle is 20% narrower.' },
    { id: 'bonus-life', name: 'Bonus Life', description: 'Start with 4 lives instead of 3.' },
  ],
  'space-survival': [
    { id: 'swarm', name: 'Swarm', description: 'Enemies arrive 25% more often.' },
    { id: 'glass-hull', name: 'Glass Hull', description: 'Your hull holds 2 hits instead of 3.' },
    { id: 'twin-cannons', name: 'Twin Cannons', description: 'Start with twin cannons for the first 20 seconds.' },
  ],
};

export function getModifier(gameId: GameId, id: string | null): ModifierInfo | null {
  if (!id || !isChallengeGameId(gameId)) return null;
  return MODIFIERS[gameId].find((m) => m.id === id) ?? null;
}

export interface RunOptions {
  seed: number;
  modifier: string | null;
}
