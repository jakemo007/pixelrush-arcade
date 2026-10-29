import { describe, expect, it } from 'vitest';
import {
  applyGravity,
  CELLS,
  clearCells,
  clearPoints,
  EMPTY,
  findMatches,
  findValidMove,
  generateBoard,
  GEM_TYPES,
  index,
  MAX_CASCADES,
  refill,
  reshuffle,
  resolveBoard,
  SIZE,
  swap,
  swapMakesMatch,
  validMoves,
  type Board,
} from '@/games/match-3/board';
import {
  BOARD_X,
  BOARD_Y,
  CELL,
  levelTarget,
  Match3Simulation,
  MOVE_BONUS,
  MOVES_PER_LEVEL,
  type Match3Action,
} from '@/games/match-3/simulation';
import { createRng } from '@/lib/utils/random';
import { makeInput, STEP } from '../helpers';

const ACTIONS: readonly Match3Action[] = ['up', 'down', 'left', 'right', 'select'];
const none = makeInput(ACTIONS);
const press = (a: Match3Action) => makeInput(ACTIONS, { [a]: { pressed: true, held: true } });

function deadBoard(): Board {
  const b: Board = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) b.push((c + 2 * r) % GEM_TYPES);
  return b;
}

function oneMoveBoard(): Board {
  const b = deadBoard();
  b[index(0, 0)] = 7;
  b[index(0, 1)] = 7;
  b[index(1, 2)] = 7;
  return b;
}

function runUntilIdle(sim: Match3Simulation, max = 2000): void {
  sim.update(STEP, none);
  for (let i = 0; i < max && sim.phase !== 'idle' && !sim.outcome; i++) sim.update(STEP, none);
}

const centre = (r: number, c: number) => ({ x: BOARD_X + c * CELL + CELL / 2, y: BOARD_Y + r * CELL + CELL / 2 });

describe('Match-3 board generation', () => {
  it('never starts with a match and always has a valid move', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const board = generateBoard(createRng(seed));
      expect(board).toHaveLength(CELLS);
      expect(board.every((t) => t >= 0 && t < GEM_TYPES)).toBe(true);
      expect(findMatches(board).cells).toEqual([]);
      expect(findValidMove(board)).not.toBeNull();
    }
  });

  it('is deterministic for a seed', () => {
    expect(generateBoard(createRng(42))).toEqual(generateBoard(createRng(42)));
    expect(generateBoard(createRng(42))).not.toEqual(generateBoard(createRng(43)));
  });
});

describe('Match-3 matching', () => {
  it('finds horizontal and vertical runs', () => {
    const b = deadBoard();
    b[index(4, 2)] = 9;
    b[index(4, 3)] = 9;
    b[index(4, 4)] = 9;
    b[index(0, 7)] = 8;
    b[index(1, 7)] = 8;
    b[index(2, 7)] = 8;
    b[index(3, 7)] = 8;
    const m = findMatches(b);
    expect(m.runs.map((r) => [r.dir, r.cells.length]).sort()).toEqual([
      ['h', 3],
      ['v', 4],
    ]);
    expect(m.cells).toHaveLength(7);
  });

  it('counts each cell of an L or T shape once', () => {
    const l = deadBoard();
    for (const [r, c] of [
      [2, 2],
      [3, 2],
      [4, 2],
      [4, 3],
      [4, 4],
    ] as const)
      l[index(r, c)] = 9;
    const lm = findMatches(l);
    expect(lm.runs).toHaveLength(2);
    expect(lm.cells).toHaveLength(5);
    expect(clearPoints(lm, 1)).toBe(50);

    const t = deadBoard();
    for (const [r, c] of [
      [2, 1],
      [2, 2],
      [2, 3],
      [3, 2],
      [4, 2],
    ] as const)
      t[index(r, c)] = 9;
    const tm = findMatches(t);
    expect(tm.cells).toHaveLength(5);
    expect(new Set(tm.cells).size).toBe(5);
  });

  it('scores gems, long runs and cascade multipliers', () => {
    const b = deadBoard();
    for (let c = 0; c < 4; c++) b[index(6, c)] = 9;
    const m = findMatches(b);
    expect(clearPoints(m, 1)).toBe(4 * 10 + 20);
    expect(clearPoints(m, 3)).toBe((4 * 10 + 20) * 3);
    const five = deadBoard();
    for (let c = 0; c < 5; c++) five[index(6, c)] = 9;
    expect(clearPoints(findMatches(five), 1)).toBe(5 * 10 + 50);
  });

  it('detects valid moves, and none on a dead board', () => {
    expect(findValidMove(deadBoard())).toBeNull();
    expect(validMoves(deadBoard())).toEqual([]);
    const one = oneMoveBoard();
    expect(findMatches(one).cells).toEqual([]);
    expect(validMoves(one)).toEqual([{ a: index(0, 2), b: index(1, 2) }]);
    expect(swapMakesMatch(one, index(0, 2), index(1, 2))).toBe(true);
    expect(swapMakesMatch(one, index(0, 2), index(0, 4))).toBe(false);
    expect(one).toEqual(oneMoveBoard());
  });
});

