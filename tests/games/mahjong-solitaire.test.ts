import { describe, expect, it } from 'vitest';
import {
  availablePairs,
  buildGeometry,
  canRemove,
  freeTiles,
  generateDeal,
  isFree,
  isStuck,
  remainingCount,
  replaySolution,
  shuffleRemaining,
  suggestPair,
  type Tiles,
} from '@/games/mahjong-solitaire/board';
import { LAYOUTS, getLayout, type Position } from '@/games/mahjong-solitaire/layouts';
import { DRAGONS, FLOWERS, SEASONS, WINDS, fullSet, halfSet, matchGroup, pairUp, suitedKinds, tileName, tilesMatch, type TileKind } from '@/games/mahjong-solitaire/tiles';
import { createRng } from '@/lib/utils/random';

const count = (kinds: readonly (TileKind | null)[]) => {
  const m = new Map<string, number>();
  for (const k of kinds) if (k) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
};

describe('tile set', () => {
  it('has 144 tiles: four of each suited tile, wind and dragon, one of each flower and season', () => {
    const set = fullSet();
    expect(set).toHaveLength(144);
    const c = count(set);
    for (const k of [...suitedKinds(), ...WINDS, ...DRAGONS]) expect(c.get(k)).toBe(4);
    for (const k of [...FLOWERS, ...SEASONS]) expect(c.get(k)).toBe(1);
    expect(suitedKinds()).toHaveLength(27);
  });

  it('has a 72-tile set of matching pairs', () => {
    const set = halfSet();
    expect(set).toHaveLength(72);
    const c = count(set);
    for (const k of [...suitedKinds(), ...WINDS, ...DRAGONS]) expect(c.get(k)).toBe(2);
    expect(set.filter((k) => matchGroup(k) === 'flower')).toHaveLength(2);
    expect(set.filter((k) => matchGroup(k) === 'season')).toHaveLength(2);
  });

  it('matches identical tiles, any flower with any flower and any season with any season', () => {
    expect(tilesMatch('dots-5', 'dots-5')).toBe(true);
    expect(tilesMatch('dots-5', 'dots-6')).toBe(false);
    expect(tilesMatch('dots-5', 'bamboo-5')).toBe(false);
    expect(tilesMatch('wind-east', 'wind-east')).toBe(true);
    expect(tilesMatch('wind-east', 'wind-west')).toBe(false);
    expect(tilesMatch('dragon-red', 'dragon-green')).toBe(false);
    expect(tilesMatch('flower-plum', 'flower-lotus')).toBe(true);
    expect(tilesMatch('season-spring', 'season-winter')).toBe(true);
    expect(tilesMatch('flower-plum', 'season-spring')).toBe(false);
  });

  it('pairs up a set and names tiles', () => {
    expect(pairUp(fullSet())).toHaveLength(72);
    for (const [a, b] of pairUp(fullSet())) expect(tilesMatch(a, b)).toBe(true);
    expect(() => pairUp(['dots-1', 'dots-2'])).toThrow();
    expect(tileName('dots-5')).toBe('Five of Dots');
    expect(tileName('wind-north')).toBe('North Wind');
    expect(tileName('dragon-red')).toBe('Red Dragon');
    expect(tileName('season-autumn')).toBe('Autumn season');
  });
});

describe('layouts', () => {
  it('has the expected sizes', () => {
    expect(getLayout('pyramid').positions).toHaveLength(144);
    expect(getLayout('garden').positions).toHaveLength(72);
    expect(getLayout('bridge').positions).toHaveLength(72);
    expect(new Set(LAYOUTS.map((l) => l.id)).size).toBe(LAYOUTS.length);
  });

  for (const layout of LAYOUTS) {
    it(`${layout.id}: no two tiles overlap on a layer, upper tiles rest on lower ones, at most 10 tiles wide`, () => {
      const ps = layout.positions;
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const a = ps[i]!;
          const b = ps[j]!;
          if (a.z === b.z) expect(Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2, `${i} ${j}`).toBe(false);
        }
      }
      const g = buildGeometry(ps);
      ps.forEach((p, i) => {
        if (p.z > 0) expect(g.below[i]!.length, `tile ${i} floats`).toBeGreaterThan(0);
      });
      const xs = ps.map((p) => p.x);
      expect((Math.max(...xs) + 2 - Math.min(...xs)) / 2).toBeLessThanOrEqual(10);
    });
  }
});

