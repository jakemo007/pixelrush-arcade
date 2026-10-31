import type { GameDefinition } from '../engine/types';
import { createBasketballRenderer } from './renderer';
import { BasketballSimulation, BB_H, BB_W, HOOP_BINDINGS, type HoopAction } from './simulation';

const basketball: GameDefinition<HoopAction, BasketballSimulation> = {
  id: 'basketball',
  width: BB_W,
  height: BB_H,
  bindings: HOOP_BINDINGS,
  createSimulation: (options) => new BasketballSimulation(options),
  createRenderer: (env) => createBasketballRenderer(env),
};

export default basketball;
