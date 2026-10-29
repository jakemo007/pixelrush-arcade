import { describe, expect, it } from 'vitest';
import { PlayClock } from '@/games/dom/clock';
import { meta } from '@/games/minesweeper/meta';
import {
  canChord,
  chord,
  countFlags,
  createBoard,
  DIFFICULTIES,
  difficultyFor,
  finishLoss,
  finishWin,
  isWon,
  minesLeft,
  neighbours,
  placeMines,
  reveal,
  toggleFlag,
  type Board,
} from '@/games/minesweeper/rules';
import { createRng } from '@/lib/utils/random';

function boardFrom(rows: string[]): Board {
  const board = createBoard({ rows: rows.length, cols: rows[0]!.length, mines: 0 });
  rows.forEach((line, r) => [...line].forEach((ch, c) => (board.cells[r * board.cols + c]!.mine = ch === '*')));
  board.mines = board.cells.filter((c) => c.mine).length;
  board.cells.forEach((cell, i) => (cell.adjacent = neighbours(board, i).filter((n) => board.cells[n]!.mine).length));
  board.minesPlaced = true;
  return board;
}

const idx = (b: Board, r: number, c: number) => r * b.cols + c;

describe('Minesweeper difficulties', () => {
  it('matches the classic sizes and the catalogue variants', () => {
    expect(DIFFICULTIES.beginner).toEqual({ rows: 9, cols: 9, mines: 10 });
    expect(DIFFICULTIES.intermediate).toEqual({ rows: 16, cols: 16, mines: 40 });
    expect(DIFFICULTIES.expert).toEqual({ rows: 16, cols: 30, mines: 99 });
    expect(meta.variants?.map((v) => v.id)).toEqual(['beginner', 'intermediate', 'expert']);
    expect(difficultyFor('nope')).toEqual(DIFFICULTIES.beginner);
  });
});

describe('Minesweeper mine placement', () => {
  it('places exactly the right number of mines', () => {
    for (const [name, d] of Object.entries(DIFFICULTIES)) {
      for (let seed = 1; seed <= 20; seed++) {
        const board = placeMines(createBoard(d), 0, createRng(seed));
        expect(board.cells.filter((c) => c.mine).length, name).toBe(d.mines);
      }
    }
  });

  it('keeps the first square and its neighbours free of mines', () => {
    for (const d of Object.values(DIFFICULTIES)) {
      for (let seed = 1; seed <= 50; seed++) {
        const rng = createRng(seed);
        const first = Math.floor(rng() * d.rows * d.cols);
        const board = placeMines(createBoard(d), first, rng);
        for (const i of [first, ...neighbours(board, first)]) expect(board.cells[i]!.mine).toBe(false);
      }
    }
  });

  it('makes the first reveal open an area', () => {
    const d = DIFFICULTIES.expert!;
    const result = reveal(createBoard(d), idx(createBoard(d), 8, 15), createRng(9));
    expect(result.hitMine).toBeNull();
    expect(result.board.minesPlaced).toBe(true);
    expect(result.board.cells[idx(result.board, 8, 15)]!.adjacent).toBe(0);
    expect(result.revealed.length).toBeGreaterThan(1);
  });

  it('is deterministic for a seed', () => {
    const d = DIFFICULTIES.intermediate!;
    const a = placeMines(createBoard(d), 40, createRng(77));
    const b = placeMines(createBoard(d), 40, createRng(77));
    expect(a.cells.map((c) => c.mine)).toEqual(b.cells.map((c) => c.mine));
  });

  it('still works on a board too crowded to spare the neighbours', () => {
    const board = placeMines(createBoard({ rows: 3, cols: 3, mines: 8 }), 4, createRng(1));
    expect(board.cells[4]!.mine).toBe(false);
    expect(board.cells.filter((c) => c.mine)).toHaveLength(8);
  });
});

describe('Minesweeper neighbour counts', () => {
  it('counts the mines in the 8 surrounding squares', () => {
    const b = boardFrom(['*..', '.*.', '..*']);
    expect(b.cells.map((c) => (c.mine ? '*' : c.adjacent)).join('')).toBe('*21' + '2*2' + '12*');
  });

  it('handles edges and corners', () => {
    const b = boardFrom(['....', '.**.', '....']);
    expect(neighbours(b, 0)).toHaveLength(3);
    expect(neighbours(b, 1)).toHaveLength(5);
    expect(neighbours(b, 5)).toHaveLength(8);
    expect(b.cells[0]!.adjacent).toBe(1);
    expect(b.cells[1]!.adjacent).toBe(2);
  });
});

