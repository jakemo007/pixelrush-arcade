import { chooseEngineMove, type EngineRequest } from './bridge';

self.addEventListener('message', (event: MessageEvent<{ id: number; req: EngineRequest }>) => {
  const { id, req } = event.data;
  try {
    self.postMessage({ id, res: chooseEngineMove(req) });
  } catch (err) {
    self.postMessage({ id, error: String(err) });
  }
});
