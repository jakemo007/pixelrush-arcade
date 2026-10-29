import { describe, expect, it } from 'vitest';
import { meta } from '@/games/snake/meta';
import snakeDefinition from '@/games/snake';
import {
  BASE_INTERVAL_MS,
  COLS,
  intervalMs,
  levelForFood,
  foodPoints,
  MAX_LEVEL,
  placeFood,
  queueTurn,
  ROWS,
  SNAKE_ACTIONS,
  SnakeSimulation,
  START_HEAD,
  START_LENGTH,
  swipeDirection,
  tapDirection,
  CELL,
  type Cell,
  type Direction,
  type SnakeAction,
} from '@/games/snake/simulation';
import { createRng } from '@/lib/utils/random';
import { makeInput, STEP } from '../helpers';

const none = makeInput<SnakeAction>(SNAKE_ACTIONS);
const press = (dir: SnakeAction) => makeInput<SnakeAction>(SNAKE_ACTIONS, { [dir]: { pressed: true, held: true } });

const STEPS_PER_MOVE = 18;

function newSim(seed = 1): SnakeSimulation {
  return new SnakeSimulation({ seed, modifier: null });
}

function advance(sim: SnakeSimulation, steps: number, input = none): void {
  for (let i = 0; i < steps; i++) sim.update(STEP, input);
}

function parkFood(sim: SnakeSimulation, cell: Cell = { x: COLS - 1, y: ROWS - 1 }): void {
  sim.food = cell;
}

describe('Snake definition', () => {
  it('matches the catalogue canvas size', () => {
    expect(snakeDefinition.width).toBe(meta.canvas.width);
    expect(snakeDefinition.height).toBe(meta.canvas.height);
    expect(snakeDefinition.width).toBe(COLS * CELL);
  });

  it('starts with a short snake heading right and food off the snake', () => {
    const sim = newSim();
    expect(sim.snake).toHaveLength(START_LENGTH);
    expect(sim.head).toEqual(START_HEAD);
    expect(sim.dir).toBe('right');
    expect(sim.food).not.toBeNull();
    expect(sim.snake.some((s) => s.x === sim.food!.x && s.y === sim.food!.y)).toBe(false);
  });
});

describe('Snake movement', () => {
  it('moves one cell per tick in the current direction', () => {
    const sim = newSim();
    parkFood(sim);
    advance(sim, STEPS_PER_MOVE - 1);
    expect(sim.head).toEqual(START_HEAD);
    advance(sim, 1);
    expect(sim.head).toEqual({ x: START_HEAD.x + 1, y: START_HEAD.y });
    expect(sim.snake).toHaveLength(START_LENGTH);
    expect(sim.snake[1]).toEqual(START_HEAD);
  });

  it('turns on the next tick after a key press', () => {
    const sim = newSim();
    parkFood(sim);
    sim.update(STEP, press('up'));
    advance(sim, STEPS_PER_MOVE - 1);
    expect(sim.head).toEqual({ x: START_HEAD.x, y: START_HEAD.y - 1 });
    expect(sim.dir).toBe('up');
  });

  it('accepts WASD and arrow keys through the bindings', () => {
    expect(snakeDefinition.bindings.up).toEqual(expect.arrayContaining(['ArrowUp', 'KeyW']));
    expect(snakeDefinition.bindings.left).toEqual(expect.arrayContaining(['ArrowLeft', 'KeyA']));
    expect(snakeDefinition.bindings.down).toEqual(expect.arrayContaining(['ArrowDown', 'KeyS']));
    expect(snakeDefinition.bindings.right).toEqual(expect.arrayContaining(['ArrowRight', 'KeyD']));
  });
});

describe('Snake turn buffer', () => {
  it('queues up to two turns and applies one per tick', () => {
    const sim = newSim();
    parkFood(sim);
    expect(sim.turn('up')).toBe(true);
    expect(sim.turn('left')).toBe(true);
    expect(sim.turn('down')).toBe(false);
    advance(sim, STEPS_PER_MOVE);
    expect(sim.head).toEqual({ x: START_HEAD.x, y: START_HEAD.y - 1 });
    advance(sim, STEPS_PER_MOVE);
    expect(sim.head).toEqual({ x: START_HEAD.x - 1, y: START_HEAD.y - 1 });
    expect(sim.dir).toBe('left');
    expect(sim.turns).toHaveLength(0);
  });

  it('never reverses into the snake, even with a quick double turn', () => {
    const sim = newSim();
    parkFood(sim);
    expect(sim.turn('left')).toBe(false);
    expect(sim.turn('right')).toBe(false);
    expect(sim.turn('up')).toBe(true);
    expect(sim.turn('down')).toBe(false);
    advance(sim, STEPS_PER_MOVE * 3);
    expect(sim.phase).toBe('playing');
    expect(sim.dir).toBe('up');
  });

  it('validates each queued turn against the one before it', () => {
    const queue: Direction[] = [];
    expect(queueTurn(queue, 'right', 'down')).toBe(true);
    expect(queueTurn(queue, 'right', 'up')).toBe(false);
    expect(queueTurn(queue, 'right', 'left')).toBe(true);
    expect(queue).toEqual(['down', 'left']);
  });
});