describe('free tiles', () => {
  const positions: Position[] = [
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 4, y: 0, z: 0 },
    { x: 2, y: 0, z: 1 },
    { x: 6, y: 1, z: 0 },
  ];
  const g = buildGeometry(positions);
  const all: Tiles = ['dots-1', 'dots-2', 'dots-3', 'dots-4', 'dots-5'];

  it('blocks a tile with neighbours on both sides', () => {
    expect(isFree(g, all, 0)).toBe(true);
    expect(isFree(g, all, 1)).toBe(false);
    expect(isFree(g, all, 2)).toBe(false);
    expect(isFree(g, all, 4)).toBe(true);
  });

  it('blocks a covered tile even when its sides are open', () => {
    const t: Tiles = [null, 'dots-2', null, 'dots-4', null];
    expect(isFree(g, t, 1)).toBe(false);
    expect(isFree(g, t, 3)).toBe(true);
    t[3] = null;
    expect(isFree(g, t, 1)).toBe(true);
  });

  it('frees a tile once one side is cleared', () => {
    const t: Tiles = [...all];
    t[4] = null;
    expect(isFree(g, t, 2)).toBe(true);
    expect(isFree(g, t, 0)).toBe(true);
    expect(freeTiles(g, t)).toEqual([0, 2, 3]);
  });

  it('only removes two free, matching tiles', () => {
    expect(canRemove(g, ['dots-1', 'dots-1', 'dots-9', null, null], 0, 1)).toBe(false);
    expect(canRemove(g, ['dots-1', null, 'dots-1', null, null], 0, 2)).toBe(true);
    expect(canRemove(g, ['dots-1', null, 'dots-2', null, null], 0, 2)).toBe(false);
    expect(canRemove(g, ['flower-plum', null, 'flower-lotus', null, null], 0, 2)).toBe(true);
    expect(canRemove(g, ['dots-1', null, null, null, null], 0, 0)).toBe(false);
  });
});

describe('dealing', () => {
  for (const layout of LAYOUTS) {
    it(`${layout.id}: every deal has the right tiles and replays to an empty board (many seeds)`, () => {
      const g = buildGeometry(layout.positions);
      const expected = count(layout.positions.length === 144 ? fullSet() : halfSet());
      for (let seed = 1; seed <= 60; seed++) {
        const deal = generateDeal(layout, seed * 977, g);
        expect(deal.tiles.every((t) => t !== null)).toBe(true);
        expect(count(deal.tiles)).toEqual(expected);
        expect(deal.solution).toHaveLength(layout.positions.length / 2);
        expect(replaySolution(g, deal.tiles, deal.solution), `seed ${seed}`).toBe(true);
      }
    });
  }

  it('is deterministic for a seed', () => {
    const layout = getLayout('garden');
    expect(generateDeal(layout, 5).tiles).toEqual(generateDeal(layout, 5).tiles);
    expect(generateDeal(layout, 5).tiles).not.toEqual(generateDeal(layout, 6).tiles);
  });

  it('starts with free pairs available', () => {
    for (const layout of LAYOUTS) {
      const g = buildGeometry(layout.positions);
      const deal = generateDeal(layout, 11, g);
      expect(availablePairs(g, deal.tiles).length).toBeGreaterThan(0);
      expect(isStuck(g, deal.tiles)).toBe(false);
    }
  });
});

describe('no moves and shuffling', () => {
  it('detects when no free pair remains', () => {
    const g = buildGeometry([
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
    ]);
    const stacked: Tiles = ['bamboo-3', 'bamboo-3'];
    expect(isStuck(g, stacked)).toBe(true);
    expect(isStuck(g, [null, null])).toBe(false);
    const res = shuffleRemaining(buildGeometry([{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 2, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }]), ['bamboo-3', 'bamboo-3', null, null], 1);
    expect(res.moved).toBe(true);
    expect(remainingCount(res.tiles)).toBe(2);
  });

  it('keeps the tiles and leaves a solvable board after random play (many seeds)', () => {
    for (const layout of LAYOUTS) {
      const g = buildGeometry(layout.positions);
      for (let seed = 1; seed <= 25; seed++) {
        const rng = createRng(seed);
        const deal = generateDeal(layout, seed, g);
        const tiles = [...deal.tiles];
        for (let step = 0; step < 20; step++) {
          const pairs = availablePairs(g, tiles);
          if (pairs.length === 0) break;
          const [a, b] = pairs[Math.floor(rng() * pairs.length)]!;
          tiles[a] = null;
          tiles[b] = null;
        }
        const before = count(tiles);
        const res = shuffleRemaining(g, tiles, seed * 31);
        expect(count(res.tiles)).toEqual(before);
        expect(replaySolution(g, res.tiles, res.solution), `${layout.id} seed ${seed}`).toBe(true);
      }
    }
  });

  it('suggests a pair that can really be removed', () => {
    const layout = getLayout('pyramid');
    const g = buildGeometry(layout.positions);
    const deal = generateDeal(layout, 3, g);
    const [a, b] = suggestPair(g, deal.tiles)!;
    expect(canRemove(g, deal.tiles, a, b)).toBe(true);
    expect(suggestPair(g, ['dots-1', 'dots-2', null, null, null] as Tiles)).toBeNull();
  });
});
