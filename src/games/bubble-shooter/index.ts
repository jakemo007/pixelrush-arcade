import type { GameDefinition } from '../engine/types';
import { createBubbleShooterRenderer } from './renderer';
import { BS_HEIGHT, BS_WIDTH, BUBBLE_BINDINGS, BubbleShooterSimulation, type BubbleAction } from './simulation';

const bubbleShooter: GameDefinition<BubbleAction, BubbleShooterSimulation> = {
  id: 'bubble-shooter',
  width: BS_WIDTH,
  height: BS_HEIGHT,
  bindings: BUBBLE_BINDINGS,
  createSimulation: (options) => new BubbleShooterSimulation(options),
  createRenderer: (env) => createBubbleShooterRenderer(env),
};

export default bubbleShooter;
