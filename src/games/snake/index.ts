import type { GameDefinition } from '../engine/types';
import { createSnakeRenderer } from './renderer';
import { SNAKE_BINDINGS, SNAKE_HEIGHT, SNAKE_WIDTH, SnakeSimulation, type SnakeAction } from './simulation';

const snake: GameDefinition<SnakeAction, SnakeSimulation> = {
  id: 'snake',
  width: SNAKE_WIDTH,
  height: SNAKE_HEIGHT,
  bindings: SNAKE_BINDINGS,
  createSimulation: (options) => new SnakeSimulation(options),
  createRenderer: (env) => createSnakeRenderer(env),
};

export default snake;
