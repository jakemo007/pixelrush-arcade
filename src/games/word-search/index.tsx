'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DomGameProps } from '@/games/dom/types';
import { useStopwatch, useTimeout } from '@/games/dom/hooks';
import { formatDuration } from '@/lib/format';
import { randomSeed } from '@/lib/utils/random';
import { generatePuzzle, lineCells, matchSelection, readCells, snapEnd, type VariantId } from './generator';
import styles from './WordSearch.module.css';

const COLORS = ['#38e8ff', '#ff5bdc', '#ffd23f', '#4dffb5', '#a78bfa', '#ff8a3d', '#5b9dff', '#ff6b8a', '#b8f35b', '#f4a3ff', '#7ae1c3', '#ffb86b'];
const LABELS: Record<VariantId, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

interface Drag {
  start: number;
  end: number;
  pointerId: number;
  moved: boolean;
}

function toVariant(v: string): VariantId {
  return v === 'medium' || v === 'hard' ? v : 'easy';
}

export default function WordSearch({ host, variant, paused }: DomGameProps) {
  const level = toVariant(variant);
  const [puzzle] = useState(() => generatePuzzle(randomSeed(), level));
  const { size, letters, placements, theme } = puzzle;
  const [found, setFound] = useState<string[]>([]);
  const foundRef = useRef<string[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [flash, setFlash] = useState<{ cells: number[]; id: number } | null>(null);
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState(false);
  const elapsed = useStopwatch(started && !paused && !over);
  const elapsedRef = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const focusCursor = useRef(false);

  useEffect(() => {
    elapsedRef.current = elapsed;
  });

  const foundSet = useMemo(() => new Set(found), [found]);
  const colorOf = useMemo(() => new Map(found.map((w, i) => [w, COLORS[i % COLORS.length]!])), [found]);
  const foundCells = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const p of placements) if (foundSet.has(p.word)) for (const c of p.cells) map.set(c, [...(map.get(c) ?? []), p.word]);
    return map;
  }, [placements, foundSet]);
  const seconds = Math.floor(elapsed / 1000);

  useEffect(() => {
    host.setHud([
      { id: 'time', label: 'Time', value: formatDuration(seconds * 1000) },
      { id: 'found', label: 'Found', value: `${found.length}/${placements.length}` },
    ]);
  }, [host, seconds, found.length, placements.length]);

  useEffect(() => {
    if (!focusCursor.current) return;
    focusCursor.current = false;
    cellRefs.current[cursor]?.focus();
  }, [cursor]);

  useTimeout(() => setFlash(null), 450, flash !== null);
  useTimeout(
    () =>
      host.finish({
        outcome: 'won',
        value: Math.max(1, Math.round(elapsedRef.current)),
        title: 'All words found!',
        detail: `${theme.name}, ${LABELS[level]}: ${placements.length} words found.`,
      }),
    host.reducedMotion ? 150 : 800,
    over,
  );

  const updateDrag = (next: Drag | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  const begin = () => {
    if (!started) {
      setStarted(true);
      host.setInProgress(true);
    }
  };

  const trySelect = (start: number, end: number) => {
    const cells = lineCells(start, end, size);
    if (!cells || cells.length < 2) return;
    const already = foundRef.current;
    const match = matchSelection(placements, cells, new Set(already));
    if (!match) {
      setFlash({ cells, id: Date.now() });
      host.playSound('invalid');
      host.announce(`${readCells(letters, cells)} is not on the list.`);
      return;
    }
    const next = [...already, match.word];
    foundRef.current = next;
    setFound(next);
    const left = placements.length - next.length;
    if (left === 0) {
      setOver(true);
      host.setInProgress(false);
      host.playSound('win');
      host.announce(`Found ${match.word}. All words found!`);
    } else {
      host.playSound('match');
      host.announce(`Found ${match.word}. ${left} to go.`);
    }
  };

  const cellFromPoint = (clientX: number, clientY: number): number | null => {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const step = rect.width / size;
    const c = Math.min(size - 1, Math.max(0, Math.floor((clientX - rect.left) / step)));
    const r = Math.min(size - 1, Math.max(0, Math.floor((clientY - rect.top) / step)));
    return r * size + c;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (over || paused || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell === null) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    begin();
    setCursor(cell);
    updateDrag({ start: cell, end: cell, pointerId: e.pointerId, moved: false });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== e.pointerId) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell === null) return;
    const end = snapEnd(current.start, cell, size);
    if (end !== current.end) updateDrag({ ...current, end, moved: true });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== e.pointerId) return;
    const { start, end } = current;
    updateDrag(null);
    if (end !== start) {
      setAnchor(null);
      setCursor(end);
      trySelect(start, end);
      return;
    }
    if (anchor === null || anchor === start) {
      setAnchor(anchor === start ? null : start);
      if (anchor !== start) host.announce(`Start: ${letters[start]}. Tap the last letter of the word.`);
      return;
    }
    const snapped = snapEnd(anchor, start, size);
    setAnchor(null);
    trySelect(anchor, snapped);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (over || paused) return;
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const mv = moves[e.key];
    if (mv) {
      e.preventDefault();
      const r = Math.min(size - 1, Math.max(0, Math.floor(cursor / size) + mv[0]));
      const c = Math.min(size - 1, Math.max(0, (cursor % size) + mv[1]));
      focusCursor.current = true;
      setCursor(r * size + c);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      begin();
      if (anchor === null) {
        setAnchor(cursor);
        host.announce(`Selection started on ${letters[cursor]}. Move to the last letter and press Enter.`);
      } else if (anchor === cursor) {
        setAnchor(null);
        host.announce('Selection cancelled.');
      } else {
        const end = snapEnd(anchor, cursor, size);
        setAnchor(null);
        trySelect(anchor, end);
      }
      return;
    }
    if (e.key === 'Escape' && anchor !== null) {
      e.preventDefault();
      setAnchor(null);
      host.announce('Selection cancelled.');
    }
  };

  const preview = drag ? lineCells(drag.start, drag.end, size) : anchor !== null ? lineCells(anchor, snapEnd(anchor, cursor, size), size) : null;
  const previewSet = new Set(preview ?? []);
  const center = (cell: number) => ({ x: (cell % size) + 0.5, y: Math.floor(cell / size) + 0.5 });

  const capsule = (cells: readonly number[], key: string, color: string, kind: 'found' | 'preview' | 'flash') => {
    const a = center(cells[0]!);
    const b = center(cells[cells.length - 1]!);
    return <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles[kind]} stroke={color} />;
  };

  return (
    <div className={styles.root} style={{ '--n': size } as React.CSSProperties}>
      <div className={styles.boardCol}>
        <p className={styles.theme}>
          Theme: <strong>{theme.name}</strong>
        </p>
        <div className={styles.boardWrap}>
          <svg className={styles.overlay} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
            {placements.filter((p) => foundSet.has(p.word)).map((p) => capsule(p.cells, p.word, colorOf.get(p.word)!, 'found'))}
            {preview && capsule(preview, 'preview', 'var(--accent)', 'preview')}
            {flash && capsule(flash.cells, `flash-${flash.id}`, 'var(--color-danger)', 'flash')}
          </svg>
          <div
            ref={gridRef}
            className={styles.grid}
            role="grid"
            aria-label={`Word search, ${size} by ${size}. Theme: ${theme.name}. ${found.length} of ${placements.length} words found.`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => updateDrag(null)}
            onKeyDown={onKeyDown}
          >
            {Array.from({ length: size }, (_, r) => (
              <div key={r} role="row" className={styles.row}>
                {Array.from({ length: size }, (_, c) => {
                  const cell = r * size + c;
                  const inWords = foundCells.get(cell);
                  const isCursor = cell === cursor;
                  const label = [
                    `Row ${r + 1}, column ${c + 1}, ${letters[cell]}`,
                    anchor === cell ? 'selection start' : '',
                    inWords ? `part of ${inWords.join(' and ')}` : '',
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <div
                      key={cell}
                      ref={(el) => {
                        cellRefs.current[cell] = el;
                      }}
                      role="gridcell"
                      tabIndex={isCursor ? 0 : -1}
                      data-game-focus={isCursor ? true : undefined}
                      aria-label={label}
                      aria-selected={previewSet.has(cell)}
                      className={styles.cell}
                      data-found={inWords ? true : undefined}
                      data-active={previewSet.has(cell) || undefined}
                      data-anchor={anchor === cell || undefined}
                      onFocus={() => setCursor(cell)}
                    >
                      <span aria-hidden="true">{letters[cell]}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.listCol}>
        <p className={styles.progress}>
          Found <strong>{found.length}</strong> of {placements.length}
        </p>
        <ul className={styles.words} aria-label="Words to find">
          {placements.map((p) => {
            const isFound = foundSet.has(p.word);
            return (
              <li
                key={p.word}
                data-found={isFound || undefined}
                style={isFound ? ({ '--chip': colorOf.get(p.word) } as React.CSSProperties) : undefined}
                aria-label={`${p.word}, ${isFound ? 'found' : 'not found yet'}`}
              >
                <span className={styles.mark} aria-hidden="true">
                  {isFound ? '✓' : ''}
                </span>
                <span className={styles.word} aria-hidden="true">
                  {p.word}
                </span>
              </li>
            );
          })}
        </ul>
        <p className={styles.help}>
          {level === 'easy'
            ? 'Words run left to right or top to bottom.'
            : level === 'medium'
              ? 'Words run left to right, top to bottom, or diagonally left to right.'
              : 'Words can run in any of the eight directions, including backwards.'}{' '}
          Drag across a word, or tap its first and last letters.
        </p>
      </div>
    </div>
  );
}
