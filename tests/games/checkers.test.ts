import { describe, expect, it } from 'vitest';
import { chooseCheckersMove, evaluate, generate } from '@/games/checkers/ai';
import {
  applyMove,
  continuations,
  countPieces,
  destination,
  fromDiagram,
  gameStatus,
  initialState,
  legalMoves,
  sameMove,
  squareName,
  type CheckersState,
} from '@/games/checkers/rules';
import { createRng } from '@/lib/utils/random';

const sq = (r: number, c: number) => r * 8 + c;
const E = '........';

describe('setup', () => {
  it('starts with 12 men each, Dark to move with 7 options', () => {
    const s = initialState();
    expect(countPieces(s, 'dark')).toEqual({ men: 12, kings: 0 });
    expect(countPieces(s, 'light')).toEqual({ men: 12, kings: 0 });
    expect(s.turn).toBe('dark');
    expect(legalMoves(s)).toHaveLength(7);
    expect(legalMoves(s).every((m) => m.captures.length === 0)).toBe(true);
  });

  it('names squares like a chessboard', () => {
    expect(squareName(sq(7, 0))).toBe('a1');
    expect(squareName(sq(0, 7))).toBe('h8');
  });

  it('matches the fast search generator', () => {
    let s: CheckersState = initialState();
    const rng = createRng(3);
    for (let i = 0; i < 40; i++) {
      const moves = legalMoves(s);
      const fast = generate(Int8Array.from(s.board), s.turn === 'dark' ? 1 : -1);
      expect(fast.length).toBe(moves.length);
      if (moves.length === 0) break;
      s = applyMove(s, moves[Math.floor(rng() * moves.length)]!);
    }
  });
});

describe('moves', () => {
  it('moves men forward only and kings in every direction', () => {
    const men = fromDiagram([E, E, E, E, '...d....', E, E, E]);
    expect(legalMoves(men).map((m) => destination(m)).sort()).toEqual([sq(3, 2), sq(3, 4)].sort());
    const kings = fromDiagram([E, E, E, E, '...D....', E, E, E]);
    expect(legalMoves(kings)).toHaveLength(4);
    const light = fromDiagram([E, E, E, '....l...', E, E, E, E], 'light');
    expect(legalMoves(light).map((m) => destination(m)).sort()).toEqual([sq(4, 3), sq(4, 5)].sort());
  });

  it('makes captures mandatory', () => {
    const s = fromDiagram([E, E, E, E, '...l....', '..d...d.', E, E]);
    const moves = legalMoves(s);
    expect(moves).toHaveLength(1);
    expect(moves[0]!.from).toBe(sq(5, 2));
    expect(moves[0]!.captures).toEqual([sq(4, 3)]);
  });

  it('continues a multi-jump to the end', () => {
    const s = fromDiagram([E, E, '...l....', E, '.l......', 'd.......', E, E]);
    const moves = legalMoves(s);
    expect(moves).toHaveLength(1);
    expect(moves[0]!.path).toEqual([sq(3, 2), sq(1, 4)]);
    expect(moves[0]!.captures).toEqual([sq(4, 1), sq(2, 3)]);
    const after = applyMove(s, moves[0]!);
    expect(countPieces(after, 'light')).toEqual({ men: 0, kings: 0 });
    expect(continuations(moves, sq(5, 0), [])).toHaveLength(1);
    expect(continuations(moves, sq(5, 0), [sq(3, 2)])).toHaveLength(1);
  });

  it('lets the player choose any capture path, not only the longest', () => {
    const s = fromDiagram([E, E, '.....l..', E, '.l.l....', '..d.....', E, E]);
    const paths = legalMoves(s).map((m) => m.path.map((x) => squareName(x)).join('-'));
    expect(paths.sort()).toEqual(['a5', 'e5-g7'].sort());
  });

  it('crowns a man that reaches the far row and ends its move there', () => {
    const s = fromDiagram([E, '..l.l...', '.d......', E, E, E, E, E]);
    const moves = legalMoves(s);
    expect(moves).toHaveLength(1);
    expect(moves[0]!.path).toEqual([sq(0, 3)]);
    expect(moves[0]!.crowns).toBe(true);
    const after = applyMove(s, moves[0]!);
    expect(after.board[sq(0, 3)]).toBe(2);
    expect(after.board[sq(1, 4)]).toBe(-1);
    expect(after.turn).toBe('light');
  });

  it('crowns on a simple move too', () => {
    const s = fromDiagram([E, 'd.......', E, E, E, E, E, '.......l'.replace('l', '.')]);
    const m = legalMoves(s).find((x) => destination(x) === sq(0, 1))!;
    expect(m.crowns).toBe(true);
    expect(applyMove(s, m).board[sq(0, 1)]).toBe(2);
  });
});