describe('Snake growth and scoring', () => {
  it('grows by one and scores when it eats', () => {
    const sim = newSim();
    sim.food = { x: START_HEAD.x + 1, y: START_HEAD.y };
    advance(sim, STEPS_PER_MOVE);
    expect(sim.snake).toHaveLength(START_LENGTH + 1);
    expect(sim.score).toBe(foodPoints(1));
    expect(sim.foodEaten).toBe(1);
    expect(sim.drainCues()).toContain('collect');
    expect(sim.food).not.toBeNull();
    expect(sim.snake.some((s) => s.x === sim.food!.x && s.y === sim.food!.y)).toBe(false);
  });

  it('reports length in the HUD', () => {
    const sim = newSim();
    sim.food = { x: START_HEAD.x + 1, y: START_HEAD.y };
    advance(sim, STEPS_PER_MOVE);
    expect(sim.getHud().find((h) => h.id === 'length')?.value).toBe(String(START_LENGTH + 1));
  });

  it('pays more per food at higher speed levels', () => {
    expect(foodPoints(1)).toBe(10);
    expect(foodPoints(2)).toBe(20);
    expect(foodPoints(MAX_LEVEL)).toBe(80);
    expect(foodPoints(MAX_LEVEL + 5)).toBe(80);
  });
});

describe('Snake collisions', () => {
  it('ends the run when the head hits a wall', () => {
    const sim = newSim();
    parkFood(sim, { x: 0, y: 0 });
    advance(sim, STEPS_PER_MOVE * (COLS - START_HEAD.x - 1));
    expect(sim.phase).toBe('playing');
    expect(sim.head.x).toBe(COLS - 1);
    advance(sim, STEPS_PER_MOVE);
    expect(sim.phase).toBe('dying');
    expect(sim.deathCause).toBe('wall');
    expect(sim.outcome).toBeNull();
    advance(sim, 240);
    expect(sim.outcome).toBe('lost');
    expect(sim.head.x).toBe(COLS - 1);
  });

  it('ends the run when the head hits its own body', () => {
    const sim = newSim();
    parkFood(sim);
    sim.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 8, y: 11 },
      { x: 9, y: 11 },
      { x: 10, y: 11 },
      { x: 11, y: 11 },
    ];
    sim.dir = 'right';
    sim.turn('down');
    sim.step();
    expect(sim.phase).toBe('dying');
    expect(sim.deathCause).toBe('self');
  });

  it('may move into the cell the tail is leaving', () => {
    const sim = newSim();
    parkFood(sim);
    sim.snake = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 5 },
    ];
    sim.dir = 'up';
    sim.turn('right');
    sim.step();
    expect(sim.phase).toBe('playing');
    expect(sim.head).toEqual({ x: 6, y: 5 });
  });

  it('does not let the head enter the tail cell while growing', () => {
    const sim = newSim();
    sim.snake = [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 5 },
    ];
    sim.food = { x: 6, y: 5 };
    sim.dir = 'up';
    sim.turn('right');
    sim.step();
    expect(sim.phase).toBe('dying');
  });

  it('wins when the board is full', () => {
    const sim = newSim();
    const cells: Cell[] = [];
    for (let y = 0; y < ROWS; y++) {
      const row = Array.from({ length: COLS }, (_, i) => (y % 2 === 0 ? i : COLS - 1 - i));
      for (const x of row) cells.push({ x, y });
    }
    const last = cells.pop()!;
    sim.snake = cells.reverse();
    sim.food = last;
    sim.dir = 'left';
    sim.step();
    expect(sim.snake).toHaveLength(COLS * ROWS);
    expect(sim.phase).toBe('won');
    advance(sim, 240);
    expect(sim.outcome).toBe('won');
  });
});

