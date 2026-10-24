/**
 * Small deterministic random utilities. Seeded generators make the daily
 * challenge identical in every browser and let tests replay game runs.
 */

export type Rng = () => number;

/** 32-bit FNV-1a hash of a string. Stable across browsers and Node. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32: fast, well-distributed 32-bit PRNG returning values in [0, 1). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derives an independent stream from a seed so that, e.g., cosmetic effects never shift gameplay randomness. */
export function deriveSeed(seed: number, stream: string): number {
  return hashString(`${seed >>> 0}:${stream}`);
}

export function randomRange(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng();
}

export function randomInt(rng: Rng, min: number, maxInclusive: number): number {
  return Math.floor(min + (maxInclusive - min + 1) * rng());
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() requires a non-empty array');
  return items[Math.floor(rng() * items.length)] as T;
}

/** Picks from weighted entries; weights must be >= 0 with a positive total. */
export function pickWeighted<T>(rng: Rng, entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, w]) => sum + Math.max(0, w), 0);
  if (total <= 0) throw new Error('pickWeighted() requires a positive total weight');
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= Math.max(0, weight);
    if (roll < 0) return value;
  }
  return entries[entries.length - 1]![0];
}

/** A fresh, non-deterministic seed for ordinary (non-challenge) runs. */
export function randomSeed(): number {
  return (Math.random() * 4294967296) >>> 0;
}
