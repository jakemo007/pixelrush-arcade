import type { GameDefinition } from '../engine/types';
import { createSpaceSurvivalRenderer } from './renderer';
import { SPACE_BINDINGS, SpaceSurvivalSimulation, SS_HEIGHT, SS_WIDTH, type SpaceAction } from './simulation';

const spaceSurvival: GameDefinition<SpaceAction, SpaceSurvivalSimulation> = {
  id: 'space-survival',
  width: SS_WIDTH,
  height: SS_HEIGHT,
  bindings: SPACE_BINDINGS,
  createSimulation: (options) => new SpaceSurvivalSimulation(options),
  createRenderer: (env) => createSpaceSurvivalRenderer(env),
};

export default spaceSurvival;
