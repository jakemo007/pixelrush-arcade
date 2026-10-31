import type { Rng } from '@/lib/utils/random';
import { DRAW_QUIET_PLIES, type CheckersMove, type CheckersState } from './rules';

export interface AiOptions {
  timeMs: number;
  maxDepth?: number;
  rng?: Rng;
}

export interface AiResult {
  move: CheckersMove;
  score: number;
  depth: number;
  nodes: number;
}

export interface SliceClock {
  sliceEnd: number;
}

const WIN = 100000;
const MAX_PLY = 64;
const ABORT = Symbol('abort');
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const NEXT: Int8Array[] = [];
const JUMP: Int8Array[] = [];
for (let sq = 0; sq < 64; sq++) {
  const r = sq >> 3;
  const c = sq & 7;
  const n = new Int8Array(4);
  const j = new Int8Array(4);
  [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ].forEach(([dr, dc], d) => {
    const r1 = r + dr!;
    const c1 = c + dc!;
    const r2 = r + 2 * dr!;
    const c2 = c + 2 * dc!;
    n[d] = r1 >= 0 && r1 < 8 && c1 >= 0 && c1 < 8 ? r1 * 8 + c1 : -1;
    j[d] = r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 ? r2 * 8 + c2 : -1;
  });
  NEXT.push(n);
  JUMP.push(j);
}

const DARK_MAN_DIRS = [0, 1];
const LIGHT_MAN_DIRS = [2, 3];
const KING_DIRS = [0, 1, 2, 3];

function dirs(piece: number): number[] {
  if (piece === 2 || piece === -2) return KING_DIRS;
  return piece > 0 ? DARK_MAN_DIRS : LIGHT_MAN_DIRS;
}

function jumps(board: Int8Array, from: number, piece: number, origin: number, path: number[], caps: number[], out: CheckersMove[]): void {
  let extended = false;
  for (const d of dirs(piece)) {
    const mid = NEXT[from]![d]!;
    const land = JUMP[from]![d]!;
    if (land < 0) continue;
    const victim = board[mid]!;
    if (victim === 0 || (victim > 0) === (piece > 0) || board[land] !== 0) continue;
    extended = true;
    const p2 = [...path, land];
    const c2 = [...caps, mid];
    const isMan = piece === 1 || piece === -1;
    if (isMan && (land >> 3) === (piece > 0 ? 0 : 7)) {
      out.push({ from: origin, path: p2, captures: c2, crowns: true });
      continue;
    }
    board[from] = 0;
    board[mid] = 0;
    board[land] = piece;
    jumps(board, land, piece, origin, p2, c2, out);
    board[land] = 0;
    board[mid] = victim;
    board[from] = piece;
  }
  if (!extended && path.length > 0) out.push({ from: origin, path, captures: caps, crowns: false });
}

export function generate(board: Int8Array, sign: number): CheckersMove[] {
  const caps: CheckersMove[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]!;
    if (p * sign > 0) jumps(board, sq, p, sq, [], [], caps);
  }
  if (caps.length > 0) return caps;
  const out: CheckersMove[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]!;
    if (p * sign <= 0) continue;
    const isMan = p === 1 || p === -1;
    for (const d of dirs(p)) {
      const to = NEXT[sq]![d]!;
      if (to >= 0 && board[to] === 0) out.push({ from: sq, path: [to], captures: [], crowns: isMan && (to >> 3) === (p > 0 ? 0 : 7) });
    }
  }
  return out;
}

const CENTER = new Int8Array(64);
for (let sq = 0; sq < 64; sq++) {
  const r = sq >> 3;
  const c = sq & 7;
  CENTER[sq] = (r >= 2 && r <= 5 ? 2 : 0) + (c >= 2 && c <= 5 ? 3 : 0);
}

export function evaluate(board: Int8Array): number {
  let score = 0;
  let darkMat = 0;
  let lightMat = 0;
  let pieces = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]!;
    if (p === 0) continue;
    pieces++;
    const r = sq >> 3;
    if (p === 1) {
      darkMat += 100;
      score += 100 + (7 - r) * 4 + CENTER[sq]! + (r === 7 ? 6 : 0);
    } else if (p === -1) {
      lightMat += 100;
      score -= 100 + r * 4 + CENTER[sq]! + (r === 0 ? 6 : 0);
    } else if (p === 2) {
      darkMat += 160;
      score += 160 + CENTER[sq]! * 2;
    } else {
      lightMat += 160;
      score -= 160 + CENTER[sq]! * 2;
    }
  }
  const diff = darkMat - lightMat;
  if (diff !== 0) score += Math.sign(diff) * (24 - pieces) * 3;
  if (pieces <= 10 && Math.abs(diff) >= 100) {
    const strong = diff > 0 ? 1 : -1;
    let distance = 0;
    for (let a = 0; a < 64; a++) {
      if (board[a] !== 2 * strong) continue;
      let nearest = 8;
      for (let b = 0; b < 64; b++) {
        if (board[b]! * strong >= 0) continue;
        const dd = Math.max(Math.abs((a >> 3) - (b >> 3)), Math.abs((a & 7) - (b & 7)));
        if (dd < nearest) nearest = dd;
      }
      distance += nearest;
    }
    score -= strong * distance * 3;
  }
  return score;
}

