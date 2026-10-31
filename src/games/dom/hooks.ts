'use client';

import { useEffect, useRef, useState } from 'react';

export function useStopwatch(running: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const baseRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const startedAt = performance.now();
    const base = baseRef.current;
    const tick = () => setElapsed(base + (performance.now() - startedAt));
    const id = window.setInterval(tick, 250);
    return () => {
      window.clearInterval(id);
      baseRef.current = base + (performance.now() - startedAt);
      setElapsed(baseRef.current);
    };
  }, [running]);

  return elapsed;
}

export function useInterval(callback: () => void, ms: number, active = true): void {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => saved.current(), ms);
    return () => window.clearInterval(id);
  }, [ms, active]);
}

export function useTimeout(callback: () => void, ms: number, active = true): void {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => saved.current(), ms);
    return () => window.clearTimeout(id);
  }, [ms, active]);
}

export type GridDirection = 'up' | 'down' | 'left' | 'right';

export function keyToDirection(code: string, wasd = false): GridDirection | null {
  switch (code) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
  }
  if (!wasd) return null;
  switch (code) {
    case 'KeyW':
      return 'up';
    case 'KeyS':
      return 'down';
    case 'KeyA':
      return 'left';
    case 'KeyD':
      return 'right';
  }
  return null;
}

export function moveInGrid(row: number, col: number, dir: GridDirection, rows: number, cols: number): { row: number; col: number } {
  switch (dir) {
    case 'up':
      return { row: Math.max(0, row - 1), col };
    case 'down':
      return { row: Math.min(rows - 1, row + 1), col };
    case 'left':
      return { row, col: Math.max(0, col - 1) };
    case 'right':
      return { row, col: Math.min(cols - 1, col + 1) };
  }
}

export function useSwipe(onSwipe: (dir: GridDirection) => void, minDistance = 24) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const saved = useRef(onSwipe);
  useEffect(() => {
    saved.current = onSwipe;
  });
  return {
    onPointerDown(e: React.PointerEvent) {
      start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    onPointerUp(e: React.PointerEvent) {
      const s = start.current;
      start.current = null;
      if (!s || s.id !== e.pointerId) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) return;
      saved.current(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    },
    onPointerCancel() {
      start.current = null;
    },
  };
}
