import type { GameDefinition } from '../engine/types';
import { createMiniGolfRenderer } from './renderer';
import { GOLF_BINDINGS, MG_HEIGHT, MG_WIDTH, MiniGolfSimulation, type GolfAction } from './simulation';

const miniGolf: GameDefinition<GolfAction, MiniGolfSimulation> = {
  id: 'mini-golf',
  width: MG_WIDTH,
  height: MG_HEIGHT,
  bindings: GOLF_BINDINGS,
  createSimulation: (options) => new MiniGolfSimulation(options),
  createRenderer: (env) => createMiniGolfRenderer(env),
};

export default miniGolf;
