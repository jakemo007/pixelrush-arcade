import { describe, expect, it } from 'vitest';
import stackfallDefinition from '@/games/stackfall';
import { meta } from '@/games/stackfall/meta';
import { PIECE_TYPES, pieceCells, pieceSize, shuffledBag, type PieceType } from '@/games/stackfall/pieces';
import {
  absoluteCells,
  CELL,
  clearPoints,
  collides,
  COLS,
  emptyBoard,
  fullRows,
  gravityInterval,
  HOLD_BOX,
  levelForRows,
  LOCK_DELAY,
  MAX_LEVEL,
  MAX_LOCK_RESETS,
  removeRows,
  ROWS,
  spawnPiece,
  STACKFALL_ACTIONS,
  StackfallSimulation,
  type StackfallAction,
} from '@/games/stackfall/simulation';
import { createRng } from '@/lib/utils/random';
import { makeInput, STEP } from '../helpers';

const none = makeInput<StackfallAction>(STACKFALL_ACTIONS);
const press = (action: StackfallAction) => makeInput<StackfallAction>(STACKFALL_ACTIONS, { [action]: { pressed: true, held: true } });
const hold = (action: StackfallAction) => makeInput<StackfallAction>(STACKFALL_ACTIONS, { [action]: { held: true } });

function newSim(seed = 1): StackfallSimulation {
  return new StackfallSimulation({ seed, modifier: null });
}

function advance(sim: StackfallSimulation, seconds: number, input = none): void {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i++) sim.update(STEP, input);
}

function forcePiece(sim: StackfallSimulation, type: PieceType): void {
  sim.active = spawnPiece(type);
}

function fillRow(sim: StackfallSimulation, y: number, gap?: number): void {
  for (let x = 0; x < COLS; x++) if (x !== gap) sim.board[y * COLS + x] = 1;
}

