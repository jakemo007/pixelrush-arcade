'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useGameClock(running: boolean): { elapsed: number; read: () => number } {
  const [elapsed, setElapsed] = useState(0);
  const baseRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const startedAt = performance.now();
    startedAtRef.current = startedAt;
    const base = baseRef.current;
    const id = window.setInterval(() => setElapsed(base + (performance.now() - startedAt)), 250);
    return () => {
      window.clearInterval(id);
      baseRef.current = base + (performance.now() - startedAt);
      startedAtRef.current = null;
      setElapsed(baseRef.current);
    };
  }, [running]);

  const read = useCallback(() => {
    const startedAt = startedAtRef.current;
    return baseRef.current + (startedAt === null ? 0 : performance.now() - startedAt);
  }, []);

  return { elapsed, read };
}
