import type { GameDefinition } from '../engine/types';
import { createMatch3Renderer } from './renderer';
import { M3_HEIGHT, M3_WIDTH, MATCH3_BINDINGS, Match3Simulation, type Match3Action } from './simulation';

const match3: GameDefinition<Match3Action, Match3Simulation> = {
  id: 'match-3',
  width: M3_WIDTH,
  height: M3_HEIGHT,
  bindings: MATCH3_BINDINGS,
  createSimulation: (options) => new Match3Simulation(options),
  createRenderer: (env) => createMatch3Renderer(env),
};

export default match3;