describe('Match-3 gravity and refill', () => {
  it('drops gems into empty cells and reports how far they fell', () => {
    const b = deadBoard();
    const col = 3;
    const above = [b[index(0, col)], b[index(1, col)], b[index(2, col)]];
    clearCells(b, [index(3, col), index(4, col)]);
    const falls = applyGravity(b);
    expect(falls).toHaveLength(3);
    expect(falls.every((f) => f.rows === 2)).toBe(true);
    expect([b[index(2, col)], b[index(3, col)], b[index(4, col)]]).toEqual(above);
    expect(b[index(0, col)]).toBe(EMPTY);
    expect(b[index(1, col)]).toBe(EMPTY);
  });

  it('refills every empty cell without creating new matches', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = createRng(seed);
      const b = generateBoard(rng);
      const cleared: number[] = [];
      for (let i = 0; i < CELLS; i++) if (rng() < 0.3) cleared.push(i);
      clearCells(b, cleared);
      applyGravity(b);
      const oldMatches = findMatches(b).cells.length;
      const falls = refill(b, rng);
      expect(b.every((t) => t !== EMPTY)).toBe(true);
      expect(falls).toHaveLength(cleared.length);
      if (oldMatches === 0) expect(findMatches(b).cells).toEqual([]);
    }
  });
});

describe('Match-3 cascades', () => {
  it('always terminates within the cascade cap and leaves no matches', () => {
    let maxSteps = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const rng = createRng(seed);
      const b = generateBoard(rng);
      for (let move = 0; move < 10; move++) {
        const moves = validMoves(b);
        if (moves.length === 0) break;
        const m = moves[Math.floor(rng() * moves.length)]!;
        swap(b, m.a, m.b);
        const res = resolveBoard(b, rng);
        expect(res.steps).toBeGreaterThanOrEqual(1);
        expect(res.steps).toBeLessThanOrEqual(MAX_CASCADES);
        expect(findMatches(b).cells).toEqual([]);
        maxSteps = Math.max(maxSteps, res.steps);
      }
    }
    expect(maxSteps).toBeGreaterThanOrEqual(2);
  });

  it('multiplies the points of each cascade step', () => {
    const b = deadBoard();
    b[index(5, 1)] = 9;
    b[index(5, 2)] = 9;
    b[index(5, 3)] = 9;
    b[index(4, 2)] = 7;
    b[index(6, 2)] = 7;
    b[index(7, 2)] = 7;
    const rng = createRng(1);
    const first = findMatches(b);
    expect(first.cells).toEqual([index(5, 1), index(5, 2), index(5, 3)]);
    expect(clearPoints(first, 1)).toBe(30);
    clearCells(b, first.cells);
    applyGravity(b);
    refill(b, rng);
    const second = findMatches(b);
    expect(second.cells).toEqual(expect.arrayContaining([index(5, 2), index(6, 2), index(7, 2)]));
    expect(clearPoints(second, 2)).toBe(2 * clearPoints(second, 1));

    const again = deadBoard();
    again[index(5, 1)] = 9;
    again[index(5, 2)] = 9;
    again[index(5, 3)] = 9;
    again[index(4, 2)] = 7;
    again[index(6, 2)] = 7;
    again[index(7, 2)] = 7;
    const res = resolveBoard(again, createRng(1));
    expect(res.steps).toBeGreaterThanOrEqual(2);
    expect(res.points).toBeGreaterThanOrEqual(30 + 60);
    expect(res.capped).toBe(false);
  });
});

describe('Match-3 reshuffle', () => {
  it('keeps the same gems, removes matches and guarantees a move', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const before = deadBoard();
      const after = reshuffle(before, createRng(seed));
      expect([...after].sort()).toEqual([...before].sort());
      expect(findMatches(after).cells).toEqual([]);
      expect(findValidMove(after)).not.toBeNull();
    }
  });
});

