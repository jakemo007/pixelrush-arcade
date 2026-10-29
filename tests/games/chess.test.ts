import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { MATE, Position, START_FEN, moveToUci, searchSync } from '@/games/chess/engine';
import { LEVELS, chooseEngineMove, endState, validatedMove } from '@/games/chess/bridge';
import { createRng } from '@/lib/utils/random';

const KIWIPETE = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
const POSITION_3 = '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1';
const POSITION_4 = 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1';

describe('move generator (perft)', () => {
  it('matches the start position counts to depth 3', () => {
    const pos = new Position(START_FEN);
    expect(pos.perft(1)).toBe(20);
    expect(pos.perft(2)).toBe(400);
    expect(pos.perft(3)).toBe(8902);
  });

  it('matches Kiwipete (castling, en passant, promotions, pins) to depth 2', () => {
    const pos = new Position(KIWIPETE);
    expect(pos.perft(1)).toBe(48);
    expect(pos.perft(2)).toBe(2039);
  });

  it('matches the en passant and promotion test positions', () => {
    const p3 = new Position(POSITION_3);
    expect(p3.perft(1)).toBe(14);
    expect(p3.perft(2)).toBe(191);
    expect(p3.perft(3)).toBe(2812);
    const p4 = new Position(POSITION_4);
    expect(p4.perft(1)).toBe(6);
    expect(p4.perft(2)).toBe(264);
    expect(p4.perft(3)).toBe(9467);
  });

  it('agrees with chess.js on every legal move after random games', () => {
    const rng = createRng(77);
    for (let game = 0; game < 6; game++) {
      const chess = new Chess();
      const pos = new Position(START_FEN);
      for (let ply = 0; ply < 60 && !chess.isGameOver(); ply++) {
        const ours = pos.legalMoves().map(moveToUci).sort();
        const theirs = chess
          .moves({ verbose: true })
          .map((m) => `${m.from}${m.to}${m.promotion ?? ''}`)
          .sort();
        expect(ours).toEqual(theirs);
        const pick = theirs[Math.floor(rng() * theirs.length)]!;
        chess.move({ from: pick.slice(0, 2), to: pick.slice(2, 4), promotion: pick[4] });
        pos.playUci(pick);
      }
    }
  });

  it('restores the position exactly after make and unmake', () => {
    const pos = new Position(KIWIPETE);
    const before = { board: pos.board.slice(), lo: pos.hashLo, hi: pos.hashHi, castling: pos.castling, ep: pos.ep };
    for (const m of pos.legalMoves()) {
      pos.make(m);
      pos.unmake();
    }
    expect(pos.board).toEqual(before.board);
    expect([pos.hashLo, pos.hashHi, pos.castling, pos.ep]).toEqual([before.lo, before.hi, before.castling, before.ep]);
  });
});

