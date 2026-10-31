export const WHITE = 0;
export const BLACK = 8;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

const CAP = 1;
const EP = 2;
const CASTLE = 4;
const DOUBLE = 8;

export const MATE = 30000;
const INF = 32000;
const MAX_PLY = 96;

export const moveFrom = (m: number) => m & 127;
export const moveTo = (m: number) => (m >> 7) & 127;
export const movePromo = (m: number) => (m >> 14) & 7;
const moveFlags = (m: number) => m >> 17;
const encode = (from: number, to: number, promo: number, flags: number) => from | (to << 7) | (promo << 14) | (flags << 17);

const KNIGHT_OFFSETS = [-33, -31, -18, -14, 14, 18, 31, 33];
const KING_OFFSETS = [-17, -16, -15, -1, 1, 15, 16, 17];
const BISHOP_DIRS = [-17, -15, 15, 17];
const ROOK_DIRS = [-16, -1, 1, 16];
const QUEEN_DIRS = [...BISHOP_DIRS, ...ROOK_DIRS];

const VALUE = [0, 100, 320, 330, 500, 900, 20000];

// prettier-ignore
const PST: number[][] = [
  [],
  [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0],
  [
   -50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 10, 15, 15, 10,  0,-30,
   -30,  5, 15, 20, 20, 15,  5,-30,
   -30,  0, 15, 20, 20, 15,  0,-30,
   -30,  5, 10, 15, 15, 10,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50],
  [
   -20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5, 10, 10,  5,  0,-10,
   -10,  5,  5, 10, 10,  5,  5,-10,
   -10,  0, 10, 10, 10, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20],
  [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0],
  [
   -20,-10,-10, -5, -5,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
     0,  0,  5,  5,  5,  5,  0, -5,
   -10,  5,  5,  5,  5,  5,  0,-10,
   -10,  0,  5,  0,  0,  0,  0,-10,
   -20,-10,-10, -5, -5,-10,-10,-20],
  [
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20],
];
// prettier-ignore
const KING_END = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50,
];

const CASTLE_MASK = new Int8Array(128).fill(15);
CASTLE_MASK[0x70] = 13;
CASTLE_MASK[0x77] = 14;
CASTLE_MASK[0x74] = 12;
CASTLE_MASK[0x00] = 7;
CASTLE_MASK[0x07] = 11;
CASTLE_MASK[0x04] = 3;

function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) | 0;
  };
}
const zrand = mulberry(0x5eed1234);
const Z_PIECE_LO = new Int32Array(16 * 128).map(() => zrand());
const Z_PIECE_HI = new Int32Array(16 * 128).map(() => zrand());
const Z_CASTLE_LO = new Int32Array(16).map(() => zrand());
const Z_CASTLE_HI = new Int32Array(16).map(() => zrand());
const Z_EP_LO = new Int32Array(128).map(() => zrand());
const Z_EP_HI = new Int32Array(128).map(() => zrand());
const Z_SIDE_LO = zrand();
const Z_SIDE_HI = zrand();

export const squareName = (sq: number) => `${'abcdefgh'[sq & 7]}${8 - (sq >> 4)}`;
export function parseSquare(name: string): number {
  const file = name.charCodeAt(0) - 97;
  const rank = name.charCodeAt(1) - 48;
  if (file < 0 || file > 7 || rank < 1 || rank > 8) throw new Error(`Bad square ${name}`);
  return (8 - rank) * 16 + file;
}