describe('Stackfall definition', () => {
  it('matches the catalogue canvas size', () => {
    expect(stackfallDefinition.width).toBe(meta.canvas.width);
    expect(stackfallDefinition.height).toBe(meta.canvas.height);
  });

  it('binds every action to at least one key and uses no key twice', () => {
    const keys = Object.values(stackfallDefinition.bindings).flat();
    for (const action of STACKFALL_ACTIONS) expect(stackfallDefinition.bindings[action].length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('pieces', () => {
  it('has seven shapes of four squares in every rotation', () => {
    expect(PIECE_TYPES).toHaveLength(7);
    for (const type of PIECE_TYPES) {
      for (let r = 0; r < 4; r++) {
        const cells = pieceCells(type, r);
        expect(cells).toHaveLength(4);
        expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(4);
        for (const c of cells) {
          expect(c.x).toBeGreaterThanOrEqual(0);
          expect(c.y).toBeGreaterThanOrEqual(0);
          expect(c.x).toBeLessThan(pieceSize(type));
          expect(c.y).toBeLessThan(pieceSize(type));
        }
      }
    }
  });

  it('returns to the starting orientation after four turns, and wraps negative rotations', () => {
    for (const type of PIECE_TYPES) {
      expect(pieceCells(type, 4)).toEqual(pieceCells(type, 0));
      expect(pieceCells(type, -1)).toEqual(pieceCells(type, 3));
    }
  });

  it('makes the straight piece flat, then upright', () => {
    expect(new Set(pieceCells('I', 0).map((c) => c.y)).size).toBe(1);
    expect(new Set(pieceCells('I', 1).map((c) => c.x)).size).toBe(1);
  });

  it('shuffles a bag containing each shape exactly once, deterministically', () => {
    const bag = shuffledBag(createRng(5));
    expect([...bag].sort()).toEqual([...PIECE_TYPES].sort());
    expect(shuffledBag(createRng(5))).toEqual(bag);
  });
});

describe('board rules', () => {
  it('treats walls, the floor and filled cells as collisions, but not the space above the board', () => {
    const board = emptyBoard();
    expect(collides(board, [{ x: -1, y: 5 }])).toBe(true);
    expect(collides(board, [{ x: COLS, y: 5 }])).toBe(true);
    expect(collides(board, [{ x: 3, y: ROWS }])).toBe(true);
    expect(collides(board, [{ x: 3, y: -2 }])).toBe(false);
    board[5 * COLS + 3] = 2;
    expect(collides(board, [{ x: 3, y: 5 }])).toBe(true);
    expect(collides(board, [{ x: 4, y: 5 }])).toBe(false);
  });

  it('finds full rows and ignores rows with a gap', () => {
    const board = emptyBoard();
    for (let x = 0; x < COLS; x++) board[19 * COLS + x] = 1;
    for (let x = 0; x < COLS - 1; x++) board[18 * COLS + x] = 1;
    expect(fullRows(board)).toEqual([19]);
  });

  it('removes rows and drops everything above them', () => {
    const board = emptyBoard();
    for (let x = 0; x < COLS; x++) board[19 * COLS + x] = 1;
    board[18 * COLS + 2] = 3;
    const next = removeRows(board, [19]);
    expect(next).toHaveLength(COLS * ROWS);
    expect(next[19 * COLS + 2]).toBe(3);
    expect(fullRows(next)).toEqual([]);
    expect(next.filter((v) => v !== 0)).toHaveLength(1);
  });

  it('removes several non-adjacent rows at once', () => {
    const board = emptyBoard();
    for (const y of [15, 17]) for (let x = 0; x < COLS; x++) board[y * COLS + x] = 1;
    board[16 * COLS] = 4;
    const next = removeRows(board, [15, 17]);
    expect(next[17 * COLS]).toBe(4);
    expect(next.filter((v) => v !== 0)).toHaveLength(1);
  });
});

describe('scoring and speed', () => {
  it('scores 100/300/500/800 times the level', () => {
    expect([1, 2, 3, 4].map((n) => clearPoints(n, 1))).toEqual([100, 300, 500, 800]);
    expect(clearPoints(4, 3)).toBe(2400);
    expect(clearPoints(0, 5)).toBe(0);
    expect(clearPoints(9, 1)).toBe(800);
  });

  it('raises the level every 10 rows up to the maximum', () => {
    expect(levelForRows(0)).toBe(1);
    expect(levelForRows(9)).toBe(1);
    expect(levelForRows(10)).toBe(2);
    expect(levelForRows(10_000)).toBe(MAX_LEVEL);
    expect(levelForRows(-4)).toBe(1);
  });

  it('matches the speeds quoted on the page', () => {
    expect(gravityInterval(1)).toBe(1);
    expect(gravityInterval(5)).toBeCloseTo(0.36, 1);
    expect(gravityInterval(10)).toBeCloseTo(0.06, 1);
    expect(gravityInterval(12)).toBeGreaterThan(0.02);
    expect(gravityInterval(13)).toBe(0.02);
    expect(gravityInterval(MAX_LEVEL)).toBe(0.02);
  });

  it('never gets slower as the level rises', () => {
    for (let l = 2; l <= MAX_LEVEL; l++) expect(gravityInterval(l)).toBeLessThanOrEqual(gravityInterval(l - 1));
  });
});

describe('a run', () => {
  it('starts with a piece at the top centre, three upcoming pieces and an empty board', () => {
    const sim = newSim();
    expect(sim.active).not.toBeNull();
    expect(sim.active!.y).toBe(0);
    expect(sim.active!.x).toBe(Math.floor((COLS - pieceSize(sim.active!.type)) / 2));
    expect(sim.peekNext()).toHaveLength(3);
    expect(sim.board.every((v) => v === 0)).toBe(true);
    expect(sim.outcome).toBeNull();
    expect(sim.getHud().map((h) => h.id)).toEqual(['level', 'rows']);
  });

  it('is deterministic for a seed and different across seeds', () => {
    const order = (seed: number) => {
      const sim = newSim(seed);
      return [sim.active!.type, ...sim.peekNext(3)].join('');
    };
    expect(order(7)).toBe(order(7));
    const seen = new Set([1, 2, 3, 4, 5, 6].map(order));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('deals every shape once in each set of seven', () => {
    const sim = newSim(3);
    const dealt: PieceType[] = [sim.active!.type];
    for (let i = 0; i < 13; i++) {
      sim.hardDrop();
      sim.board.fill(0);
      dealt.push(sim.active!.type);
    }
    expect([...dealt.slice(0, 7)].sort()).toEqual([...PIECE_TYPES].sort());
    expect([...dealt.slice(7, 14)].sort()).toEqual([...PIECE_TYPES].sort());
  });

  it('falls one row after one second at level 1', () => {
    const sim = newSim();
    const y = sim.active!.y;
    advance(sim, 0.9);
    expect(sim.active!.y).toBe(y);
    advance(sim, 0.2);
    expect(sim.active!.y).toBe(y + 1);
  });

  it('moves left and right, and stops at the walls', () => {
    const sim = newSim();
    forcePiece(sim, 'T');
    for (let i = 0; i < 12; i++) sim.move(-1);
    expect(Math.min(...absoluteCells(sim.active!).map((c) => c.x))).toBe(0);
    expect(sim.move(-1)).toBe(false);
    for (let i = 0; i < 12; i++) sim.move(1);
    expect(Math.max(...absoluteCells(sim.active!).map((c) => c.x))).toBe(COLS - 1);
    expect(sim.move(1)).toBe(false);
  });

  it('moves one column on a key press and repeats while the key is held', () => {
    const sim = newSim();
    forcePiece(sim, 'O');
    const x = sim.active!.x;
    sim.update(STEP, press('left'));
    expect(sim.active!.x).toBe(x - 1);
    advance(sim, 0.1, hold('left'));
    expect(sim.active!.x).toBe(x - 1);
    advance(sim, 0.3, hold('left'));
    expect(sim.active!.x).toBeLessThan(x - 1);
    const stopped = sim.active!.x;
    advance(sim, 0.3, none);
    expect(sim.active!.x).toBe(stopped);
  });

  it('turns pieces, but not the square', () => {
    const sim = newSim();
    forcePiece(sim, 'T');
    expect(sim.rotate(1)).toBe(true);
    expect(sim.active!.rotation).toBe(1);
    expect(sim.rotate(-1)).toBe(true);
    expect(sim.active!.rotation).toBe(0);
    forcePiece(sim, 'O');
    expect(sim.rotate(1)).toBe(false);
    expect(sim.active!.rotation).toBe(0);
  });

  it('nudges a turning piece away from the wall instead of refusing', () => {
    const sim = newSim();
    forcePiece(sim, 'I');
    sim.rotate(1);
    for (let i = 0; i < 12; i++) sim.move(1);
    expect(sim.rotate(1)).toBe(true);
    for (const c of absoluteCells(sim.active!)) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.x).toBeLessThan(COLS);
    }
  });

  it('ignores a turn that has nowhere to go', () => {
    const sim = newSim();
    forcePiece(sim, 'I');
    sim.active = { type: 'I', rotation: 0, x: 3, y: 10 };
    for (let y = 8; y < 14; y++) fillRow(sim, y);
    for (const c of absoluteCells(sim.active)) sim.board[c.y * COLS + c.x] = 0;
    const before = { ...sim.active };
    expect(sim.rotate(1)).toBe(false);
    expect(sim.active).toEqual(before);
  });

  it('hard drops to the ghost position, scoring 2 points per row', () => {
    const sim = newSim();
    forcePiece(sim, 'O');
    const ghost = sim.ghostY();
    const rowsFallen = ghost - sim.active!.y;
    sim.update(STEP, press('drop'));
    expect(sim.score).toBe(rowsFallen * 2);
    expect(sim.pieces).toBe(1);
    const cells = sim.board.filter((v) => v !== 0);
    expect(cells).toHaveLength(4);
    expect(sim.board[(ROWS - 1) * COLS + 4]).not.toBe(0);
    expect(sim.drainCues()).toContain('place');
  });

  it('scores 1 point per row during a soft drop', () => {
    const sim = newSim();
    forcePiece(sim, 'O');
    advance(sim, 0.3, hold('down'));
    expect(sim.active!.y).toBeGreaterThan(3);
    expect(sim.score).toBe(sim.active!.y);
  });

  it('waits for the lock delay, and a slide resets it a limited number of times', () => {
    const sim = newSim();
    forcePiece(sim, 'O');
    sim.active = { ...sim.active!, y: sim.ghostY() };
    advance(sim, LOCK_DELAY - 0.1);
    expect(sim.pieces).toBe(0);
    sim.move(1);
    advance(sim, LOCK_DELAY - 0.1);
    expect(sim.pieces).toBe(0);
    advance(sim, 0.2);
    expect(sim.pieces).toBe(1);

    const stall = newSim();
    forcePiece(stall, 'O');
    stall.active = { ...stall.active!, y: stall.ghostY() };
    for (let i = 0; i < MAX_LOCK_RESETS + 6 && stall.pieces === 0; i++) {
      stall.move(i % 2 === 0 ? 1 : -1);
      advance(stall, LOCK_DELAY - 0.05);
    }
    advance(stall, LOCK_DELAY + 0.05);
    expect(stall.pieces).toBeGreaterThanOrEqual(1);
  });

  it('clears a completed row, scores it and brings down the rows above', () => {
    const sim = newSim();
    fillRow(sim, ROWS - 1, 4);
    fillRow(sim, ROWS - 1, 5);
    for (let x = 0; x < COLS; x++) sim.board[(ROWS - 1) * COLS + x] = x === 4 || x === 5 ? 0 : 1;
    sim.board[(ROWS - 2) * COLS + 0] = 6;
    forcePiece(sim, 'O');
    sim.update(STEP, press('drop'));
    expect(sim.phase).toBe('clearing');
    expect(sim.rows).toBe(0 + 1);
    expect(sim.score).toBeGreaterThanOrEqual(100);
    expect(sim.drainAnnouncements()).toContain('1 row cleared.');
    advance(sim, 0.4);
    expect(sim.phase).toBe('playing');
    expect(fullRows(sim.board)).toEqual([]);
    expect(sim.board[(ROWS - 1) * COLS + 0]).toBe(6);
  });

  it('scores four rows at once with the long piece', () => {
    const sim = newSim();
    for (let y = ROWS - 4; y < ROWS; y++) fillRow(sim, y, 9);
    forcePiece(sim, 'I');
    sim.rotate(1);
    sim.active = { ...sim.active!, x: 9 - 2 };
    const dropped = sim.ghostY() - sim.active!.y;
    sim.update(STEP, press('drop'));
    expect(sim.rows).toBe(4);
    expect(sim.score).toBe(800 + dropped * 2);
    expect(sim.drainCues()).toContain('explode');
    advance(sim, 0.4);
    expect(sim.board.every((v) => v === 0)).toBe(true);
  });

  it('ignores input while rows are clearing', () => {
    const sim = newSim();
    for (let x = 0; x < COLS; x++) sim.board[(ROWS - 1) * COLS + x] = x < 2 ? 0 : 1;
    forcePiece(sim, 'O');
    sim.active = { ...sim.active!, x: 0 };
    sim.hardDrop();
    expect(sim.phase).toBe('clearing');
    expect(sim.active).toBeNull();
    expect(sim.move(1)).toBe(false);
    expect(sim.rotate(1)).toBe(false);
    expect(sim.holdPiece()).toBe(false);
    sim.hardDrop();
    expect(sim.pieces).toBe(1);
  });

  it('levels up after ten rows and announces it', () => {
    const sim = newSim();
    sim.rows = 9;
    for (let x = 0; x < COLS; x++) sim.board[(ROWS - 1) * COLS + x] = x < 2 ? 0 : 1;
    forcePiece(sim, 'O');
    sim.active = { ...sim.active!, x: 0 };
    sim.hardDrop();
    expect(sim.level).toBe(2);
    expect(sim.drainAnnouncements()).toContain('Level 2');
    expect(sim.drainCues()).toContain('levelUp');
  });

  it('holds a piece once, and swaps back after the next piece lands', () => {
    const sim = newSim();
    forcePiece(sim, 'T');
    const upcoming = sim.peekNext(1)[0]!;
    expect(sim.holdPiece()).toBe(true);
    expect(sim.hold).toBe('T');
    expect(sim.active!.type).toBe(upcoming);
    expect(sim.holdPiece()).toBe(false);
    expect(sim.hold).toBe('T');
    expect(sim.drainCues()).toContain('invalid');
    sim.hardDrop();
    const current = sim.active!.type;
    expect(sim.holdPiece()).toBe(true);
    expect(sim.active!.type).toBe('T');
    expect(sim.active!.rotation).toBe(0);
    expect(sim.hold).toBe(current);
  });

  it('ends the run when a new piece cannot fit', () => {
    const sim = newSim();
    for (let y = 2; y < 6; y++) fillRow(sim, y, 0);
    sim.hardDrop();
    expect(sim.phase).toBe('dying');
    expect(sim.outcome).toBeNull();
    expect(sim.drainAnnouncements().join(' ')).toContain('Game over');
    advance(sim, 0.9);
    expect(sim.outcome).toBeNull();
    advance(sim, 0.5);
    expect(sim.outcome).toBe('lost');
    expect(sim.drainCues()).toContain('gameOver');
    const score = sim.score;
    advance(sim, 1, press('drop'));
    expect(sim.score).toBe(score);
  });

  it('reaches game over by dropping pieces in the middle of the board', () => {
    const sim = newSim(9);
    for (let i = 0; i < 80 && !sim.outcome; i++) {
      if (sim.phase === 'playing') sim.hardDrop();
      advance(sim, 0.4);
    }
    expect(sim.outcome).toBe('lost');
    expect(sim.score).toBeGreaterThan(0);
    expect(sim.getStats().pieces).toBe(sim.pieces);
  });

  it('never leaves a falling piece overlapping the stack mid-run', () => {
    const sim = newSim(4);
    const rng = createRng(11);
    for (let i = 0; i < 3000 && !sim.outcome; i++) {
      const roll = rng();
      let input = none;
      if (roll < 0.05) input = press('left');
      else if (roll < 0.1) input = press('right');
      else if (roll < 0.14) input = press('rotate');
      else if (roll < 0.16) input = press('hold');
      else if (roll < 0.17) input = press('drop');
      sim.update(STEP * 6, input);
      if (sim.active && sim.phase === 'playing') expect(collides(sim.board, absoluteCells(sim.active))).toBe(false);
    }
  });
});

describe('touch controls', () => {
  const pointer = (p: Partial<{ x: number; y: number; down: boolean; pressed: boolean; released: boolean }>) =>
    makeInput<StackfallAction>(STACKFALL_ACTIONS, {}, { inside: true, moved: true, ...p });

  it('turns the piece on a tap', () => {
    const sim = newSim();
    forcePiece(sim, 'T');
    sim.update(STEP, pointer({ x: 100, y: 200, down: true, pressed: true }));
    advance(sim, 0.05);
    sim.update(STEP, pointer({ x: 100, y: 200, released: true }));
    expect(sim.active!.rotation).toBe(1);
  });

  it('moves one column for each block width dragged', () => {
    const sim = newSim();
    forcePiece(sim, 'O');
    const x = sim.active!.x;
    sim.update(STEP, pointer({ x: 100, y: 200, down: true, pressed: true }));
    sim.update(STEP, pointer({ x: 100 + CELL * 2 + 2, y: 200, down: true }));
    expect(sim.active!.x).toBe(x + 2);
    sim.update(STEP, pointer({ x: 100 + CELL * 2 + 2 - CELL - 2, y: 200, down: true }));
    expect(sim.active!.x).toBe(x + 1);
    sim.update(STEP, pointer({ x: 100 + CELL + 2, y: 200, released: true }));
    expect(sim.active!.rotation).toBe(0);
  });

  it('hard drops on a quick downward flick', () => {
    const sim = newSim();
    forcePiece(sim, 'O');
    sim.update(STEP, pointer({ x: 100, y: 100, down: true, pressed: true }));
    advance(sim, 0.1, pointer({ x: 102, y: 150, down: true }));
    sim.update(STEP, pointer({ x: 102, y: 230, released: true }));
    expect(sim.pieces).toBe(1);
  });

  it('does not hard drop on a slow downward drag', () => {
    const sim = newSim();
    forcePiece(sim, 'O');
    sim.update(STEP, pointer({ x: 100, y: 100, down: true, pressed: true }));
    advance(sim, 0.5, pointer({ x: 100, y: 190, down: true }));
    sim.update(STEP, pointer({ x: 100, y: 190, released: true }));
    expect(sim.pieces).toBe(0);
    expect(sim.active!.y).toBeGreaterThan(2);
  });

  it('holds on a tap in the Hold box instead of turning', () => {
    const sim = newSim();
    forcePiece(sim, 'T');
    const x = HOLD_BOX.x + 20;
    const y = HOLD_BOX.y + 20;
    sim.update(STEP, pointer({ x, y, down: true, pressed: true }));
    sim.update(STEP, pointer({ x, y, released: true }));
    expect(sim.hold).toBe('T');
  });
});
