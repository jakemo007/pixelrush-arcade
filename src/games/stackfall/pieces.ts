import type { Rng } from '@/lib/utils/random';

export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;
export type PieceType = (typeof PIECE_TYPES)[number];

export interface Cell {
  x: number;
  y: number;
}

interface PieceShape {
  size: number;
  cells: readonly Cell[];
}

const BASE: Readonly<Record<PieceType, PieceShape>> = {
  I: { size: 4, cells: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }] },
  O: { size: 2, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  T: { size: 3, cells: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  S: { size: 3, cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  Z: { size: 3, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  J: { size: 3, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  L: { size: 3, cells: [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
};

function rotateClockwise(cells: readonly Cell[], size: number): Cell[] {
  return cells.map((c) => ({ x: size - 1 - c.y, y: c.x }));
}

function buildRotations(type: PieceType): readonly (readonly Cell[])[] {
  const { size, cells } = BASE[type];
  const out: Cell[][] = [cells.map((c) => ({ ...c }))];
  for (let i = 1; i < 4; i++) out.push(rotateClockwise(out[i - 1]!, size));
  return out;
}

const ROTATIONS: Readonly<Record<PieceType, readonly (readonly Cell[])[]>> = {
  I: buildRotations('I'),
  O: buildRotations('O'),
  T: buildRotations('T'),
  S: buildRotations('S'),
  Z: buildRotations('Z'),
  J: buildRotations('J'),
  L: buildRotations('L'),
};

export function pieceSize(type: PieceType): number {
  return BASE[type].size;
}

export function pieceCells(type: PieceType, rotation: number): readonly Cell[] {
  return ROTATIONS[type][((rotation % 4) + 4) % 4]!;
}

export function pieceIndex(type: PieceType): number {
  return PIECE_TYPES.indexOf(type) + 1;
}

export function pieceFromIndex(index: number): PieceType | null {
  return PIECE_TYPES[index - 1] ?? null;
}

export function shuffledBag(rng: Rng): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j]!, bag[i]!];
  }
  return bag;
}

export const KICKS: readonly Readonly<Cell>[] = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -2, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: -1 },
];
