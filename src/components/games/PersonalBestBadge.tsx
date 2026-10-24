'use client';

import type { GameId } from '@/config/games';
import { loadPersonalBest } from '@/lib/storage/high-scores';
import { useLocalValue } from '@/lib/storage/use-local-value';

/** Shows "Your best: N" when this browser has a stored personal best. */
export function PersonalBestBadge({ gameId }: { gameId: GameId }) {
  const best = useLocalValue(() => loadPersonalBest(gameId), 0);
  if (best <= 0) return null;
  return (
    <span className="pill pill-accent" title="Stored only in this browser">
      Your best: {best.toLocaleString('en-US')}
    </span>
  );
}