describe('engine search', () => {
  const mateInOne: [string, string, string][] = [
    ['back-rank mate', '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', 'd1d8'],
    ["scholar's mate", 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4', 'f3f7'],
    ['queen and king', '7k/8/6K1/8/8/8/8/1Q6 w - - 0 1', 'b1b8'],
    ['black to mate', '6k1/8/8/8/8/8/r4PPP/6K1 b - - 0 1', 'a2a1'],
    ['smothered mate', '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', 'g5f7'],
  ];

  it.each(mateInOne)('finds mate in one: %s', (_name, fen, expected) => {
    const pos = new Position(fen);
    const res = searchSync(pos, { timeMs: 2000, maxDepth: 3 })!;
    const chess = new Chess(fen);
    chess.move({ from: res.uci.slice(0, 2), to: res.uci.slice(2, 4), promotion: res.uci[4] });
    expect(chess.isCheckmate()).toBe(true);
    expect(res.uci).toBe(expected);
    expect(res.score).toBeGreaterThan(MATE - 10);
  });

  it('every level finds a mate in one', () => {
    for (const level of ['easy', 'medium', 'hard'] as const) {
      const reply = chooseEngineMove({ moves: [], fen: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', level, seed: 5 });
      expect(reply?.uci).toBe('d1d8');
    }
  });

  it('does not leave its queen to be captured at medium', () => {
    const fen = 'rnb1kbnr/pppp1ppp/8/4p3/3qP3/2N2N2/PPPP1PPP/R1BQKB1R b KQkq - 0 4';
    const reply = chooseEngineMove({ moves: [], fen, level: 'medium', seed: 1 })!;
    const chess = new Chess(fen);
    chess.move({ from: reply.uci.slice(0, 2), to: reply.uci.slice(2, 4), promotion: reply.uci[4] });
    const queen = chess.board().flat().find((p) => p?.type === 'q' && p.color === 'b');
    expect(queen).toBeDefined();
    expect(chess.attackers(queen!.square, 'w')).toHaveLength(0);
  });

  it('takes a free queen', () => {
    const fen = 'rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
    const reply = chooseEngineMove({ moves: [], fen, level: 'medium', seed: 2 })!;
    expect(reply.uci).toBe('f3h4');
  });

  it('always returns a legal move at every level', () => {
    const rng = createRng(9);
    const chess = new Chess();
    const played: string[] = [];
    for (let ply = 0; ply < 16; ply++) {
      const legal = chess.moves({ verbose: true });
      const m = legal[Math.floor(rng() * legal.length)]!;
      chess.move(m);
      played.push(`${m.from}${m.to}${m.promotion ?? ''}`);
      if (ply % 5 === 4) {
        for (const level of ['easy', 'medium'] as const) {
          const reply = chooseEngineMove({ moves: played, level, seed: ply, timeMs: 150 });
          expect(reply).not.toBeNull();
          expect(validatedMove(chess, reply!.uci)).not.toBeNull();
        }
      }
    }
  });

  it('leaves the position unchanged after a search that runs out of time', () => {
    const pos = new Position(KIWIPETE);
    const board = pos.board.slice();
    const hash = [pos.hashLo, pos.hashHi];
    searchSync(pos, { timeMs: 30, maxDepth: 64 });
    expect(pos.board).toEqual(board);
    expect([pos.hashLo, pos.hashHi]).toEqual(hash);
    expect(pos.ply).toBe(0);
  });

  it('converts king and queen against king into checkmate', () => {
    const pos = new Position('8/8/4k3/8/8/3QK3/8/8 w - - 0 1');
    const chess = new Chess('8/8/4k3/8/8/3QK3/8/8 w - - 0 1');
    for (let ply = 0; ply < 40 && !chess.isGameOver(); ply++) {
      const res = searchSync(pos, { timeMs: 150, maxDepth: 64 })!;
      expect(validatedMove(chess, res.uci)).not.toBeNull();
      chess.move({ from: res.uci.slice(0, 2), to: res.uci.slice(2, 4), promotion: res.uci[4] });
      pos.playUci(res.uci);
    }
    expect(chess.isCheckmate()).toBe(true);
  });

  it('evaluates an extra queen as winning', () => {
    const pos = new Position('6k1/8/8/8/8/8/8/4K2Q w - - 0 1');
    const res = searchSync(pos, { timeMs: 500, maxDepth: 4 })!;
    expect(res.score).toBeGreaterThan(500);
  });

  it('defines increasing strength for the levels', () => {
    expect(LEVELS.easy.maxDepth).toBeLessThan(LEVELS.medium.maxDepth);
    expect(LEVELS.medium.timeMs).toBeLessThan(LEVELS.hard.timeMs);
    expect(LEVELS.easy.marginCp).toBeGreaterThan(0);
  });
});

describe('move validation', () => {
  it('accepts engine moves only when chess.js agrees, including the promotion piece', () => {
    const chess = new Chess('8/4P1k1/8/8/8/8/8/4K3 w - - 0 1');
    expect(validatedMove(chess, 'e7e8q')?.promotion).toBe('q');
    expect(validatedMove(chess, 'e7e8n')?.promotion).toBe('n');
    expect(validatedMove(chess, 'e7e8')).toBeNull();
    expect(validatedMove(chess, 'e1e3')).toBeNull();
    const pos = new Position('8/4P1k1/8/8/8/8/8/4K3 w - - 0 1');
    expect(pos.legalMoves().map(moveToUci).filter((m) => m.startsWith('e7')).sort()).toEqual(['e7e8b', 'e7e8n', 'e7e8q', 'e7e8r']);
  });
});

describe('game end detection (chess.js)', () => {
  it("detects fool's mate", () => {
    const chess = new Chess();
    for (const san of ['f3', 'e5', 'g4', 'Qh4#']) chess.move(san);
    expect(endState(chess)).toEqual({ outcome: 'checkmate', winner: 'b', reason: 'Checkmate' });
  });

  it('detects stalemate', () => {
    const chess = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(endState(chess)).toEqual({ outcome: 'draw', reason: 'Draw by stalemate' });
  });

  it('detects insufficient material', () => {
    expect(endState(new Chess('8/8/8/4k3/8/8/4K3/5B2 w - - 0 1'))?.reason).toBe('Draw by insufficient material');
    expect(endState(new Chess('8/8/8/4k3/8/8/4K3/8 w - - 0 1'))?.reason).toBe('Draw by insufficient material');
  });

  it('detects threefold repetition', () => {
    const chess = new Chess();
    for (const san of ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8']) chess.move(san);
    expect(endState(chess)?.reason).toBe('Draw by threefold repetition');
  });

  it('detects the fifty-move rule', () => {
    const chess = new Chess('8/8/8/4k3/8/8/4K3/4R3 w - - 99 80');
    chess.move('Ra1');
    expect(endState(chess)?.reason).toBe('Draw by the fifty-move rule');
  });

  it('reports nothing while the game goes on', () => {
    expect(endState(new Chess())).toBeNull();
  });
});
