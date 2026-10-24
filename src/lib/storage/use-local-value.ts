'use client';

import { useSyncExternalStore } from 'react';

/** Re-render when another tab changes localStorage, or when our own code signals a change. */
const LOCAL_EVENT = 'pixelrush:storage';

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(LOCAL_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(LOCAL_EVENT, callback);
  };
}

/** Call after writing to storage so components showing stored values refresh. */
export function notifyLocalChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LOCAL_EVENT));
}

/**
 * Reads a primitive value derived from localStorage without hydration
 * mismatches: the server and the first client render use `fallback`, then
 * React re-renders with the stored value. `read` must return a primitive
 * (string/number/boolean) so snapshots compare by value.
 */
export function useLocalValue<T extends string | number | boolean | null>(read: () => T, fallback: T): T {
  return useSyncExternalStore(subscribe, read, () => fallback);
}
