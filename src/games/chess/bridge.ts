import type { Chess, Move } from 'chess.js';
import { createRng } from '@/lib/utils/random';
import { Position, START_FEN, searchPosition, type SearchOptions, type SliceClock } from './engine';

export type Level = 'easy' | 'medium' | 'hard';

export interface LevelConfig {
  maxDepth: number;
  timeMs: number;
  marginCp?: number;
}

export const LEVELS: Record<Level, LevelConfig> = {
  easy: { maxDepth: 1, timeMs: 500, marginCp: 90 },
  medium: { maxDepth: 4, timeMs: 1200 },
  hard: { maxDepth: 64, timeMs: 2500 },
};

export const isLevel = (v: string): v is Level => v === 'easy' || v === 'medium' || v === 'hard';

export interface EngineRequest {
  moves: readonly string[];
  fen?: string;
  level: Level;
  seed: number;
  timeMs?: number;
}

export interface EngineReply {
  uci: string;
  score: number;
  depth: number;
  nodes: number;
}

export function engineSearch(req: EngineRequest, clock: SliceClock): Generator<void, EngineReply | null, void> {
  const pos = new Position(req.fen ?? START_FEN);
  for (const m of req.moves) pos.playUci(m);
  const level = LEVELS[req.level];
  const options: SearchOptions = {
    maxDepth: level.maxDepth,
    timeMs: req.timeMs ?? level.timeMs,
    rng: createRng(req.seed),
    exactRoot: level.marginCp !== undefined,
    marginCp: level.marginCp,
  };
  return (function* () {
    const res = yield* searchPosition(pos, options, clock);
    return res ? { uci: res.uci, score: res.score, depth: res.depth, nodes: res.nodes } : null;
  })();
}

export function chooseEngineMove(req: EngineRequest): EngineReply | null {
  const gen = engineSearch(req, { sliceEnd: Infinity });
  for (;;) {
    const r = gen.next();
    if (r.done) return r.value;
  }
}

export function validatedMove(chess: Chess, uci: string): Move | null {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci[4];
  return chess.moves({ verbose: true }).find((m) => m.from === from && m.to === to && (m.promotion ?? undefined) === promotion) ?? null;
}

export type EndState = { outcome: 'checkmate'; winner: 'w' | 'b'; reason: string } | { outcome: 'draw'; reason: string } | null;

export function endState(chess: Chess): EndState {
  if (chess.isCheckmate()) return { outcome: 'checkmate', winner: chess.turn() === 'w' ? 'b' : 'w', reason: 'Checkmate' };
  if (chess.isStalemate()) return { outcome: 'draw', reason: 'Draw by stalemate' };
  if (chess.isInsufficientMaterial()) return { outcome: 'draw', reason: 'Draw by insufficient material' };
  if (chess.isThreefoldRepetition()) return { outcome: 'draw', reason: 'Draw by threefold repetition' };
  if (chess.isDrawByFiftyMoves()) return { outcome: 'draw', reason: 'Draw by the fifty-move rule' };
  return null;
}
