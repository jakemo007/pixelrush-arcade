import { describe, expect, it } from 'vitest';
import { getGame } from '@/config/games';
import { buildLevels, HAND_BUILT_COUNT, LEVEL_COLUMNS, levelProblems, MAX_LEVEL_ROWS, TOTAL_LEVELS } from '@/games/brick-breaker/levels';
import { BrickBreakerSimulation, LEVELS, parseLevel, type Brick } from '@/games/brick-breaker/simulation';
import { ACHIEVEMENTS } from '@/lib/progress/definitions';
import { validateDefinitions } from '@/lib/progress/achievements';
import { isValidThresholds } from '@/lib/progress/levels';

interface Internals {
  damage(brick: Brick): void;
  loseLife(): void;
}

const internals = (sim: BrickBreakerSimulation) => sim as unknown as Internals;

function newSim(level?: number): BrickBreakerSimulation {
  return new BrickBreakerSimulation({ seed: 1, modifier: null, level });
}

function breakable(sim: BrickBreakerSimulation): Brick[] {
  return sim.bricks.filter((b) => b.alive && !b.steel);
}

function clearAllButOne(sim: BrickBreakerSimulation): Brick {
  const bricks = breakable(sim);
  const last = bricks.pop()!;
  for (const b of bricks) b.alive = false;
  last.hp = 1;
  return last;
}

describe('Brick Breaker level set', () => {
  it('has 30 levels matching the catalogue config', () => {
    const levels = getGame('brick-breaker');
    expect(levels.engine).toBe('canvas');
    expect(LEVELS).toHaveLength(TOTAL_LEVELS);
    if (levels.engine === 'canvas') expect(levels.levels?.count).toBe(LEVELS.length);
  });

  it('keeps the eight hand-built levels first', () => {
    expect(LEVELS.slice(0, HAND_BUILT_COUNT).map((l) => l.name)).toEqual([
      'Warm-Up',
      'Pyramid',
      'Stripes',
      'Checkerboard',
      'Fortress',
      'Diamond',
      'Gates',
      'Finale',
    ]);
  });

  it('gives every level a name, a valid layout and no sealed-in bricks', () => {
    for (const [i, level] of LEVELS.entries()) {
      expect(level.name.trim(), `level ${i + 1} name`).not.toBe('');
      expect(levelProblems(level.rows), `level ${i + 1} (${level.name})`).toEqual([]);
      expect(level.rows.length).toBeLessThanOrEqual(MAX_LEVEL_ROWS);
    }
  });

  it('keeps every brick inside the play area and above the paddle', () => {
    for (const level of LEVELS) {
      for (const b of parseLevel(level.rows)) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(540);
        expect(b.y + b.h).toBeLessThan(600);
      }
    }
  });

  it('uses unique names and unique layouts', () => {
    expect(new Set(LEVELS.map((l) => l.name)).size).toBe(LEVELS.length);
    expect(new Set(LEVELS.map((l) => l.rows.join('/'))).size).toBe(LEVELS.length);
  });

  it('builds the same levels every time', () => {
    expect(buildLevels()).toEqual(LEVELS);
  });

  it('makes generated levels left-right symmetric', () => {
    for (const level of LEVELS.slice(HAND_BUILT_COUNT)) {
      for (const row of level.rows) expect(row).toBe([...row].reverse().join(''));
    }
  });

  it('gets tougher: later generated levels have tougher bricks and more of them', () => {
    const stats = (levels: typeof LEVELS) => {
      let bricks = 0;
      let hp = 0;
      for (const level of levels) {
        for (const b of parseLevel(level.rows)) {
          if (b.steel) continue;
          bricks++;
          hp += b.hp;
        }
      }
      return { bricks: bricks / levels.length, hp: hp / bricks };
    };
    const early = stats(LEVELS.slice(HAND_BUILT_COUNT, HAND_BUILT_COUNT + 5));
    const late = stats(LEVELS.slice(-5));
    expect(late.hp).toBeGreaterThan(early.hp);
    expect(late.bricks).toBeGreaterThan(early.bricks);
  });
});

describe('level fairness check', () => {
  it('accepts the hand-built layouts', () => {
    expect(levelProblems(LEVELS[4]!.rows)).toEqual([]);
  });

  it('rejects bricks that are sealed in by steel', () => {
    const sealed = ['##########', '#11111111#', '#11111111#', '##########'];
    const problems = levelProblems(sealed);
    expect(problems.some((p) => p.includes('sealed in by steel'))).toBe(true);
  });

  it('accepts a pocket that can be reached through a gap', () => {
    const open = ['1111111111', '#11111111#', '#11111111#', '#111..111#'];
    expect(levelProblems(open)).toEqual([]);
  });

  it('rejects wrong sizes, unknown characters and too few bricks', () => {
    expect(levelProblems([])).not.toEqual([]);
    expect(levelProblems(Array.from({ length: MAX_LEVEL_ROWS + 1 }, () => '1'.repeat(LEVEL_COLUMNS))).join()).toContain('needs 1 to');
    expect(levelProblems(['111111111'])).not.toEqual([]);
    expect(levelProblems(['11111x1111'])).not.toEqual([]);
    expect(levelProblems(['1.........']).join()).toContain('breakable');
  });
});

