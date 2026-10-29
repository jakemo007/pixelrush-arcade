import { describe, expect, it } from 'vitest';
import {
  canMove,
  emptyCells,
  maxTile,
  move,
  moveTiles,
  newTileValue,
  slideLine,
  spawnTile,
  startTiles,
  tilesToGrid,
  type Direction,
  type Grid,
  type Tile,
} from '@/games/2048/rules';
import { createRng } from '@/lib/utils/random';

const DIRS: readonly Direction[] = ['up', 'down', 'left', 'right'];

function tilesFrom(grid: Grid): Tile[] {
  const tiles: Tile[] = [];
  let id = 1;
  grid.forEach((row, r) => row.forEach((value, c) => value && tiles.push({ id: id++, value, row: r, col: c })));
  return tiles;
}

describe('2048 line merging', () => {
  it('merges each tile at most once, from the edge the tiles move toward', () => {
    expect(slideLine([2, 2, 2, 2]).line).toEqual([4, 4, 0, 0]);
    expect(slideLine([2, 2, 4, 0]).line).toEqual([4, 4, 0, 0]);
    expect(slideLine([4, 0, 4, 8]).line).toEqual([8, 8, 0, 0]);
    expect(slideLine([2, 2, 2, 0]).line).toEqual([4, 2, 0, 0]);
    expect(slideLine([4, 4, 8, 8]).line).toEqual([8, 16, 0, 0]);
    expect(slideLine([8, 4, 4, 0]).line).toEqual([8, 8, 0, 0]);
  });

  it('slides without merging different values', () => {
    expect(slideLine([0, 2, 0, 4]).line).toEqual([2, 4, 0, 0]);
    expect(slideLine([2, 4, 8, 16]).line).toEqual([2, 4, 8, 16]);
  });

  it('scores the sum of merged values', () => {
    expect(slideLine([2, 2, 2, 2]).gained).toBe(8);
    expect(slideLine([2, 2, 4, 0]).gained).toBe(4);
    expect(slideLine([4, 0, 4, 8]).gained).toBe(8);
    expect(slideLine([2, 4, 8, 16]).gained).toBe(0);
  });

  it('reports whether anything moved', () => {
    expect(slideLine([2, 4, 0, 0]).moved).toBe(false);
    expect(slideLine([0, 0, 0, 0]).moved).toBe(false);
    expect(slideLine([0, 2, 0, 0]).moved).toBe(true);
    expect(slideLine([2, 2, 0, 0]).moved).toBe(true);
  });
});

describe('2048 board moves', () => {
  const grid: Grid = [
    [2, 2, 2, 2],
    [2, 2, 4, 0],
    [4, 0, 4, 8],
    [0, 0, 0, 2],
  ];

  it('moves left and right with merges resolving toward the movement', () => {
    expect(move(grid, 'left').grid).toEqual([
      [4, 4, 0, 0],
      [4, 4, 0, 0],
      [8, 8, 0, 0],
      [2, 0, 0, 0],
    ]);
    expect(move(grid, 'right').grid).toEqual([
      [0, 0, 4, 4],
      [0, 0, 4, 4],
      [0, 0, 8, 8],
      [0, 0, 0, 2],
    ]);
  });

  it('moves up and down column by column', () => {
    expect(move(grid, 'up').grid).toEqual([
      [4, 4, 2, 2],
      [4, 0, 8, 8],
      [0, 0, 0, 2],
      [0, 0, 0, 0],
    ]);
    expect(move(grid, 'down').grid).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 2],
      [4, 0, 2, 8],
      [4, 4, 8, 2],
    ]);
  });

  it('a move that changes nothing reports no movement', () => {
    const packed: Grid = [
      [2, 4, 0, 0],
      [8, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(move(packed, 'left').moved).toBe(false);
    expect(move(packed, 'up').moved).toBe(false);
    expect(move(packed, 'right').moved).toBe(true);
  });
});

describe('2048 tile moves (animation model)', () => {
  it('matches the grid rules in every direction on random boards', () => {
    const rng = createRng(99);
    for (let n = 0; n < 200; n++) {
      const g: Grid = Array.from({ length: 4 }, () =>
        Array.from({ length: 4 }, () => (rng() < 0.35 ? 0 : 2 ** (1 + Math.floor(rng() * 4)))),
      );
      for (const dir of DIRS) {
        const expected = move(g, dir);
        const result = moveTiles(tilesFrom(g), dir, 100);
        expect(tilesToGrid(result.tiles)).toEqual(expected.grid);
        expect(result.gained).toBe(expected.gained);
        expect(result.moved).toBe(expected.moved);
      }
    }
  });

  it('gives merged tiles new ids and keeps the used-up tiles at the merge cell', () => {
    const tiles: Tile[] = [
      { id: 1, value: 2, row: 0, col: 1 },
      { id: 2, value: 2, row: 0, col: 3 },
    ];
    const result = moveTiles(tiles, 'left', 10);
    expect(result.tiles).toEqual([{ id: 10, value: 4, row: 0, col: 0 }]);
    expect(result.merged).toEqual([10]);
    expect(result.removed.map((t) => [t.id, t.row, t.col])).toEqual([
      [1, 0, 0],
      [2, 0, 0],
    ]);
    expect(result.nextId).toBe(11);
  });
});

describe('2048 new tiles', () => {
  it('adds a 2 about 90% of the time and a 4 about 10% of the time', () => {
    const rng = createRng(5);
    let fours = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const v = newTileValue(rng);
      expect([2, 4]).toContain(v);
      if (v === 4) fours++;
    }
    expect(fours / n).toBeGreaterThan(0.08);
    expect(fours / n).toBeLessThan(0.12);
  });

  it('spawns only on empty cells, and not at all on a full board', () => {
    const rng = createRng(3);
    const grid: Grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 0, 4],
      [4, 2, 4, 2],
    ];
    for (let i = 0; i < 50; i++) {
      const t = spawnTile(tilesFrom(grid), rng, 99);
      expect(t).not.toBeNull();
      expect([t!.row, t!.col]).toEqual([2, 2]);
    }
    grid[2]![2] = 8;
    expect(spawnTile(tilesFrom(grid), rng, 99)).toBeNull();
  });

  it('starts with two tiles', () => {
    const tiles = startTiles(createRng(11));
    expect(tiles).toHaveLength(2);
    expect(emptyCells(tilesToGrid(tiles))).toHaveLength(14);
    for (const t of tiles) expect([2, 4]).toContain(t.value);
  });
});

describe('2048 game end', () => {
  it('detects when no move is possible', () => {
    const stuck: Grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(canMove(stuck)).toBe(false);
    for (const dir of DIRS) expect(move(stuck, dir).moved).toBe(false);
  });

  it('a full board with a pair is still playable', () => {
    const horizontal: Grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 8, 8],
      [4, 2, 4, 2],
    ];
    expect(canMove(horizontal)).toBe(true);
    const vertical: Grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 4],
    ];
    expect(canMove(vertical)).toBe(true);
    const gap: Grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 0, 4],
      [4, 2, 4, 2],
    ];
    expect(canMove(gap)).toBe(true);
  });

  it('finds the 2048 tile', () => {
    const g: Grid = [
      [1024, 1024, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const after = move(g, 'left');
    expect(maxTile(after.grid)).toBe(2048);
    expect(after.gained).toBe(2048);
  });
});
