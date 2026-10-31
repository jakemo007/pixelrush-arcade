import { createRng, deriveSeed, type Rng } from '@/lib/utils/random';

export const LEVEL_COLUMNS = 10;
export const MAX_LEVEL_ROWS = 12;
export const MIN_BREAKABLE = 12;
export const HAND_BUILT_COUNT = 8;
export const TOTAL_LEVELS = 30;

export interface LevelDef {
  name: string;
  rows: readonly string[];
}

const HAND_BUILT: readonly LevelDef[] = [
  { name: 'Warm-Up', rows: ['1111111111', '1111111111', '1111111111', '1111111111'] },
  { name: 'Pyramid', rows: ['....22....', '...2112...', '..211112..', '.21111112.', '2111111112'] },
  { name: 'Stripes', rows: ['2222222222', '1111111111', '..........', '3333333333', '1111111111'] },
  { name: 'Checkerboard', rows: ['2.2.2.2.2.', '.1.1.1.1.1', '3.3.3.3.3.', '.1.1.1.1.1', '2.2.2.2.2.', '.2.2.2.2.2'] },
  { name: 'Fortress', rows: ['1111111111', '1#222222#1', '1#2.33.2#1', '1#2.33.2#1', '1#222222#1', '1111111111'] },
  { name: 'Diamond', rows: ['....33....', '...3223...', '..321123..', '.32111123.', '..321123..', '...3223...', '....33....'] },
  { name: 'Gates', rows: ['3333333333', '2#2#22#2#2', '1111111111', '1#1#11#1#1', '2222222222'] },
  { name: 'Finale', rows: ['3333333333', '3#222222#3', '3#2.11.2#3', '3#2.11.2#3', '3#222222#3', '3333333333', '2222222222'] },
];

const GENERATED_NAMES = [
  'Bricklayer',
  'Zigzag',
  'Tide',
  'Staircase',
  'Cross',
  'Honeycomb',
  'Citadel',
  'Waves',
  'Spiral',
  'Rain',
  'Bridge',
  'Maze',
  'Crown',
  'Vault',
  'Twin Towers',
  'Arrows',
  'Canyon',
  'Orbit',
  'Lattice',
  'Summit',
  'Gauntlet',
  'Grand Finale',
] as const;

export function levelProblems(rows: readonly string[]): string[] {
  const problems: string[] = [];
  if (rows.length < 1 || rows.length > MAX_LEVEL_ROWS) problems.push(`needs 1 to ${MAX_LEVEL_ROWS} rows, has ${rows.length}`);
  let breakable = 0;
  for (const [r, row] of rows.entries()) {
    if (row.length !== LEVEL_COLUMNS) problems.push(`row ${r + 1} has ${row.length} columns`);
    if (!/^[.#123]*$/.test(row)) problems.push(`row ${r + 1} has an unknown character`);
    for (const ch of row) if (ch === '1' || ch === '2' || ch === '3') breakable++;
  }
  if (breakable < MIN_BREAKABLE) problems.push(`only ${breakable} breakable bricks`);

  const height = rows.length;
  const open = (r: number, c: number) => r >= 0 && r < height && c >= 0 && c < LEVEL_COLUMNS && rows[r]![c] !== '#';
  const seen = new Set<number>();
  const stack: [number, number][] = [];
  const push = (r: number, c: number) => {
    const key = r * LEVEL_COLUMNS + c;
    if (!open(r, c) || seen.has(key)) return;
    seen.add(key);
    stack.push([r, c]);
  };
  for (let c = 0; c < LEVEL_COLUMNS; c++) {
    push(0, c);
    push(height - 1, c);
  }
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    push(r - 1, c);
    push(r + 1, c);
    push(r, c - 1);
    push(r, c + 1);
  }
  for (const [r, row] of rows.entries()) {
    for (let c = 0; c < Math.min(row.length, LEVEL_COLUMNS); c++) {
      if (/[123]/.test(row[c]!) && !seen.has(r * LEVEL_COLUMNS + c)) problems.push(`brick at row ${r + 1}, column ${c + 1} is sealed in by steel`);
    }
  }
  return problems;
}

function pickHp(rng: Rng, t: number): string {
  const w1 = 5 - 3 * t;
  const w2 = 3;
  const w3 = 1 + 4 * t;
  const roll = rng() * (w1 + w2 + w3);
  if (roll < w1) return '1';
  return roll < w1 + w2 ? '2' : '3';
}

function buildRows(level: number, attempt: number): string[] {
  const rng = createRng(deriveSeed(level * 101 + attempt, 'brick-breaker-level'));
  const t = (level - HAND_BUILT_COUNT - 1) / (TOTAL_LEVELS - HAND_BUILT_COUNT - 1);
  const height = Math.min(MAX_LEVEL_ROWS, 5 + Math.floor(t * 4) + Math.floor(rng() * 2));
  const density = 0.62 + 0.2 * t;
  const steel = 0.03 + 0.1 * t;
  const half = LEVEL_COLUMNS / 2;
  const rows: string[] = [];
  for (let r = 0; r < height; r++) {
    const left: string[] = [];
    for (let c = 0; c < half; c++) {
      const roll = rng();
      if (roll < steel && r > 0 && r < height - 1) left.push('#');
      else if (roll < steel + density) left.push(pickHp(rng, t));
      else left.push('.');
    }
    rows.push(left.join('') + [...left].reverse().join(''));
  }
  return rows;
}

const SAFE_ROWS = (level: number): string[] => {
  const hp = String(1 + (level % 3));
  return [hp.repeat(LEVEL_COLUMNS), '..' + '2'.repeat(LEVEL_COLUMNS - 4) + '..', '3'.repeat(LEVEL_COLUMNS), '.' + hp.repeat(LEVEL_COLUMNS - 2) + '.'];
};

export function generateLevel(level: number): LevelDef {
  const name = GENERATED_NAMES[level - HAND_BUILT_COUNT - 1] ?? `Level ${level}`;
  for (let attempt = 0; attempt < 40; attempt++) {
    const rows = buildRows(level, attempt);
    if (levelProblems(rows).length === 0) return { name, rows };
  }
  return { name, rows: SAFE_ROWS(level) };
}

export function buildLevels(): readonly LevelDef[] {
  const levels: LevelDef[] = [...HAND_BUILT];
  for (let level = HAND_BUILT_COUNT + 1; level <= TOTAL_LEVELS; level++) levels.push(generateLevel(level));
  return levels;
}

export const LEVELS: readonly LevelDef[] = buildLevels();
