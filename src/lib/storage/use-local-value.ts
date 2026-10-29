'use client';

import { useSyncExternalStore } from 'react';

const LOCAL_EVENT = 'pixelrush:storage';

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(LOCAL_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(LOCAL_EVENT, callback);
  };
}

export function notifyLocalChange(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LOCAL_EVENT));
}

export function useLocalValue<T extends string | number | boolean | null>(read: () => T, fallback: T): T {
  return useSyncExternalStore(subscribe, read, () => fallback);
}
