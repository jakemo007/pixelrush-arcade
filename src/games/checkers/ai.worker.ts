import { createRng } from '@/lib/utils/random';
import { chooseCheckersMove } from './ai';
import type { CheckersAiRequest } from './ai-request';

self.addEventListener('message', (event: MessageEvent<{ id: number; req: CheckersAiRequest }>) => {
  const { id, req } = event.data;
  try {
    const res = chooseCheckersMove(req.state, { timeMs: req.timeMs, maxDepth: req.maxDepth, rng: createRng(req.seed) });
    self.postMessage({ id, res });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
});