const PROMO_CHAR = ['', '', 'n', 'b', 'r', 'q'];
export function moveToUci(m: number): string {
  return `${squareName(moveFrom(m))}${squareName(moveTo(m))}${PROMO_CHAR[movePromo(m)] ?? ''}`;
}

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export class Position {
  readonly board = new Int8Array(128);
  side = WHITE;
  castling = 0;
  ep = -1;
  halfmove = 0;
  kings = [0, 0];
  hashLo = 0;
  hashHi = 0;

  private sp = 0;
  private readonly uMove = new Int32Array(1024);
  private readonly uCaptured = new Int8Array(1024);
  private readonly uCastling = new Int8Array(1024);
  private readonly uEp = new Int16Array(1024);
  private readonly uHalf = new Int16Array(1024);
  private readonly uLo = new Int32Array(1024);
  private readonly uHi = new Int32Array(1024);
  readonly histLo = new Int32Array(1100);
  readonly histHi = new Int32Array(1100);
  hp = 0;

  constructor(fen = START_FEN) {
    this.load(fen);
  }

  load(fen: string): void {
    const [placement, side, castling, ep, half] = fen.trim().split(/\s+/);
    this.board.fill(0);
    let row = 0;
    let file = 0;
    for (const ch of placement ?? '') {
      if (ch === '/') {
        row++;
        file = 0;
      } else if (ch >= '1' && ch <= '8') {
        file += Number(ch);
      } else {
        const lower = ch.toLowerCase();
        const type = 'pnbrqk'.indexOf(lower) + 1;
        if (type <= 0) throw new Error(`Bad FEN piece ${ch}`);
        const color = ch === lower ? BLACK : WHITE;
        const sq = row * 16 + file;
        this.board[sq] = type | color;
        if (type === KING) this.kings[color >> 3] = sq;
        file++;
      }
    }
    this.side = side === 'b' ? BLACK : WHITE;
    this.castling = 0;
    if (castling && castling !== '-') {
      if (castling.includes('K')) this.castling |= 1;
      if (castling.includes('Q')) this.castling |= 2;
      if (castling.includes('k')) this.castling |= 4;
      if (castling.includes('q')) this.castling |= 8;
    }
    this.ep = ep && ep !== '-' ? parseSquare(ep) : -1;
    this.halfmove = half ? Number(half) || 0 : 0;
    this.sp = 0;
    this.computeHash();
    this.hp = 0;
    this.histLo[0] = this.hashLo;
    this.histHi[0] = this.hashHi;
  }

  private computeHash(): void {
    let lo = 0;
    let hi = 0;
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) continue;
      const p = this.board[sq]!;
      if (p) {
        lo ^= Z_PIECE_LO[p * 128 + sq]!;
        hi ^= Z_PIECE_HI[p * 128 + sq]!;
      }
    }
    lo ^= Z_CASTLE_LO[this.castling]!;
    hi ^= Z_CASTLE_HI[this.castling]!;
    if (this.ep >= 0) {
      lo ^= Z_EP_LO[this.ep]!;
      hi ^= Z_EP_HI[this.ep]!;
    }
    if (this.side === BLACK) {
      lo ^= Z_SIDE_LO;
      hi ^= Z_SIDE_HI;
    }
    this.hashLo = lo;
    this.hashHi = hi;
  }

  attacked(sq: number, by: number): boolean {
    const b = this.board;
    if (by === WHITE) {
      if (!((sq + 15) & 0x88) && b[sq + 15] === PAWN) return true;
      if (!((sq + 17) & 0x88) && b[sq + 17] === PAWN) return true;
    } else {
      if (!((sq - 15) & 0x88) && b[sq - 15] === (PAWN | BLACK)) return true;
      if (!((sq - 17) & 0x88) && b[sq - 17] === (PAWN | BLACK)) return true;
    }
    const knight = KNIGHT | by;
    for (const o of KNIGHT_OFFSETS) {
      const t = sq + o;
      if (!(t & 0x88) && b[t] === knight) return true;
    }
    const king = KING | by;
    for (const o of KING_OFFSETS) {
      const t = sq + o;
      if (!(t & 0x88) && b[t] === king) return true;
    }
    const bishop = BISHOP | by;
    const rook = ROOK | by;
    const queen = QUEEN | by;
    for (const d of BISHOP_DIRS) {
      for (let t = sq + d; !(t & 0x88); t += d) {
        const p = b[t]!;
        if (p) {
          if (p === bishop || p === queen) return true;
          break;
        }
      }
    }
    for (const d of ROOK_DIRS) {
      for (let t = sq + d; !(t & 0x88); t += d) {
        const p = b[t]!;
        if (p) {
          if (p === rook || p === queen) return true;
          break;
        }
      }
    }
    return false;
  }

  inCheck(): boolean {
    return this.attacked(this.kings[this.side >> 3]!, this.side ^ BLACK);
  }

  generate(buf: Int32Array, start: number, capturesOnly: boolean): number {
    const b = this.board;
    const us = this.side;
    const them = us ^ BLACK;
    let n = start;
    for (let from = 0; from < 128; from++) {
      if (from & 0x88) {
        from += 7;
        continue;
      }
      const p = b[from]!;
      if (!p || (p & 8) !== us) continue;
      const type = p & 7;
      if (type === PAWN) {
        const dir = us === WHITE ? -16 : 16;
        const startRow = us === WHITE ? 6 : 1;
        const lastRow = us === WHITE ? 0 : 7;
        const one = from + dir;
        if (!(one & 0x88) && b[one] === 0) {
          if (one >> 4 === lastRow) {
            buf[n++] = encode(from, one, QUEEN, 0);
            if (!capturesOnly) {
              buf[n++] = encode(from, one, ROOK, 0);
              buf[n++] = encode(from, one, BISHOP, 0);
              buf[n++] = encode(from, one, KNIGHT, 0);
            }
          } else if (!capturesOnly) {
            buf[n++] = encode(from, one, 0, 0);
            const two = one + dir;
            if (from >> 4 === startRow && b[two] === 0) buf[n++] = encode(from, two, 0, DOUBLE);
          }
        }
        for (const side of [-1, 1]) {
          const to = one + side;
          if (to & 0x88) continue;
          const target = b[to]!;
          if (target && (target & 8) === them) {
            if (to >> 4 === lastRow) {
              buf[n++] = encode(from, to, QUEEN, CAP);
              buf[n++] = encode(from, to, ROOK, CAP);
              buf[n++] = encode(from, to, BISHOP, CAP);
              buf[n++] = encode(from, to, KNIGHT, CAP);
            } else buf[n++] = encode(from, to, 0, CAP);
          } else if (to === this.ep) {
            buf[n++] = encode(from, to, 0, CAP | EP);
          }
        }
        continue;
      }
      if (type === KNIGHT || type === KING) {
        const offsets = type === KNIGHT ? KNIGHT_OFFSETS : KING_OFFSETS;
        for (const o of offsets) {
          const to = from + o;
          if (to & 0x88) continue;
          const target = b[to]!;
          if (!target) {
            if (!capturesOnly) buf[n++] = encode(from, to, 0, 0);
          } else if ((target & 8) === them) buf[n++] = encode(from, to, 0, CAP);
        }
        if (type === KING && !capturesOnly) n = this.castles(buf, n);
        continue;
      }
      const dirs = type === BISHOP ? BISHOP_DIRS : type === ROOK ? ROOK_DIRS : QUEEN_DIRS;
      for (const d of dirs) {
        for (let to = from + d; !(to & 0x88); to += d) {
          const target = b[to]!;
          if (!target) {
            if (!capturesOnly) buf[n++] = encode(from, to, 0, 0);
            continue;
          }
          if ((target & 8) === them) buf[n++] = encode(from, to, 0, CAP);
          break;
        }
      }
    }
    return n;
  }

  private castles(buf: Int32Array, n: number): number {
    const b = this.board;
    if (this.side === WHITE) {
      if (this.castling & 1 && !b[0x75] && !b[0x76] && b[0x77] === ROOK && !this.attacked(0x74, BLACK) && !this.attacked(0x75, BLACK) && !this.attacked(0x76, BLACK))
        buf[n++] = encode(0x74, 0x76, 0, CASTLE);
      if (this.castling & 2 && !b[0x73] && !b[0x72] && !b[0x71] && b[0x70] === ROOK && !this.attacked(0x74, BLACK) && !this.attacked(0x73, BLACK) && !this.attacked(0x72, BLACK))
        buf[n++] = encode(0x74, 0x72, 0, CASTLE);
    } else {
      if (this.castling & 4 && !b[0x05] && !b[0x06] && b[0x07] === (ROOK | BLACK) && !this.attacked(0x04, WHITE) && !this.attacked(0x05, WHITE) && !this.attacked(0x06, WHITE))
        buf[n++] = encode(0x04, 0x06, 0, CASTLE);
      if (this.castling & 8 && !b[0x03] && !b[0x02] && !b[0x01] && b[0x00] === (ROOK | BLACK) && !this.attacked(0x04, WHITE) && !this.attacked(0x03, WHITE) && !this.attacked(0x02, WHITE))
        buf[n++] = encode(0x04, 0x02, 0, CASTLE);
    }
    return n;
  }

  private put(sq: number, p: number): void {
    this.board[sq] = p;
    this.hashLo ^= Z_PIECE_LO[p * 128 + sq]!;
    this.hashHi ^= Z_PIECE_HI[p * 128 + sq]!;
  }

  private remove(sq: number): void {
    const p = this.board[sq]!;
    this.board[sq] = 0;
    this.hashLo ^= Z_PIECE_LO[p * 128 + sq]!;
    this.hashHi ^= Z_PIECE_HI[p * 128 + sq]!;
  }

  make(m: number): boolean {
    const from = moveFrom(m);
    const to = moveTo(m);
    const flags = moveFlags(m);
    const promo = movePromo(m);
    const b = this.board;
    const us = this.side;
    const piece = b[from]!;
    const sp = this.sp++;
    this.uMove[sp] = m;
    this.uCastling[sp] = this.castling;
    this.uEp[sp] = this.ep;
    this.uHalf[sp] = this.halfmove;
    this.uLo[sp] = this.hashLo;
    this.uHi[sp] = this.hashHi;

    let captured = 0;
    if (flags & EP) {
      const capSq = to + (us === WHITE ? 16 : -16);
      captured = b[capSq]!;
      this.remove(capSq);
    } else if (b[to]) {
      captured = b[to]!;
      this.remove(to);
    }
    this.uCaptured[sp] = captured;

    this.remove(from);
    this.put(to, promo ? promo | us : piece);
    if (flags & CASTLE) {
      if (to === 0x76) this.moveRook(0x77, 0x75);
      else if (to === 0x72) this.moveRook(0x70, 0x73);
      else if (to === 0x06) this.moveRook(0x07, 0x05);
      else if (to === 0x02) this.moveRook(0x00, 0x03);
    }
    if ((piece & 7) === KING) this.kings[us >> 3] = to;

    this.hashLo ^= Z_CASTLE_LO[this.castling]!;
    this.hashHi ^= Z_CASTLE_HI[this.castling]!;
    this.castling &= CASTLE_MASK[from]! & CASTLE_MASK[to]!;
    this.hashLo ^= Z_CASTLE_LO[this.castling]!;
    this.hashHi ^= Z_CASTLE_HI[this.castling]!;

    if (this.ep >= 0) {
      this.hashLo ^= Z_EP_LO[this.ep]!;
      this.hashHi ^= Z_EP_HI[this.ep]!;
    }
    this.ep = flags & DOUBLE ? (from + to) >> 1 : -1;
    if (this.ep >= 0) {
      this.hashLo ^= Z_EP_LO[this.ep]!;
      this.hashHi ^= Z_EP_HI[this.ep]!;
    }
    this.halfmove = (piece & 7) === PAWN || captured ? 0 : this.halfmove + 1;
    this.side ^= BLACK;
    this.hashLo ^= Z_SIDE_LO;
    this.hashHi ^= Z_SIDE_HI;
    this.hp++;
    this.histLo[this.hp] = this.hashLo;
    this.histHi[this.hp] = this.hashHi;

    if (this.attacked(this.kings[us >> 3]!, this.side)) {
      this.unmake();
      return false;
    }
    return true;
  }

  private moveRook(from: number, to: number): void {
    const r = this.board[from]!;
    this.remove(from);
    this.put(to, r);
  }

  unmake(): void {
    const sp = --this.sp;
    const m = this.uMove[sp]!;
    const from = moveFrom(m);
    const to = moveTo(m);
    const flags = moveFlags(m);
    this.hp--;
    this.side ^= BLACK;
    const us = this.side;
    const b = this.board;
    const moved = movePromo(m) ? PAWN | us : b[to]!;
    b[to] = 0;
    b[from] = moved;
    const captured = this.uCaptured[sp]!;
    if (flags & EP) b[to + (us === WHITE ? 16 : -16)] = captured;
    else if (captured) b[to] = captured;
    if (flags & CASTLE) {
      if (to === 0x76) {
        b[0x77] = b[0x75]!;
        b[0x75] = 0;
      } else if (to === 0x72) {
        b[0x70] = b[0x73]!;
        b[0x73] = 0;
      } else if (to === 0x06) {
        b[0x07] = b[0x05]!;
        b[0x05] = 0;
      } else if (to === 0x02) {
        b[0x00] = b[0x03]!;
        b[0x03] = 0;
      }
    }
    if ((moved & 7) === KING) this.kings[us >> 3] = from;
    this.castling = this.uCastling[sp]!;
    this.ep = this.uEp[sp]!;
    this.halfmove = this.uHalf[sp]!;
    this.hashLo = this.uLo[sp]!;
    this.hashHi = this.uHi[sp]!;
  }

  get ply(): number {
    return this.sp;
  }

  unwindTo(ply: number): void {
    while (this.sp > ply) {
      if (this.uMove[this.sp - 1] === 0) this.unmakeNull();
      else this.unmake();
    }
  }

  makeNull(): void {
    const sp = this.sp++;
    this.uMove[sp] = 0;
    this.uEp[sp] = this.ep;
    this.uLo[sp] = this.hashLo;
    this.uHi[sp] = this.hashHi;
    this.uHalf[sp] = this.halfmove;
    this.uCastling[sp] = this.castling;
    if (this.ep >= 0) {
      this.hashLo ^= Z_EP_LO[this.ep]!;
      this.hashHi ^= Z_EP_HI[this.ep]!;
    }
    this.ep = -1;
    this.side ^= BLACK;
    this.hashLo ^= Z_SIDE_LO;
    this.hashHi ^= Z_SIDE_HI;
    this.hp++;
    this.histLo[this.hp] = this.hashLo;
    this.histHi[this.hp] = this.hashHi;
  }

  unmakeNull(): void {
    const sp = --this.sp;
    this.hp--;
    this.side ^= BLACK;
    this.ep = this.uEp[sp]!;
    this.hashLo = this.uLo[sp]!;
    this.hashHi = this.uHi[sp]!;
  }

  isRepetition(): boolean {
    const lo = this.hashLo;
    const hi = this.hashHi;
    const limit = Math.max(0, this.hp - this.halfmove);
    for (let i = this.hp - 2; i >= limit; i -= 2) {
      if (this.histLo[i] === lo && this.histHi[i] === hi) return true;
    }
    return false;
  }

  legalMoves(): number[] {
    const buf = new Int32Array(256);
    const n = this.generate(buf, 0, false);
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const m = buf[i]!;
      if (this.make(m)) {
        out.push(m);
        this.unmake();
      }
    }
    return out;
  }

  playUci(uci: string): number {
    const m = this.legalMoves().find((x) => moveToUci(x) === uci);
    if (m === undefined || !this.make(m)) throw new Error(`Illegal move ${uci}`);
    return m;
  }

  perft(depth: number): number {
    if (depth === 0) return 1;
    const buf = new Int32Array(256);
    const n = this.generate(buf, 0, false);
    let total = 0;
    for (let i = 0; i < n; i++) {
      if (!this.make(buf[i]!)) continue;
      total += depth === 1 ? 1 : this.perft(depth - 1);
      this.unmake();
    }
    return total;
  }

  evaluate(): number {
    const b = this.board;
    let mg = 0;
    let eg = 0;
    let phase = 0;
    let wBishops = 0;
    let bBishops = 0;
    let wMat = 0;
    let bMat = 0;
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7;
        continue;
      }
      const p = b[sq]!;
      if (!p) continue;
      const type = p & 7;
      const white = (p & 8) === WHITE;
      const idx = white ? (sq >> 4) * 8 + (sq & 7) : (7 - (sq >> 4)) * 8 + (sq & 7);
      const sign = white ? 1 : -1;
      if (type === KING) {
        mg += sign * PST[KING]![idx]!;
        eg += sign * KING_END[idx]!;
        continue;
      }
      const v = VALUE[type]! + PST[type]![idx]!;
      mg += sign * v;
      eg += sign * v;
      if (type === PAWN) {
        const advanced = white ? 6 - (sq >> 4) : (sq >> 4) - 1;
        eg += sign * advanced * advanced * 3;
      } else {
        phase += type === QUEEN ? 4 : type === ROOK ? 2 : 1;
        if (white) wMat += VALUE[type]!;
        else bMat += VALUE[type]!;
      }
      if (type === BISHOP) {
        if (white) wBishops++;
        else bBishops++;
      }
    }
    if (wBishops >= 2) {
      mg += 30;
      eg += 40;
    }
    if (bBishops >= 2) {
      mg -= 30;
      eg -= 40;
    }
    const ph = Math.min(phase, 24);
    let score = Math.round((mg * ph + eg * (24 - ph)) / 24);
    const diff = wMat - bMat;
    if (ph <= 8 && Math.abs(diff) >= 300) {
      const strongWhite = diff > 0;
      const weakKing = this.kings[strongWhite ? 1 : 0]!;
      const strongKing = this.kings[strongWhite ? 0 : 1]!;
      const wr = weakKing >> 4;
      const wf = weakKing & 7;
      const centerDist = Math.max(3 - wr, wr - 4) + Math.max(3 - wf, wf - 4);
      const kingDist = Math.abs(wr - (strongKing >> 4)) + Math.abs(wf - (strongKing & 7));
      const bonus = centerDist * 10 + (14 - kingDist) * 4;
      score += strongWhite ? bonus : -bonus;
    }
    return this.side === WHITE ? score : -score;
  }

  hasNonPawnMaterial(side: number): boolean {
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) continue;
      const p = this.board[sq]!;
      if (p && (p & 8) === side && (p & 7) !== PAWN && (p & 7) !== KING) return true;
    }
    return false;
  }
}

