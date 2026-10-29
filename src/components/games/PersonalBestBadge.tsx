'use client';

import type { BestConfig, GameId } from '@/config/games';
import { formatResult } from '@/lib/format';
import { loadBest } from '@/lib/storage/high-scores';
import { useLocalValue } from '@/lib/storage/use-local-value';

interface Props {
  gameId: GameId;
  best: BestConfig;
  variant?: string;
  variantLabel?: string;
}

export function PersonalBestBadge({ gameId, best, variant, variantLabel }: Props) {
  const value = useLocalValue(() => loadBest(gameId, variant) ?? 0, 0);
  if (value <= 0) return null;
  return (
    <span className="pill pill-accent" title="Stored only in this browser">
      Your best{variantLabel ? ` (${variantLabel})` : ''}: {formatResult(value, best)}
    </span>
  );
}