describe('Brick Breaker starting level', () => {
  it('starts at level 1 by default', () => {
    const sim = newSim();
    expect(sim.level).toBe(1);
    expect(sim.getHud().find((h) => h.id === 'level')?.value).toBe('1/30');
  });

  it('starts at the requested level with that level’s layout', () => {
    const sim = newSim(12);
    expect(sim.level).toBe(12);
    expect(sim.levelReached).toBe(12);
    expect(sim.bricks).toHaveLength(parseLevel(LEVELS[11]!.rows).length);
    expect(sim.getHud().find((h) => h.id === 'level')?.value).toBe('12/30');
    expect(sim.levelName).toBe(LEVELS[11]!.name);
  });

  it('clamps and ignores invalid levels', () => {
    expect(newSim(0).level).toBe(1);
    expect(newSim(-5).level).toBe(1);
    expect(newSim(99).level).toBe(TOTAL_LEVELS);
    expect(newSim(2.5).level).toBe(1);
    expect(newSim(NaN).level).toBe(1);
  });
});

describe('Brick Breaker level results and counters', () => {
  it('reports no lost balls for a clean clear, and the matching counters', () => {
    const sim = newSim(3);
    const last = clearAllButOne(sim);
    internals(sim).damage(last);
    expect(sim.drainLevelResults()).toEqual([{ level: 3, value: 0 }]);
    const counters = sim.drainCounters();
    expect(counters).toContainEqual({ counter: 'brick-breaker:levels-cleared', value: 1, mode: 'add' });
    expect(counters).toContainEqual({ counter: 'brick-breaker:highest-level', value: 3, mode: 'max' });
    expect(counters).toContainEqual({ counter: 'brick-breaker:flawless-levels', value: 1, mode: 'add' });
  });

  it('counts balls lost on the level and withholds the flawless counter', () => {
    const sim = newSim();
    internals(sim).loseLife();
    internals(sim).loseLife();
    sim.drainCounters();
    internals(sim).damage(clearAllButOne(sim));
    expect(sim.drainLevelResults()).toEqual([{ level: 1, value: 2 }]);
    expect(sim.drainCounters().map((c) => c.counter)).not.toContain('brick-breaker:flawless-levels');
  });

  it('counts lost balls per level, not per run', () => {
    const sim = newSim();
    internals(sim).loseLife();
    internals(sim).damage(clearAllButOne(sim));
    expect(sim.drainLevelResults()).toEqual([{ level: 1, value: 1 }]);
    const idle = { actions: { left: { held: false, pressed: false, released: false }, right: { held: false, pressed: false, released: false }, launch: { held: false, pressed: false, released: false } }, pointer: { inside: false, x: 0, y: 0, down: false, pressed: false, released: false, moved: false } };
    for (let i = 0; i < 240; i++) sim.update(1 / 120, idle);
    expect(sim.level).toBe(2);
    internals(sim).damage(clearAllButOne(sim));
    expect(sim.drainLevelResults()).toEqual([{ level: 2, value: 0 }]);
  });

  it('reports a rising combo as max counter updates', () => {
    const sim = newSim();
    const bricks = breakable(sim).slice(0, 3);
    for (const b of bricks) {
      b.hp = 1;
      internals(sim).damage(b);
    }
    const combos = sim.drainCounters().filter((c) => c.counter === 'brick-breaker:best-combo');
    expect(combos.map((c) => c.value)).toEqual([1, 2, 3]);
    expect(combos.every((c) => c.mode === 'max')).toBe(true);
  });

  it('empties the queues once drained', () => {
    const sim = newSim();
    internals(sim).damage(clearAllButOne(sim));
    sim.drainLevelResults();
    sim.drainCounters();
    expect(sim.drainLevelResults()).toEqual([]);
    expect(sim.drainCounters()).toEqual([]);
  });

  it('wins after the last level and still reports its result', () => {
    const sim = newSim(TOTAL_LEVELS);
    internals(sim).damage(clearAllButOne(sim));
    expect(sim.won).toBe(true);
    expect(sim.drainLevelResults()).toEqual([{ level: TOTAL_LEVELS, value: 0 }]);
  });
});

describe('Brick Breaker progression config', () => {
  it('has valid star thresholds and a usable star gate', () => {
    const game = getGame('brick-breaker');
    if (game.engine !== 'canvas' || !game.levels) throw new Error('missing levels config');
    expect(isValidThresholds(game.levels.thresholds, game.levels.direction)).toBe(true);
    expect(game.levels.gate).toBeDefined();
    const gate = game.levels.gate!;
    expect(gate.starsPerGate).toBeGreaterThan(game.levels.count > 0 ? gate.every : 0);
    expect(gate.starsPerGate).toBeLessThanOrEqual(gate.every * 3);
  });

  it('defines valid achievements whose counters the simulation really emits', () => {
    expect(validateDefinitions(ACHIEVEMENTS)).toEqual([]);
    const sim = newSim();
    const emitted = new Set<string>();
    for (const b of breakable(sim).slice(0, 2)) {
      b.hp = 1;
      internals(sim).damage(b);
    }
    internals(sim).damage(clearAllButOne(sim));
    for (const c of sim.drainCounters()) emitted.add(c.counter);
    for (const def of ACHIEVEMENTS) expect(emitted.has(def.counter), `${def.id} → ${def.counter}`).toBe(true);
  });
});