describe('game end', () => {
  it('a side with no pieces loses', () => {
    const s = fromDiagram([E, E, E, E, '...d....', E, E, E], 'light');
    expect(gameStatus(s)).toEqual({ kind: 'won', winner: 'dark', reason: 'no-pieces' });
  });

  it('a side with no legal move loses', () => {
    const blocked = fromDiagram([E, E, E, E, E, E, '.l......', 'd.d.....'], 'light');
    expect(legalMoves(blocked)).toHaveLength(0);
    expect(gameStatus(blocked)).toEqual({ kind: 'won', winner: 'dark', reason: 'no-moves' });
  });

  it('draws after 40 moves each with only kings moving and no captures', () => {
    let s = fromDiagram(['.......L', E, E, E, E, E, E, 'D.......']);
    const shuttle = [sq(6, 1), sq(1, 6), sq(7, 0), sq(0, 7)];
    for (let i = 0; i < 80; i++) {
      expect(gameStatus(s).kind).toBe('playing');
      const m = legalMoves(s).find((x) => destination(x) === shuttle[i % 4])!;
      s = applyMove(s, m);
    }
    expect(s.quietPlies).toBe(80);
    expect(gameStatus(s)).toEqual({ kind: 'draw' });
  });

  it('resets the draw counter when a man moves or a capture is made', () => {
    const s = { ...fromDiagram([E, E, E, E, '...d....', E, E, '.......L'.replace('L', '.')]), quietPlies: 50 };
    expect(applyMove(s, legalMoves(s)[0]!).quietPlies).toBe(0);
  });
});

describe('computer opponent', () => {
  it('always returns a legal move', () => {
    const rng = createRng(11);
    let s: CheckersState = initialState();
    for (let i = 0; i < 24; i++) {
      const moves = legalMoves(s);
      if (moves.length === 0) break;
      if (i % 4 === 0) {
        const ai = chooseCheckersMove(s, { timeMs: 40 });
        expect(ai).not.toBeNull();
        expect(moves.some((m) => sameMove(m, ai!.move))).toBe(true);
      }
      s = applyMove(s, moves[Math.floor(rng() * moves.length)]!);
    }
  });

  it('takes the double jump over the single one', () => {
    const s = fromDiagram(['.l......', E, '.....l..', E, '.l.l....', '..d.....', E, E]);
    const ai = chooseCheckersMove(s, { timeMs: 200 })!;
    expect(ai.move.captures).toHaveLength(2);
  });

  it('does not give away a man for nothing', () => {
    const s = fromDiagram([E, E, E, '......l.', E, '....d...', E, 'd.......']);
    const ai = chooseCheckersMove(s, { timeMs: 200 })!;
    expect(squareName(destination(ai.move))).not.toBe('f4');
  });

  it('finds a winning capture sequence for Light as well', () => {
    const s = fromDiagram([E, E, '...l....', '..d.....', E, E, E, 'd.......'], 'light');
    const ai = chooseCheckersMove(s, { timeMs: 100 })!;
    expect(ai.move.captures).toEqual([sq(3, 2)]);
  });

  it('scores material for Dark as positive', () => {
    const ahead = fromDiagram([E, E, E, E, '...d....', '....d...', E, '.......l'.replace('l', '.')]);
    expect(evaluate(Int8Array.from(ahead.board))).toBeGreaterThan(0);
  });
});
