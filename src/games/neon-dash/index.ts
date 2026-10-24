import type { GameDefinition } from '../engine/types';
import { createNeonDashRenderer } from './renderer';
import { ND_HEIGHT, ND_WIDTH, NEON_DASH_BINDINGS, NeonDashSimulation, type NeonDashAction } from './simulation';

const neonDash: GameDefinition<NeonDashAction, NeonDashSimulation> = {
  id: 'neon-dash',
  width: ND_WIDTH,
  height: ND_HEIGHT,
  bindings: NEON_DASH_BINDINGS,
  createSimulation: (options) => new NeonDashSimulation(options),
  createRenderer: (env) => createNeonDashRenderer(env),
};

export default neonDash;
