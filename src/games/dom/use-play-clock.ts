'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PlayClock } from './clock';

export function usePlayClock(running: boolean): { elapsed: number; read: () => number } {
  const clockRef = useRef<PlayClock | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const clock = (clockRef.current ??= new PlayClock());
    clock.start(performance.now());
    const id = window.setInterval(() => setElapsed(clock.read(performance.now())), 250);
    return () => {
      window.clearInterval(id);
      clock.stop(performance.now());
      setElapsed(clock.read(performance.now()));
    };
  }, [running]);

  const read = useCallback(() => clockRef.current?.read(performance.now()) ?? 0, []);
  return { elapsed, read };
}