describe('Minesweeper reveal and flood fill', () => {
  it('reveals a numbered square on its own', () => {
    const b = boardFrom(['*....', '.....', '.....']);
    const r = reveal(b, idx(b, 1, 1), createRng(1));
    expect(r.revealed).toEqual([idx(b, 1, 1)]);
    expect(r.hitMine).toBeNull();
  });

  it('flood-fills empty squares and stops at numbers', () => {
    const b = boardFrom(['*....', '.....', '.....']);
    const r = reveal(b, idx(b, 2, 4), createRng(1));
    expect(r.revealed).toHaveLength(14);
    expect(r.board.cells[0]!.state).toBe('hidden');
    expect(isWon(r.board)).toBe(true);
  });

  it('never reveals flagged squares during a flood fill', () => {
    let b = boardFrom(['*....', '.....', '.....']);
    b = toggleFlag(b, idx(b, 0, 4));
    const r = reveal(b, idx(b, 2, 4), createRng(1));
    expect(r.board.cells[idx(b, 0, 4)]!.state).toBe('flagged');
    expect(isWon(r.board)).toBe(false);
  });

  it('does nothing on flagged or already revealed squares', () => {
    let b = boardFrom(['*..', '...']);
    b = toggleFlag(b, 2);
    expect(reveal(b, 2, createRng(1)).revealed).toEqual([]);
    const opened = reveal(b, 4, createRng(1)).board;
    expect(reveal(opened, 4, createRng(1)).revealed).toEqual([]);
  });

  it('reports a revealed mine', () => {
    const b = boardFrom(['*..', '...']);
    const r = reveal(b, 0, createRng(1));
    expect(r.hitMine).toBe(0);
  });
});

describe('Minesweeper flags', () => {
  it('toggles flags on hidden squares only and updates the mines-left count', () => {
    let b = boardFrom(['*.', '..']);
    expect(minesLeft(b)).toBe(1);
    b = toggleFlag(b, 0);
    expect(b.cells[0]!.state).toBe('flagged');
    expect(minesLeft(b)).toBe(0);
    b = toggleFlag(b, 0);
    expect(b.cells[0]!.state).toBe('hidden');
    const opened = reveal(b, 3, createRng(1)).board;
    expect(toggleFlag(opened, 3)).toBe(opened);
    expect(minesLeft(toggleFlag(toggleFlag(b, 1), 2))).toBe(-1);
  });
});

describe('Minesweeper chording', () => {
  it('reveals the other neighbours when the flags match the number', () => {
    let b = boardFrom(['*..', '...', '...']);
    b = reveal(b, idx(b, 1, 1), createRng(1)).board;
    expect(canChord(b, idx(b, 1, 1))).toBe(false);
    b = toggleFlag(b, 0);
    expect(canChord(b, idx(b, 1, 1))).toBe(true);
    const r = chord(b, idx(b, 1, 1));
    expect(r.hitMine).toBeNull();
    expect(r.revealed).toHaveLength(7);
    expect(isWon(r.board)).toBe(true);
  });

  it('does nothing when the flag count does not match', () => {
    let b = boardFrom(['**.', '...', '...']);
    b = reveal(b, idx(b, 1, 1), createRng(1)).board;
    b = toggleFlag(b, 0);
    expect(chord(b, idx(b, 1, 1)).revealed).toEqual([]);
  });

  it('a wrong flag makes the chord hit a mine', () => {
    let b = boardFrom(['*..', '...', '...']);
    b = reveal(b, idx(b, 1, 1), createRng(1)).board;
    b = toggleFlag(b, 2);
    const r = chord(b, idx(b, 1, 1));
    expect(r.hitMine).toBe(0);
  });
});

describe('Minesweeper win and loss', () => {
  it('wins only when every safe square is revealed, then flags the mines', () => {
    let b = boardFrom(['*.', '..']);
    expect(isWon(b)).toBe(false);
    b = reveal(b, 1, createRng(1)).board;
    b = reveal(b, 2, createRng(1)).board;
    expect(isWon(b)).toBe(false);
    b = reveal(b, 3, createRng(1)).board;
    expect(isWon(b)).toBe(true);
    const done = finishWin(b);
    expect(done.cells[0]!.state).toBe('flagged');
    expect(countFlags(done)).toBe(1);
  });

  it('shows every mine and marks wrong flags after a loss', () => {
    let b = boardFrom(['*.*', '...', '*..']);
    b = toggleFlag(b, 2);
    b = toggleFlag(b, 4);
    const r = reveal(b, 0, createRng(1));
    const lost = finishLoss(r.board, r.hitMine!);
    expect(lost.cells[0]!.exploded).toBe(true);
    expect(lost.cells[0]!.state).toBe('revealed');
    expect(lost.cells[6]!.state).toBe('revealed');
    expect(lost.cells[2]!.state).toBe('flagged');
    expect(lost.cells[2]!.wrongFlag).toBeFalsy();
    expect(lost.cells[4]!.wrongFlag).toBe(true);
  });

  it('is not won before the mines are placed', () => {
    expect(isWon(createBoard({ rows: 2, cols: 2, mines: 0 }))).toBe(false);
  });
});

describe('Minesweeper timer', () => {
  it('counts only while running and reads exactly', () => {
    const clock = new PlayClock();
    expect(clock.read(1000)).toBe(0);
    clock.start(1000);
    expect(clock.read(1500)).toBe(500);
    clock.stop(2000);
    expect(clock.read(9000)).toBe(1000);
    clock.start(10000);
    clock.start(11000);
    expect(clock.read(10250)).toBe(1250);
  });
});