export interface SliceClock {
  sliceEnd: number;
}

export interface SearchOptions {
  timeMs: number;
  maxDepth: number;
  exactRoot?: boolean;
  marginCp?: number;
  rng?: () => number;
}

export interface SearchResult {
  move: number;
  uci: string;
  score: number;
  depth: number;
  nodes: number;
}

const TT_BITS = 17;
const TT_SIZE = 1 << TT_BITS;
const TT_MASK = TT_SIZE - 1;
const EXACT = 1;
const LOWER = 2;
const UPPER = 3;
const ABORT = Symbol('abort');
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

class Searcher {
  nodes = 0;
  private readonly ttLo = new Int32Array(TT_SIZE);
  private readonly ttHi = new Int32Array(TT_SIZE);
  private readonly ttMove = new Int32Array(TT_SIZE);
  private readonly ttScore = new Int32Array(TT_SIZE);
  private readonly ttDepth = new Int8Array(TT_SIZE);
  private readonly ttFlag = new Int8Array(TT_SIZE);
  private readonly killers = new Int32Array(MAX_PLY * 2);
  private readonly history = new Int32Array(16 * 128);
  private readonly moveBuf = new Int32Array(MAX_PLY * 256);
  private readonly scoreBuf = new Int32Array(MAX_PLY * 256);