describe('Match-3 simulation', () => {
  it('rejects a swap that makes no match without using a move', () => {
    const sim = new Match3Simulation({ seed: 1, modifier: null });
    sim.board = oneMoveBoard();
    const before = sim.board.slice();
    expect(sim.trySwap(index(3, 3), index(3, 4))).toBe(true);
    runUntilIdle(sim);
    expect(sim.board).toEqual(before);
    expect(sim.movesLeft).toBe(MOVES_PER_LEVEL);
    expect(sim.score).toBe(0);
    expect(sim.drainCues()).toContain('invalid');
  });

  it('ignores swaps of cells that are not neighbours', () => {
    const sim = new Match3Simulation({ seed: 1, modifier: null });
    expect(sim.trySwap(0, 2)).toBe(false);
    expect(sim.trySwap(0, 9)).toBe(false);
    expect(sim.phase).toBe('idle');
  });

  it('clears a valid swap, scores it and uses one move', () => {
    const sim = new Match3Simulation({ seed: 2, modifier: null });
    sim.board = oneMoveBoard();
    sim.trySwap(index(0, 2), index(1, 2));
    runUntilIdle(sim);
    expect(sim.movesLeft).toBe(MOVES_PER_LEVEL - 1);
    expect(sim.score).toBeGreaterThanOrEqual(30);
    expect(sim.board.every((t) => t !== EMPTY)).toBe(true);
    expect(findMatches(sim.board).cells).toEqual([]);
  });

  it('swaps with a pointer swipe', () => {
    const sim = new Match3Simulation({ seed: 2, modifier: null });
    sim.board = oneMoveBoard();
    const a = centre(1, 2);
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, pressed: true, moved: true, ...a }));
    sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, moved: true, x: a.x + 2, y: a.y - 40 }));
    expect(sim.phase).toBe('swap');
    runUntilIdle(sim);
    expect(sim.movesLeft).toBe(MOVES_PER_LEVEL - 1);
  });

  it('swaps by tapping two neighbouring gems', () => {
    const sim = new Match3Simulation({ seed: 2, modifier: null });
    sim.board = oneMoveBoard();
    const tap = (p: { x: number; y: number }) => {
      sim.update(STEP, makeInput(ACTIONS, {}, { inside: true, down: true, pressed: true, moved: true, ...p }));
      sim.update(STEP, makeInput(ACTIONS, {}, { inside: false, released: true, ...p }));
    };
    tap(centre(0, 2));
    expect(sim.selected).toBe(index(0, 2));
    tap(centre(1, 2));
    runUntilIdle(sim);
    expect(sim.movesLeft).toBe(MOVES_PER_LEVEL - 1);
  });

  it('swaps with the keyboard cursor: select, then an arrow', () => {
    const sim = new Match3Simulation({ seed: 2, modifier: null });
    sim.board = oneMoveBoard();
    sim.update(STEP, press('up'));
    sim.cursor = index(0, 2);
    sim.update(STEP, press('select'));
    expect(sim.selected).toBe(index(0, 2));
    sim.update(STEP, press('down'));
    expect(sim.phase).toBe('swap');
    runUntilIdle(sim);
    expect(sim.movesLeft).toBe(MOVES_PER_LEVEL - 1);
  });

  it('shuffles the board when no moves are left', () => {
    const sim = new Match3Simulation({ seed: 5, modifier: null });
    sim.board = deadBoard();
    (sim as unknown as { endMove(): void }).endMove();
    expect(sim.phase).toBe('shuffle');
    expect(sim.drainAnnouncements().join(' ')).toMatch(/Shuffling/);
    runUntilIdle(sim);
    expect(findValidMove(sim.board)).not.toBeNull();
    expect([...sim.board].sort()).toEqual([...deadBoard()].sort());
  });

  it('advances the level when the target is reached, with a bonus for moves left', () => {
    const sim = new Match3Simulation({ seed: 3, modifier: null });
    sim.board = oneMoveBoard();
    sim.levelScore = levelTarget(1) - 10;
    sim.trySwap(index(0, 2), index(1, 2));
    for (let i = 0; i < 400 && sim.phase !== 'levelUp'; i++) sim.update(STEP, none);
    expect(sim.phase).toBe('levelUp');
    expect(sim.levelBonus).toBe((MOVES_PER_LEVEL - 1) * MOVE_BONUS);
    runUntilIdle(sim, 1000);
    expect(sim.level).toBe(2);
    expect(sim.target).toBe(levelTarget(2));
    expect(sim.target).toBeGreaterThan(levelTarget(1));
    expect(sim.movesLeft).toBe(MOVES_PER_LEVEL);
    expect(sim.levelScore).toBe(0);
  });

  it('ends the game when the last move misses the target', () => {
    const sim = new Match3Simulation({ seed: 4, modifier: null });
    sim.board = oneMoveBoard();
    sim.movesLeft = 1;
    sim.trySwap(index(0, 2), index(1, 2));
    for (let i = 0; i < 2000 && !sim.outcome; i++) sim.update(STEP, none);
    expect(sim.movesLeft).toBe(0);
    expect(sim.outcome).toBe('lost');
    expect(sim.score).toBeGreaterThan(0);
  });

  it('plays many random moves without leaving matches or empty cells behind', () => {
    const sim = new Match3Simulation({ seed: 9, modifier: null });
    const rng = createRng(1);
    for (let n = 0; n < 200 && !sim.outcome; n++) {
      runUntilIdle(sim);
      if (sim.outcome) break;
      expect(findMatches(sim.board).cells).toEqual([]);
      expect(findValidMove(sim.board)).not.toBeNull();
      const moves = validMoves(sim.board);
      const m = rng() < 0.2 ? { a: 0, b: 1 } : moves[Math.floor(rng() * moves.length)]!;
      sim.trySwap(m.a, m.b);
    }
    expect(sim.movesMade).toBeGreaterThan(20);
  });
});
