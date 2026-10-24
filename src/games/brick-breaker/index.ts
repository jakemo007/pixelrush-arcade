import type { GameDefinition } from '../engine/types';
import { createBrickBreakerRenderer } from './renderer';
import { BB_HEIGHT, BB_WIDTH, BRICK_BREAKER_BINDINGS, BrickBreakerSimulation, type BrickBreakerAction } from './simulation';

const brickBreaker: GameDefinition<BrickBreakerAction, BrickBreakerSimulation> = {
  id: 'brick-breaker',
  width: BB_WIDTH,
  height: BB_HEIGHT,
  bindings: BRICK_BREAKER_BINDINGS,
  createSimulation: (options) => new BrickBreakerSimulation(options),
  createRenderer: (env) => createBrickBreakerRenderer(env),
};

export default brickBreaker;