  constructor(
    readonly pos: Position,
    private readonly deadline: number,
    private readonly clock: SliceClock,
  ) {}

  private tick(): void {
    if ((++this.nodes & 2047) === 0) {
      const t = now();
      if (t > this.deadline || t > this.clock.sliceEnd) throw ABORT;
    }
  }

  ttBest(): number {
    const i = this.pos.hashLo & TT_MASK;
    return this.ttLo[i] === this.pos.hashLo && this.ttHi[i] === this.pos.hashHi ? this.ttMove[i]! : 0;
  }

  private store(depth: number, flag: number, score: number, move: number, ply: number): void {
    const i = this.pos.hashLo & TT_MASK;
    if (this.ttLo[i] === this.pos.hashLo && this.ttHi[i] === this.pos.hashHi && this.ttDepth[i]! > depth && flag !== EXACT) return;
    let s = score;
    if (s > MATE - MAX_PLY) s += ply;
    else if (s < -MATE + MAX_PLY) s -= ply;
    this.ttLo[i] = this.pos.hashLo;
    this.ttHi[i] = this.pos.hashHi;
    this.ttMove[i] = move;
    this.ttScore[i] = s;
    this.ttDepth[i] = depth;
    this.ttFlag[i] = flag;
  }

  private order(start: number, end: number, ply: number, ttMove: number): void {
    const b = this.pos.board;
    const k1 = this.killers[ply * 2]!;
    const k2 = this.killers[ply * 2 + 1]!;
    for (let i = start; i < end; i++) {
      const m = this.moveBuf[i]!;
      let s: number;
      if (m === ttMove) s = 1 << 30;
      else if (moveFlags(m) & CAP) {
        const victim = moveFlags(m) & EP ? PAWN : b[moveTo(m)]! & 7;
        s = (1 << 28) + VALUE[victim]! * 16 - (b[moveFrom(m)]! & 7);
      } else if (movePromo(m) === QUEEN) s = (1 << 27) + 1;
      else if (m === k1) s = 1 << 26;
      else if (m === k2) s = (1 << 26) - 1;
      else s = this.history[(b[moveFrom(m)]! & 15) * 128 + moveTo(m)]!;
      this.scoreBuf[i] = s;
    }
    for (let i = start + 1; i < end; i++) {
      const m = this.moveBuf[i]!;
      const s = this.scoreBuf[i]!;
      let j = i - 1;
      while (j >= start && this.scoreBuf[j]! < s) {
        this.moveBuf[j + 1] = this.moveBuf[j]!;
        this.scoreBuf[j + 1] = this.scoreBuf[j]!;
        j--;
      }
      this.moveBuf[j + 1] = m;
      this.scoreBuf[j + 1] = s;
    }
  }