class Search {
  nodes = 0;
  private readonly board: Int8Array;
  private readonly killers: (CheckersMove | null)[] = new Array(MAX_PLY + 2).fill(null);

  constructor(
    state: CheckersState,
    private readonly deadline: number,
    private readonly clock: SliceClock,
  ) {
    this.board = Int8Array.from(state.board);
  }

  private tick(): void {
    if ((++this.nodes & 1023) === 0) {
      const t = now();
      if (t > this.deadline || t > this.clock.sliceEnd) throw ABORT;
    }
  }

  make(m: CheckersMove): number[] {
    const b = this.board;
    const piece = b[m.from]!;
    const captured = m.captures.map((c) => b[c]!);
    b[m.from] = 0;
    for (const c of m.captures) b[c] = 0;
    b[m.path[m.path.length - 1]!] = m.crowns ? piece * 2 : piece;
    return [piece, ...captured];
  }

  unmake(m: CheckersMove, undo: number[]): void {
    const b = this.board;
    b[m.path[m.path.length - 1]!] = 0;
    m.captures.forEach((c, i) => {
      b[c] = undo[i + 1]!;
    });
    b[m.from] = undo[0]!;
  }

  order(moves: CheckersMove[], ply: number): CheckersMove[] {
    const killer = this.killers[ply];
    const scoreOf = (m: CheckersMove) =>
      m.captures.length * 1000 + (m.crowns ? 500 : 0) + (killer && killer.from === m.from && killer.path[0] === m.path[0] ? 300 : 0);
    return moves.slice().sort((a, b) => scoreOf(b) - scoreOf(a));
  }

  negamax(sign: number, depth: number, alpha: number, beta: number, ply: number, quiet: number): number {
    this.tick();
    if (quiet >= DRAW_QUIET_PLIES) return 0;
    const moves = generate(this.board, sign);
    if (moves.length === 0) return -WIN + ply;
    const forced = moves[0]!.captures.length > 0;
    if ((depth <= 0 && !forced) || ply >= MAX_PLY) return sign * evaluate(this.board);
    let best = -Infinity;
    for (const m of this.order(moves, ply)) {
      const isMan = this.board[m.from] === sign;
      const undo = this.make(m);
      const score = -this.negamax(-sign, depth - 1, -beta, -alpha, ply + 1, m.captures.length > 0 || isMan ? 0 : quiet + 1);
      this.unmake(m, undo);
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) {
        if (m.captures.length === 0) this.killers[ply] = m;
        break;
      }
    }
    return best;
  }

  rootScore(m: CheckersMove, sign: number, depth: number, alpha: number, beta: number, quiet: number): number {
    const isMan = this.board[m.from] === sign;
    const snapshot = this.board.slice();
    this.make(m);
    try {
      return -this.negamax(-sign, depth - 1, -beta, -alpha, 1, m.captures.length > 0 || isMan ? 0 : quiet + 1);
    } finally {
      this.board.set(snapshot);
    }
  }
}

export function* searchCheckers(state: CheckersState, options: AiOptions, clock: SliceClock): Generator<void, AiResult | null, void> {
  const sign = state.turn === 'dark' ? 1 : -1;
  const start = now();
  const deadline = start + options.timeMs;
  const maxDepth = options.maxDepth ?? 24;
  const search = new Search(state, deadline, clock);
  let moves = generate(Int8Array.from(state.board), sign);
  if (moves.length === 0) return null;
  if (options.rng) {
    const rng = options.rng;
    moves = moves
      .map((m) => ({ m, k: rng() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.m);
  }
  let best: AiResult = { move: moves[0]!, score: 0, depth: 0, nodes: 0 };
  if (moves.length === 1) return best;

  for (let depth = 1; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let iterBest: CheckersMove | null = null;
    const scores = new Map<CheckersMove, number>();
    let aborted = false;
    for (const m of moves) {
      try {
        const score = search.rootScore(m, sign, depth, alpha, Infinity, state.quietPlies);
        scores.set(m, score);
        if (score > alpha) {
          alpha = score;
          iterBest = m;
        }
      } catch (e) {
        if (e !== ABORT) throw e;
        aborted = true;
        break;
      }
      yield;
    }
    if (iterBest) best = { move: iterBest, score: alpha, depth: aborted ? depth - 1 : depth, nodes: search.nodes };
    if (aborted || now() > deadline) break;
    moves = moves.slice().sort((a, b) => (b === iterBest ? 1 : a === iterBest ? -1 : (scores.get(b) ?? -Infinity) - (scores.get(a) ?? -Infinity)));
    if (Math.abs(alpha) > WIN - 1000) break;
  }
  best.nodes = search.nodes;
  return best;
}

export function chooseCheckersMove(state: CheckersState, options: AiOptions): AiResult | null {
  const gen = searchCheckers(state, options, { sliceEnd: Infinity });
  for (;;) {
    const r = gen.next();
    if (r.done) return r.value;
  }
}
