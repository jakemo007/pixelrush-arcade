'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { DomGameProps } from '@/games/dom/types';
import { keyToDirection, moveInGrid } from '@/games/dom/hooks';
import { formatDuration } from '@/lib/format';
import { createRng, randomSeed } from '@/lib/utils/random';
import {
  canChord,
  chord,
  createBoard,
  difficultyFor,
  finishLoss,
  finishWin,
  flagsAround,
  isWon,
  minesLeft,
  reveal,
  safeRevealed,
  toggleFlag,
  type Cell,
  type RevealResult,
} from './rules';
import { usePlayClock } from '@/games/dom/use-play-clock';
import styles from './Minesweeper.module.css';

type Status = 'ready' | 'playing' | 'won' | 'lost';
type Mode = 'reveal' | 'flag';

const LONG_PRESS_MS = 400;
const MOVE_TOLERANCE = 10;

const NARROW_QUERY = '(max-width: 700px) and (orientation: portrait)';
const subscribeNarrow = (onChange: () => void) => {
  const mq = window.matchMedia(NARROW_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
};
const getNarrow = () => window.matchMedia(NARROW_QUERY).matches;
const getNarrowOnServer = () => false;

const LABELS: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', expert: 'Expert' };

function describeCell(cell: Cell): string {
  if (cell.state === 'flagged') return cell.wrongFlag ? 'flagged, but no mine' : 'flagged';
  if (cell.state === 'hidden') return 'hidden';
  if (cell.mine) return cell.exploded ? 'mine, exploded' : 'mine';
  if (cell.adjacent === 0) return 'empty, no mines nearby';
  return `${cell.adjacent} ${cell.adjacent === 1 ? 'mine' : 'mines'} nearby`;
}

interface Press {
  index: number;
  pointerId: number;
  x: number;
  y: number;
  timer: number;
}

export default function Minesweeper({ host, variant, paused }: DomGameProps) {
  const [difficulty] = useState(() => difficultyFor(variant));
  const [rng] = useState(() => createRng(randomSeed()));
  const [board, setBoard] = useState(() => createBoard(difficulty));
  const [status, setStatus] = useState<Status>('ready');
  const [mode, setMode] = useState<Mode>('reveal');
  const [zoom, setZoom] = useState(false);
  const [cursor, setCursor] = useState(() => Math.floor(difficulty.rows / 2) * difficulty.cols + Math.floor(difficulty.cols / 2));
  const narrow = useSyncExternalStore(subscribeNarrow, getNarrow, getNarrowOnServer);
  const over = status === 'won' || status === 'lost';
  const { elapsed, read } = usePlayClock(status === 'playing' && !paused);

  const gridRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<Press | null>(null);
  const suppressClickUntil = useRef(0);
  const lastPointerType = useRef('mouse');

  const { rows, cols } = board;
  const transposed = narrow && cols > rows;
  const displayRows = transposed ? cols : rows;
  const displayCols = transposed ? rows : cols;
  const toIndex = (dr: number, dc: number) => (transposed ? dc * cols + dr : dr * cols + dc);
  const toDisplay = (index: number) => {
    const r = Math.floor(index / cols);
    const c = index % cols;
    return transposed ? { row: c, col: r } : { row: r, col: c };
  };

  const left = minesLeft(board);
  const timeText = formatDuration(elapsed);
  useEffect(() => {
    host.setHud([
      { id: 'mines', label: 'Mines', value: String(left) },
      { id: 'time', label: 'Time', value: timeText },
    ]);
  }, [host, left, timeText]);

  const settle = (result: RevealResult) => {
    if (result.hitMine !== null) {
      setBoard(finishLoss(result.board, result.hitMine));
      setStatus('lost');
      host.playSound('explode');
      const safeTotal = rows * cols - board.mines;
      host.finish({
        outcome: 'lost',
        title: 'Boom! You hit a mine',
        detail: `You cleared ${safeRevealed(result.board)} of ${safeTotal} safe squares.`,
      });
      return;
    }
    if (isWon(result.board)) {
      const time = Math.max(1, read());
      setBoard(finishWin(result.board));
      setStatus('won');
      host.playSound('win');
      host.finish({
        outcome: 'won',
        value: time,
        title: 'Field cleared!',
        detail: `${LABELS[variant] ?? 'Board'}: ${cols} x ${rows}, ${board.mines} mines.`,
      });
      return;
    }
    setBoard(result.board);
    const n = result.revealed.length;
    if (n === 0) return;
    host.playSound(n > 1 ? 'pop' : 'select');
    const only = result.revealed[0]!;
    host.announce(n === 1 ? describeCell(result.board.cells[only]!) : `Opened ${n} squares.`);
  };

  const doReveal = (index: number) => {
    const cell = board.cells[index]!;
    if (cell.state === 'flagged') {
      host.playSound('invalid');
      host.announce('That square is flagged. Remove the flag first.');
      return;
    }
    if (!board.minesPlaced) {
      setStatus('playing');
      host.setInProgress(true);
    }
    settle(reveal(board, index, rng));
  };

  const doFlag = (index: number) => {
    const next = toggleFlag(board, index);
    if (next === board) return;
    setBoard(next);
    host.setInProgress(true);
    const flagged = next.cells[index]!.state === 'flagged';
    host.playSound(flagged ? 'place' : 'flip');
    host.announce(`${flagged ? 'Flagged' : 'Flag removed'}. ${minesLeft(next)} mines left.`);
  };

  const doChord = (index: number) => {
    if (canChord(board, index)) {
      settle(chord(board, index));
      return;
    }
    const cell = board.cells[index]!;
    if (cell.adjacent > 0) {
      const flags = flagsAround(board, index);
      host.announce(`${cell.adjacent} ${cell.adjacent === 1 ? 'mine' : 'mines'} nearby, ${flags} flagged.`);
    }
  };

  const act = (index: number, action: 'primary' | 'flag') => {
    if (paused || over) return;
    const cell = board.cells[index];
    if (!cell) return;
    if (cell.state === 'revealed') {
      if (action === 'primary') doChord(index);
      return;
    }
    if (action === 'flag' || mode === 'flag') doFlag(index);
    else doReveal(index);
  };

  const actRef = useRef(act);
  useEffect(() => {
    actRef.current = act;
  });
  useEffect(
    () => () => {
      const press = pressRef.current;
      if (press) window.clearTimeout(press.timer);
    },
    [],
  );

  const cancelPress = () => {
    const press = pressRef.current;
    if (press) window.clearTimeout(press.timer);
    pressRef.current = null;
  };

  const onPointerDown = (e: React.PointerEvent, index: number) => {
    lastPointerType.current = e.pointerType;
    if (e.pointerType === 'mouse') return;
    cancelPress();
    const timer = window.setTimeout(() => {
      pressRef.current = null;
      suppressClickUntil.current = performance.now() + 1500;
      navigator.vibrate?.(15);
      actRef.current(index, 'flag');
    }, LONG_PRESS_MS);
    pressRef.current = { index, pointerId: e.pointerId, x: e.clientX, y: e.clientY, timer };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const press = pressRef.current;
    if (!press || press.pointerId !== e.pointerId) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_TOLERANCE) cancelPress();
  };

  const onClick = (e: React.MouseEvent, index: number) => {
    if (e.timeStamp < suppressClickUntil.current) {
      suppressClickUntil.current = 0;
      e.preventDefault();
      return;
    }
    setCursor(index);
    act(index, 'primary');
  };

  const onContextMenu = (e: React.MouseEvent, index: number | null) => {
    e.preventDefault();
    if (index === null || lastPointerType.current === 'touch' || lastPointerType.current === 'pen') return;
    setCursor(index);
    act(index, 'flag');
  };

  const focusCell = (index: number) => {
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-index="${index}"]`)?.focus();
  };

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target as HTMLElement;
    const index = Number(target.dataset.index ?? cursor);
    const dir = keyToDirection(e.code);
    if (dir) {
      e.preventDefault();
      const at = toDisplay(index);
      const next = moveInGrid(at.row, at.col, dir, displayRows, displayCols);
      const nextIndex = toIndex(next.row, next.col);
      setCursor(nextIndex);
      focusCell(nextIndex);
      return;
    }
    if (e.code === 'KeyF') {
      e.preventDefault();
      setCursor(index);
      act(index, 'flag');
    }
  };

  const flagTotal = board.cells.filter((c) => c.state === 'flagged').length;

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <div className={styles.segment} role="group" aria-label="Tap or click action">
          <button type="button" className={styles.segmentButton} aria-pressed={mode === 'reveal'} onClick={() => setMode('reveal')}>
            <RevealIcon /> Reveal
          </button>
          <button type="button" className={styles.segmentButton} aria-pressed={mode === 'flag'} onClick={() => setMode('flag')}>
            <FlagIcon className={styles.toolIcon} /> Flag
          </button>
        </div>
        <p className={styles.status} aria-hidden="true">
          {status === 'ready'
            ? 'Your first square is always safe.'
            : mode === 'flag' && !over
              ? 'Flag mode: taps place flags.'
              : `${flagTotal} ${flagTotal === 1 ? 'flag' : 'flags'} placed`}
        </p>
        {variant !== 'beginner' && (
          <button type="button" className={styles.zoomButton} aria-pressed={zoom} onClick={() => setZoom((z) => !z)}>
            <ZoomIcon /> Zoom
          </button>
        )}
      </div>

      <div className={styles.scroller} data-zoom={zoom || undefined}>
        <div
          ref={gridRef}
          className={styles.grid}
          role="grid"
          aria-label={`Minefield, ${displayRows} rows by ${displayCols} columns, ${board.mines} mines`}
          aria-rowcount={displayRows}
          aria-colcount={displayCols}
          data-status={status}
          style={{ '--rows': displayRows, '--cols': displayCols } as React.CSSProperties}
          onKeyDown={onGridKeyDown}
          onContextMenu={(e) => onContextMenu(e, null)}
          onPointerMove={onPointerMove}
          onPointerUp={cancelPress}
          onPointerCancel={cancelPress}
          onPointerLeave={cancelPress}
        >
          {Array.from({ length: displayRows }, (_, dr) => (
            <div key={dr} role="row" className={styles.row} aria-rowindex={dr + 1}>
              {Array.from({ length: displayCols }, (_, dc) => {
                const index = toIndex(dr, dc);
                const cell = board.cells[index]!;
                const active = index === cursor;
                return (
                  <button
                    key={dc}
                    type="button"
                    role="gridcell"
                    aria-colindex={dc + 1}
                    className={styles.cell}
                    data-index={index}
                    data-state={cell.state}
                    data-n={cell.state === 'revealed' && !cell.mine ? cell.adjacent : undefined}
                    data-mine={(cell.state === 'revealed' && cell.mine) || undefined}
                    data-exploded={cell.exploded || undefined}
                    data-wrong={cell.wrongFlag || undefined}
                    data-game-focus={active || undefined}
                    tabIndex={active ? 0 : -1}
                    aria-label={`Row ${dr + 1}, column ${dc + 1}, ${describeCell(cell)}`}
                    onFocus={() => setCursor(index)}
                    onPointerDown={(e) => onPointerDown(e, index)}
                    onClick={(e) => onClick(e, index)}
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      onContextMenu(e, index);
                    }}
                  >
                    {cell.state === 'flagged' ? (
                      <FlagIcon crossed={cell.wrongFlag} />
                    ) : cell.state === 'revealed' && cell.mine ? (
                      <MineIcon />
                    ) : cell.state === 'revealed' && cell.adjacent > 0 ? (
                      cell.adjacent
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlagIcon({ crossed = false, className = styles.icon }: { crossed?: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 3v18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 4l11 4.5L8 13z" fill="#ff4d6d" />
      <path d="M4.5 21h7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {crossed && <path d="M3 3l18 18M21 3L3 21" stroke="#ffd23f" strokeWidth="2.6" strokeLinecap="round" />}
    </svg>
  );
}

function MineIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7" />
      </g>
      <circle cx="12" cy="12" r="6.3" fill="currentColor" />
      <circle cx="9.8" cy="9.8" r="1.8" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

function RevealIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M9 12.5l2 2 4-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15 15l5 5M10.5 8v5M8 10.5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