  quiesce(alpha: number, beta: number, ply: number): number {
    this.tick();
    const pos = this.pos;
    if (ply >= MAX_PLY - 1) return pos.evaluate();
    const inCheck = pos.inCheck();
    const start = ply * 256;
    let best: number;
    let end: number;
    if (inCheck) {
      best = -MATE + ply;
      end = pos.generate(this.moveBuf, start, false);
    } else {
      const stand = pos.evaluate();
      if (stand >= beta) return stand;
      if (stand > alpha) alpha = stand;
      best = stand;
      end = pos.generate(this.moveBuf, start, true);
    }
    this.order(start, end, ply, 0);
    for (let i = start; i < end; i++) {
      const m = this.moveBuf[i]!;
      if (!pos.make(m)) continue;
      const score = -this.quiesce(-beta, -alpha, ply + 1);
      pos.unmake();
      if (score > best) best = score;
      if (score > alpha) {
        alpha = score;
        if (alpha >= beta) break;
      }
    }
    return best;
  }

  negamax(depth: number, alpha: number, beta: number, ply: number, allowNull: boolean): number {
    const pos = this.pos;
    if (ply > 0 && (pos.halfmove >= 100 || pos.isRepetition())) return 0;
    const inCheck = pos.inCheck();
    if (inCheck) depth++;
    if (depth <= 0) return this.quiesce(alpha, beta, ply);
    this.tick();
    if (ply >= MAX_PLY - 1) return pos.evaluate();

    const i = pos.hashLo & TT_MASK;
    let ttMove = 0;
    if (this.ttLo[i] === pos.hashLo && this.ttHi[i] === pos.hashHi) {
      ttMove = this.ttMove[i]!;
      if (ply > 0 && this.ttDepth[i]! >= depth) {
        let s = this.ttScore[i]!;
        if (s > MATE - MAX_PLY) s -= ply;
        else if (s < -MATE + MAX_PLY) s += ply;
        const f = this.ttFlag[i];
        if (f === EXACT || (f === LOWER && s >= beta) || (f === UPPER && s <= alpha)) return s;
      }
    }

    if (allowNull && !inCheck && depth >= 3 && ply > 0 && beta < MATE - MAX_PLY && pos.hasNonPawnMaterial(pos.side) && pos.evaluate() >= beta) {
      pos.makeNull();
      const score = -this.negamax(depth - 3, -beta, -beta + 1, ply + 1, false);
      pos.unmakeNull();
      if (score >= beta) return beta;
    }

    const start = ply * 256;
    const end = pos.generate(this.moveBuf, start, false);
    this.order(start, end, ply, ttMove);
    const alphaStart = alpha;
    let best = -INF;
    let bestMove = 0;
    let legal = 0;
    for (let k = start; k < end; k++) {
      const m = this.moveBuf[k]!;
      if (!pos.make(m)) continue;
      legal++;
      const score = -this.negamax(depth - 1, -beta, -alpha, ply + 1, true);
      pos.unmake();
      if (score > best) {
        best = score;
        bestMove = m;
      }
      if (score > alpha) {
        alpha = score;
        if (alpha >= beta) {
          if (!(moveFlags(m) & CAP)) {
            if (this.killers[ply * 2] !== m) {
              this.killers[ply * 2 + 1] = this.killers[ply * 2]!;
              this.killers[ply * 2] = m;
            }
            const h = (pos.board[moveFrom(m)]! & 15) * 128 + moveTo(m);
            this.history[h] = Math.min(this.history[h]! + depth * depth, 1 << 24);
          }
          break;
        }
      }
    }
    if (legal === 0) return inCheck ? -MATE + ply : 0;
    this.store(depth, best >= beta ? LOWER : best > alphaStart ? EXACT : UPPER, best, bestMove, ply);
    return best;
  }

