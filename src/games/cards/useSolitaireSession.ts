'use client';

import { useEffect, useState } from 'react';
import type { GameHost } from '@/games/dom/types';
import { formatDuration } from '@/lib/format';
import { loadStats, recordStat, statsFor, type WinStats } from './stats';
import { useGameClock } from './useGameClock';

export function useSolitaireSession(host: GameHost, statsVariant: string, paused: boolean) {
  const [started, setStarted] = useState(false);
  const [winTime, setWinTime] = useState<number | null>(null);
  const [stats, setStats] = useState<WinStats>(() => statsFor(loadStats(host.storage), statsVariant));
  const over = winTime !== null;
  const clock = useGameClock(started && !paused && !over);

  const start = () => {
    if (started) return;
    setStarted(true);
    host.setInProgress(true);
    setStats(recordStat(host.storage, statsVariant, 'played'));
  };

  const win = (): number => {
    if (winTime !== null) return winTime;
    const time = Math.max(1, Math.round(clock.read()));
    setWinTime(time);
    setStats(recordStat(host.storage, statsVariant, 'won'));
    host.playSound('win');
    return time;
  };

  return { started, over, winTime, stats, elapsed: clock.elapsed, timeText: formatDuration(clock.elapsed), start, win };
}

export function useFinishAfter(ready: boolean, finish: () => void, delayMs: number): void {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!ready || done) return;
    const id = window.setTimeout(() => {
      setDone(true);
      finish();
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [ready, done, finish, delayMs]);
}
