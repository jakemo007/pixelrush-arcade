export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_PREFIX = 'pixelrush:v1:';

export function storageKey(name: string): string {
  return `${STORAGE_PREFIX}${name}`;
}

let cachedStore: KeyValueStore | null | undefined;

export function getBrowserStorage(): KeyValueStore | null {
  if (cachedStore !== undefined) return cachedStore;
  if (typeof window === 'undefined') return null;
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

export function resetStorageCache(): void {
  cachedStore = undefined;
}

export type Validator<T> = (value: unknown) => value is T;

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