  rootSearch(m: number, depth: number, alpha: number, beta: number): number {
    const pos = this.pos;
    const ply = pos.ply;
    pos.make(m);
    try {
      return -this.negamax(depth - 1, -beta, -alpha, 1, true);
    } finally {
      pos.unwindTo(ply);
    }
  }
}

export function* searchPosition(pos: Position, options: SearchOptions, clock: SliceClock): Generator<void, SearchResult | null, void> {
  const start = now();
  const deadline = start + options.timeMs;
  const searcher = new Searcher(pos, deadline, clock);
  let moves = pos.legalMoves();
  if (moves.length === 0) return null;
  const rng = options.rng;
  if (rng) {
    moves = moves
      .map((m) => ({ m, k: rng() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.m);
  }
  let best: SearchResult = { move: moves[0]!, uci: moveToUci(moves[0]!), score: 0, depth: 0, nodes: 0 };
  let exactScores: Map<number, number> | null = null;
  if (moves.length === 1 && !options.exactRoot) return best;

  for (let depth = 1; depth <= options.maxDepth; depth++) {
    let alpha = -INF;
    let iterBest = 0;
    const scores = new Map<number, number>();
    let aborted = false;
    for (const m of moves) {
      try {
        const score = options.exactRoot ? searcher.rootSearch(m, depth, -INF, INF) : searcher.rootSearch(m, depth, alpha, INF);
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
    if (iterBest) best = { move: iterBest, uci: moveToUci(iterBest), score: alpha, depth: aborted ? depth - 1 : depth, nodes: searcher.nodes };
    if (!aborted && options.exactRoot) exactScores = scores;
    if (aborted) break;
    if (Math.abs(alpha) > MATE - MAX_PLY) break;
    if (now() - start > options.timeMs * 0.55) break;
    moves = moves.slice().sort((a, b) => (b === iterBest ? 1 : a === iterBest ? -1 : (scores.get(b) ?? -INF) - (scores.get(a) ?? -INF)));
  }

  if (exactScores && options.marginCp && rng) {
    const top = Math.max(...exactScores.values());
    const near = [...exactScores.entries()].filter(([, s]) => s >= top - options.marginCp!).map(([m]) => m);
    const pick = near[Math.floor(rng() * near.length)];
    if (pick !== undefined) best = { ...best, move: pick, uci: moveToUci(pick), score: exactScores.get(pick)! };
  }
  best.nodes = searcher.nodes;
  return best;
}

export function searchSync(pos: Position, options: SearchOptions): SearchResult | null {
  const gen = searchPosition(pos, options, { sliceEnd: Infinity });
  for (;;) {
    const r = gen.next();
    if (r.done) return r.value;
  }
}
