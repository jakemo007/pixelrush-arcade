import { createRng } from '@/lib/utils/random';
import type { SliceClock } from '@/games/chess/thinker';
import { searchCheckers, type AiResult } from './ai';
import type { CheckersState } from './rules';

export interface CheckersAiRequest {
  state: CheckersState;
  timeMs: number;
  maxDepth: number;
  seed: number;
}

export const CHECKERS_THINK_MS = 700;
export const CHECKERS_MAX_DEPTH = 24;

export function checkersSearch(req: CheckersAiRequest, clock: SliceClock): Generator<void, AiResult | null, void> {
  return searchCheckers(req.state, { timeMs: req.timeMs, maxDepth: req.maxDepth, rng: createRng(req.seed) }, clock);
}
