import { describe, expect, it } from 'vitest';
import { chooseColumn, DIFFICULTIES, evaluate, scoreColumns } from '@/games/drop-four/ai';
import {
  CELLS,
  cellIndex,
  COLS,
  connectedLine,
  discsInColumn,
  dropRow,
  gameStatus,
  initialState,
  legalColumns,
  playColumn,
  ROWS,
  type DropState,
} from '@/games/drop-four/rules';
import { createRng } from '@/lib/utils/random';

function fromMoves(cols: readonly number[]): DropState {
  let state = initialState();
  for (const col of cols) {
    const next = playColumn(state, col);
    if (!next) throw new Error(`illegal column ${col}`);
    state = next;
  }
  return state;
}

describe('Drop Four rules', () => {
  it('starts empty with player one to move', () => {
    const s = initialState();
    expect(s.board.every((v) => v === 0)).toBe(true);
    expect(s.turn).toBe(1);
    expect(legalColumns(s)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(gameStatus(s)).toEqual({ kind: 'playing' });
  });

  it('drops discs to the lowest free row and alternates players', () => {
    let s = initialState();
    expect(dropRow(s.board, 3)).toBe(ROWS - 1);
    s = playColumn(s, 3)!;
    expect(s.board[cellIndex(ROWS - 1, 3)]).toBe(1);
    expect(s.turn).toBe(2);
    s = playColumn(s, 3)!;
    expect(s.board[cellIndex(ROWS - 2, 3)]).toBe(2);
    expect(s.turn).toBe(1);
    expect(discsInColumn(s.board, 3)).toBe(2);
    expect(s.moves).toBe(2);
  });

  it('does not change the previous state when a move is played', () => {
    const s = initialState();
    playColumn(s, 0);
    expect(s.board.every((v) => v === 0)).toBe(true);
    expect(s.moves).toBe(0);
  });

  it('rejects full and out-of-range columns', () => {
    const s = fromMoves([0, 0, 0, 0, 0, 0]);
    expect(dropRow(s.board, 0)).toBe(-1);
    expect(playColumn(s, 0)).toBeNull();
    expect(legalColumns(s)).not.toContain(0);
    for (const bad of [-1, COLS, 1.5, NaN]) expect(playColumn(initialState(), bad)).toBeNull();
  });

  it('detects a horizontal win and returns the four cells', () => {
    const s = fromMoves([0, 0, 1, 1, 2, 2, 3]);
    const status = gameStatus(s);
    expect(status.kind).toBe('won');
    if (status.kind === 'won') {
      expect(status.winner).toBe(1);
      expect(status.line).toEqual([0, 1, 2, 3].map((c) => cellIndex(ROWS - 1, c)));
    }
  });

  it('detects a vertical win', () => {
    const s = fromMoves([2, 3, 2, 3, 2, 3, 2]);
    expect(gameStatus(s)).toMatchObject({ kind: 'won', winner: 1 });
  });

  it('detects both diagonal wins', () => {
    const up = fromMoves([0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]);
    expect(gameStatus(up)).toMatchObject({ kind: 'won', winner: 1 });
    const down = fromMoves([6, 5, 5, 4, 4, 3, 4, 3, 3, 0, 3]);
    expect(gameStatus(down)).toMatchObject({ kind: 'won', winner: 1 });
  });

  it('credits the win to the player who moved last', () => {
    const s = fromMoves([0, 6, 1, 6, 2, 6, 5, 6]);
    expect(gameStatus(s)).toMatchObject({ kind: 'won', winner: 2 });
  });

  it('highlights every disc in a run longer than four', () => {
    const s = fromMoves([0, 0, 1, 1, 3, 3, 4, 4, 2]);
    const status = gameStatus(s);
    expect(status.kind).toBe('won');
    if (status.kind === 'won') expect(status.line).toHaveLength(5);
  });

  it('does not report three in a row as a win', () => {
    expect(gameStatus(fromMoves([0, 0, 1, 1, 2]))).toEqual({ kind: 'playing' });
  });

  it('reports a draw when the board fills without a win', () => {
    const pattern = [
      [1, 1, 1, 2, 1, 1],
      [2, 2, 2, 1, 2, 2],
      [1, 1, 1, 2, 1, 1],
      [2, 2, 2, 1, 2, 2],
      [1, 1, 1, 2, 2, 1],
      [2, 2, 2, 1, 1, 2],
      [1, 1, 1, 2, 2, 2],
    ];
    const board = new Int8Array(CELLS);
    pattern.forEach((column, c) => column.forEach((player, k) => (board[cellIndex(ROWS - 1 - k, c)] = player)));
    for (let i = 0; i < CELLS; i++) expect(connectedLine(board, i)).toBeNull();
    const state: DropState = { board, turn: 1, moves: CELLS, last: cellIndex(0, 6) };
    expect(gameStatus(state)).toEqual({ kind: 'draw' });
    expect(legalColumns(state)).toEqual([]);
  });
});

describe('Drop Four computer', () => {
  it('has three increasing difficulty levels', () => {
    expect(DIFFICULTIES.easy.depth).toBeLessThan(DIFFICULTIES.medium.depth);
    expect(DIFFICULTIES.medium.depth).toBeLessThan(DIFFICULTIES.hard.depth);
  });

  it('scores a mirrored position symmetrically and prefers the centre', () => {
    const left = fromMoves([0]);
    const right = fromMoves([6]);
    expect(evaluate(left.board, 1)).toBe(evaluate(right.board, 1));
    expect(evaluate(fromMoves([3]).board, 1)).toBeGreaterThan(evaluate(left.board, 1));
  });

  it('takes an immediate win at every difficulty', () => {
    const state = fromMoves([0, 6, 1, 6, 2, 5]);
    for (const level of Object.values(DIFFICULTIES)) {
      expect(chooseColumn(state, { ...level, rng: createRng(3) })).toBe(3);
    }
  });

  it('blocks an immediate loss at medium and hard', () => {
    const state = fromMoves([0, 6, 1, 5, 2]);
    expect(state.turn).toBe(2);
    expect(chooseColumn(state, { ...DIFFICULTIES.medium })).toBe(3);
    expect(chooseColumn(state, { ...DIFFICULTIES.hard })).toBe(3);
  });

  it('blocks a vertical threat', () => {
    const state = fromMoves([4, 0, 4, 1, 4]);
    expect(chooseColumn(state, { ...DIFFICULTIES.medium })).toBe(4);
  });

  it('is deterministic without a random source and opens in the centre', () => {
    const a = chooseColumn(initialState(), { ...DIFFICULTIES.hard });
    const b = chooseColumn(initialState(), { ...DIFFICULTIES.hard });
    expect(a).toBe(b);
    expect(a).toBe(3);
  });

  it('never chooses a full column and returns -1 on a full board', () => {
    const state = fromMoves([3, 3, 3, 3, 3, 3]);
    for (const level of Object.values(DIFFICULTIES)) {
      for (let seed = 1; seed <= 20; seed++) {
        const col = chooseColumn(state, { ...level, rng: createRng(seed) });
        expect(legalColumns(state)).toContain(col);
      }
    }
    const full: DropState = { board: new Int8Array(CELLS).fill(1), turn: 1, moves: CELLS, last: 0 };
    expect(chooseColumn(full, { ...DIFFICULTIES.easy })).toBe(-1);
  });

  it('easy sometimes plays at random, medium and hard never do', () => {
    const state = fromMoves([3]);
    const picks = new Set<number>();
    for (let seed = 1; seed <= 60; seed++) picks.add(chooseColumn(state, { ...DIFFICULTIES.easy, rng: createRng(seed) }));
    expect(picks.size).toBeGreaterThan(2);
    const medium = new Set<number>();
    for (let seed = 1; seed <= 20; seed++) medium.add(chooseColumn(state, { ...DIFFICULTIES.medium, rng: createRng(seed) }));
    expect(medium.size).toBeLessThanOrEqual(2);
  });

  it('scores every legal column', () => {
    const state = fromMoves([3, 3]);
    expect(scoreColumns(state, 3).map((s) => s.col).sort()).toEqual(legalColumns(state));
  });

  it('beats a random player every time at hard and medium', () => {
    for (const level of ['medium', 'hard'] as const) {
      for (let game = 0; game < 6; game++) {
        const rng = createRng(100 + game);
        let state = initialState();
        const computerIsOne = game % 2 === 0;
        while (gameStatus(state).kind === 'playing') {
          const computerTurn = (state.turn === 1) === computerIsOne;
          const legal = legalColumns(state);
          const col = computerTurn ? chooseColumn(state, { ...DIFFICULTIES[level] }) : legal[Math.floor(rng() * legal.length)]!;
          state = playColumn(state, col)!;
        }
        const status = gameStatus(state);
        expect(status.kind, `${level} game ${game}`).toBe('won');
        if (status.kind === 'won') expect(status.winner === 1, `${level} game ${game}`).toBe(computerIsOne);
      }
    }
  });

  it('answers within a reasonable time at the hardest level', () => {
    const state = fromMoves([3, 2, 4, 3, 2, 4]);
    const started = performance.now();
    chooseColumn(state, { ...DIFFICULTIES.hard });
    expect(performance.now() - started).toBeLessThan(1500);
  });
});
