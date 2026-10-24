'use client';

import { useSyncExternalStore } from 'react';
import { toUtcDateKey } from '@/lib/daily/challenge';

/**
 * Subscribes to a clock that ticks once a minute (and when the tab becomes
 * visible again), so the daily challenge rolls over at 00:00 UTC without a
 * reload. The site is statically built, so "today" must be computed in the
 * browser rather than at build time.
 */
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

/** Today's UTC date key, or null during server rendering / hydration. */
export function useUtcDateKey(): string | null {
  return useSyncExternalStore(subscribeMinute, () => toUtcDateKey(new Date()), () => null);
}

/** Current time rounded down to the minute (ms), or null before hydration. */
export function useMinuteClock(): number | null {
  return useSyncExternalStore(
    subscribeMinute,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => null,
  );
}
