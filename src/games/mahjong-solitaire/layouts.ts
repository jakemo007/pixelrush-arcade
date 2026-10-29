export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Layout {
  id: string;
  name: string;
  positions: Position[];
}

function block(z: number, cols: [number, number], rows: [number, number], skip: (c: number, r: number) => boolean = () => false): Position[] {
  const out: Position[] = [];
  for (let r = rows[0]; r <= rows[1]; r++) {
    for (let c = cols[0]; c <= cols[1]; c++) if (!skip(c, r)) out.push({ x: c * 2, y: r * 2, z });
  }
  return out;
}

const PYRAMID: Layout = {
  id: 'pyramid',
  name: 'Pyramid',
  positions: [
    ...block(0, [0, 9], [0, 7], (c, r) => (r === 0 || r === 7) && (c === 0 || c === 9)),
    ...block(1, [1, 8], [1, 6]),
    ...block(2, [3, 6], [2, 5]),
    ...block(3, [4, 5], [3, 4]),
  ],
};

const GARDEN: Layout = {
  id: 'garden',
  name: 'Garden',
  positions: [
    ...block(0, [0, 7], [0, 5], (c, r) => (r === 0 || r === 5) && (c === 0 || c === 7)),
    ...block(1, [1, 6], [1, 4]),
    ...block(2, [3, 4], [2, 3]),
  ],
};

const BRIDGE: Layout = {
  id: 'bridge',
  name: 'Bridge',
  positions: [
    ...block(0, [1, 8], [2, 4]),
    { x: 0, y: 5, z: 0 },
    { x: 18, y: 5, z: 0 },
    ...block(0, [1, 2], [0, 1]),
    ...block(0, [7, 8], [0, 1]),
    ...block(0, [1, 2], [5, 6]),
    ...block(0, [7, 8], [5, 6]),
    ...block(1, [1, 2], [1, 5]),
    ...block(1, [7, 8], [1, 5]),
    ...block(1, [3, 6], [3, 3]),
    { x: 3, y: 5, z: 2 },
    { x: 3, y: 7, z: 2 },
    { x: 15, y: 5, z: 2 },
    { x: 15, y: 7, z: 2 },
    { x: 3, y: 6, z: 3 },
    { x: 15, y: 6, z: 3 },
  ],
};

export const LAYOUTS: readonly Layout[] = [PYRAMID, GARDEN, BRIDGE];

export function getLayout(id: string): Layout {
  return LAYOUTS.find((l) => l.id === id) ?? PYRAMID;
}
