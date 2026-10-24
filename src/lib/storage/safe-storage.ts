/**
 * Defensive wrapper around localStorage.
 *
 * localStorage can be missing (server rendering), disabled (privacy settings,
 * some embedded browsers), full (QuotaExceededError) or contain values written
 * by an older version or edited by hand. None of that may break gameplay, so
 * every function here catches errors and validates what it reads.
 */

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** All PixelRush keys share this versioned prefix. Bump the version on breaking format changes. */
export const STORAGE_PREFIX = 'pixelrush:v1:';

export function storageKey(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

let cachedStore: KeyValueStore | null | undefined;

/** Returns window.localStorage if it exists and accepts writes, otherwise null. */
export function getBrowserStorage(): KeyValueStore | null {
  if (cachedStore !== undefined) return cachedStore;
  if (typeof window === 'undefined') return null; // never cache the server result
  try {
    const store = window.localStorage;
    const probe = `${STORAGE_PREFIX}__probe__`;
    store.setItem(probe, '1');
    store.removeItem(probe);
    cachedStore = store;
  } catch {
    cachedStore = null;
  }
  return cachedStore;
}

/** Test helper: forget the cached availability check. */
export function resetStorageCache(): void {
  cachedStore = undefined;
}

export type Validator<T> = (value: unknown) => value is T;

/** Reads and validates JSON. Returns null for missing, corrupt or invalid data. */
export function readJson<T>(store: KeyValueStore | null, key: string, validate: Validator<T>): T | null {
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Writes JSON. Returns false instead of throwing when storage is unavailable or full. */
export function writeJson(store: KeyValueStore | null, key: string, value: unknown): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
