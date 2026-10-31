import type { GameDefinition } from '../engine/types';
import { createCarRacingRenderer } from './renderer';
import { CarRacingSimulation, CR_HEIGHT, CR_WIDTH, RACE_BINDINGS, type RaceAction } from './simulation';

const carRacing: GameDefinition<RaceAction, CarRacingSimulation> = {
  id: 'car-racing',
  width: CR_WIDTH,
  height: CR_HEIGHT,
  bindings: RACE_BINDINGS,
  createSimulation: (options) => new CarRacingSimulation(options),
  createRenderer: (env) => createCarRacingRenderer(env),
};

export default carRacing;
