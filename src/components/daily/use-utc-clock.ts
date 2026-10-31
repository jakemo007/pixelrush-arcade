'use client';

import { useSyncExternalStore } from 'react';
import { toUtcDateKey } from '@/lib/daily/challenge';

function subscribeMinute(callback: () => void): () => void {
  const timer = window.setInterval(callback, 60_000);
  const onVisible = () => {
    if (!document.hidden) callback();
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

export function useUtcDateKey(): string | null {
  return useSyncExternalStore(subscribeMinute, () => toUtcDateKey(new Date()), () => null);
}

export function useMinuteClock(): number | null {
  return useSyncExternalStore(
    subscribeMinute,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => null,
  );
}
