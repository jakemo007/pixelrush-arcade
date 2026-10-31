import type { GameDefinition } from '../engine/types';
import { createStackfallRenderer } from './renderer';
import {
  STACKFALL_BINDINGS,
  STACKFALL_HEIGHT,
  STACKFALL_WIDTH,
  StackfallSimulation,
  type StackfallAction,
} from './simulation';

const stackfall: GameDefinition<StackfallAction, StackfallSimulation> = {
  id: 'stackfall',
  width: STACKFALL_WIDTH,
  height: STACKFALL_HEIGHT,
  bindings: STACKFALL_BINDINGS,
  createSimulation: (options) => new StackfallSimulation(options),
  createRenderer: (env) => createStackfallRenderer(env),
};

export default stackfall;