describe('Snake food placement', () => {
  it('never places food on the snake', () => {
    const rng = createRng(42);
    const snake: Cell[] = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!(x === 7 && y === 13) && !(x === 2 && y === 19)) snake.push({ x, y });
    for (let i = 0; i < 200; i++) {
      const food = placeFood(rng, snake);
      expect(food).not.toBeNull();
      expect([JSON.stringify({ x: 7, y: 13 }), JSON.stringify({ x: 2, y: 19 })]).toContain(JSON.stringify(food));
    }
  });

  it('returns null when there is no free cell', () => {
    const snake: Cell[] = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) snake.push({ x, y });
    expect(placeFood(createRng(1), snake)).toBeNull();
  });

  it('keeps food off the snake through a long run of meals', () => {
    const sim = newSim(7);
    for (let meal = 0; meal < 40; meal++) {
      const ahead = { x: sim.head.x + 1, y: sim.head.y };
      if (ahead.x >= COLS) break;
      sim.food = ahead;
      sim.step();
      if (sim.food) expect(sim.snake.some((s) => s.x === sim.food!.x && s.y === sim.food!.y)).toBe(false);
    }
  });
});

describe('Snake speed curve', () => {
  it('speeds up every four foods and caps at level 8', () => {
    expect(levelForFood(0)).toBe(1);
    expect(levelForFood(3)).toBe(1);
    expect(levelForFood(4)).toBe(2);
    expect(levelForFood(27)).toBe(7);
    expect(levelForFood(28)).toBe(MAX_LEVEL);
    expect(levelForFood(500)).toBe(MAX_LEVEL);
    expect(intervalMs(1)).toBe(BASE_INTERVAL_MS);
    expect(intervalMs(MAX_LEVEL)).toBe(66);
    for (let l = 1; l < MAX_LEVEL; l++) expect(intervalMs(l + 1)).toBeLessThan(intervalMs(l));
    expect(intervalMs(99)).toBe(intervalMs(MAX_LEVEL));
  });

  it('moves faster after eating enough food', () => {
    const sim = newSim();
    parkFood(sim);
    sim.foodEaten = 4;
    const start = sim.head.x;
    advance(sim, 150);
    expect(sim.head.x - start).toBe(Math.floor(1250 / intervalMs(2)));
  });
});

describe('Snake touch input', () => {
  it('reads swipes by distance and dominant axis', () => {
    expect(swipeDirection(10, 5)).toBeNull();
    expect(swipeDirection(60, 10)).toBe('right');
    expect(swipeDirection(-60, 20)).toBe('left');
    expect(swipeDirection(10, -50)).toBe('up');
    expect(swipeDirection(-5, 80)).toBe('down');
  });

  it('turns from a swipe on the game', () => {
    const sim = newSim();
    parkFood(sim);
    sim.update(STEP, makeInput(SNAKE_ACTIONS, {}, { inside: true, down: true, pressed: true, x: 300, y: 300 }));
    sim.update(STEP, makeInput(SNAKE_ACTIONS, {}, { inside: true, down: true, moved: true, x: 305, y: 250 }));
    expect(sim.turns).toEqual(['up']);
    sim.update(STEP, makeInput(SNAKE_ACTIONS, {}, { inside: false, down: false, released: true, x: 305, y: 248 }));
    expect(sim.turns).toEqual(['up']);
  });

  it('turns toward a tap beside the head', () => {
    expect(tapDirection('right', { x: 5, y: 5 }, 100, 40)).toBe('up');
    expect(tapDirection('right', { x: 5, y: 5 }, 100, 400)).toBe('down');
    expect(tapDirection('up', { x: 5, y: 5 }, 20, 0)).toBe('left');
    expect(tapDirection('down', { x: 5, y: 5 }, 500, 0)).toBe('right');

    const sim = newSim();
    parkFood(sim);
    sim.update(STEP, makeInput(SNAKE_ACTIONS, {}, { inside: true, down: true, pressed: true, x: 100, y: 500 }));
    sim.update(STEP, makeInput(SNAKE_ACTIONS, {}, { inside: false, released: true, x: 102, y: 501 }));
    expect(sim.turns).toEqual(['down']);
  });
});

describe('Snake determinism', () => {
  function play(seed: number): string {
    const sim = newSim(seed);
    const script: [number, SnakeAction][] = [
      [30, 'down'],
      [80, 'right'],
      [140, 'up'],
      [200, 'left'],
      [260, 'down'],
    ];
    const foods: string[] = [];
    for (let i = 0; i < 400 && !sim.outcome; i++) {
      const cmd = script.find(([at]) => at === i);
      sim.update(STEP, cmd ? press(cmd[1]) : none);
      foods.push(JSON.stringify(sim.food));
    }
    return JSON.stringify({ snake: sim.snake, score: sim.score, foods: foods.slice(-5), phase: sim.phase });
  }

  it('replays identically with the same seed and input', () => {
    expect(play(123)).toBe(play(123));
  });

  it('places food differently with a different seed', () => {
    const a = newSim(1).food;
    const foods = [2, 3, 4, 5, 6].map((s) => JSON.stringify(newSim(s).food));
    expect(foods.some((f) => f !== JSON.stringify(a))).toBe(true);
  });
});
