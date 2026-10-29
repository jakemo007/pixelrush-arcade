'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { DomGameProps } from '@/games/dom/types';
import { keyToDirection, useSwipe } from '@/games/dom/hooks';
import { formatPoints } from '@/lib/format';
import { createRng, randomSeed } from '@/lib/utils/random';
import { canMove, maxTile, moveTiles, spawnTile, startTiles, tilesToGrid, WIN_VALUE, type Direction, type Tile } from './rules';
import styles from './Game2048.module.css';

interface Board {
  tiles: Tile[];
  removed: Tile[];
  merged: number[];
  fresh: number[];
  nextId: number;
  score: number;
  moves: number;
  top: number;
  reached: boolean;
  over: boolean;
}

const DIR_LABEL: Record<Direction, string> = { up: 'Up', down: 'Down', left: 'Left', right: 'Right' };

function initialBoard(rng: () => number): Board {
  const tiles = startTiles(rng);
  return {
    tiles,
    removed: [],
    merged: [],
    fresh: tiles.map((t) => t.id),
    nextId: tiles.length + 1,
    score: 0,
    moves: 0,
    top: maxTile(tilesToGrid(tiles)),
    reached: false,
    over: false,
  };
}

export default function Game2048({ host, paused }: DomGameProps) {
  const [rng] = useState(() => createRng(randomSeed()));
  const [board, setBoard] = useState<Board>(() => initialBoard(rng));
  const boardRef = useRef<HTMLDivElement>(null);
  const descId = useId();

  useEffect(() => {
    host.setHud([
      { id: 'score', label: 'Score', value: formatPoints(board.score) },
      { id: 'top', label: 'Top tile', value: String(board.top) },
    ]);
  }, [host, board.score, board.top]);

  const slide = (dir: Direction) => {
    if (paused || board.over) return;
    const result = moveTiles(board.tiles, dir, board.nextId);
    if (!result.moved) {
      host.announce(`Nothing can move ${dir}.`);
      return;
    }
    const spawn = spawnTile(result.tiles, rng, result.nextId);
    const tiles = spawn ? [...result.tiles, spawn] : result.tiles;
    const grid = tilesToGrid(tiles);
    const top = maxTile(grid);
    const score = board.score + result.gained;
    const reachedNow = !board.reached && top >= WIN_VALUE;
    const over = !canMove(grid);

    setBoard({
      tiles,
      removed: result.removed,
      merged: result.merged,
      fresh: spawn ? [spawn.id] : [],
      nextId: result.nextId + 1,
      score,
      moves: board.moves + 1,
      top,
      reached: board.reached || reachedNow,
      over: over,
    });

    if (board.moves === 0) host.setInProgress(true);
    const mergeCount = result.merged.length;
    const parts = [DIR_LABEL[dir]];
    if (mergeCount > 0) parts.push(`${mergeCount} ${mergeCount === 1 ? 'merge' : 'merges'}, score ${formatPoints(score)}`);
    if (spawn) parts.push(`new ${spawn.value} at row ${spawn.row + 1}, column ${spawn.col + 1}`);
    host.announce(`${parts.join('. ')}.`);

    if (reachedNow) {
      host.playSound('win');
      host.finish({
        outcome: 'won',
        value: score,
        title: 'You made 2048!',
        detail: over ? 'And that was the last possible move. Well played!' : 'Keep playing to chase a bigger tile and a higher score.',
        continuable: !over,
      });
    } else if (over) {
      host.playSound('gameOver');
      host.finish({ outcome: 'lost', value: score, title: 'No moves left', detail: `Top tile: ${top}` });
    } else if (top > board.top && top >= 128) {
      host.playSound('milestone');
      host.announce(`New top tile: ${top}.`);
    } else {
      host.playSound(mergeCount > 0 ? 'pop' : 'select');
    }
  };

  const swipe = useSwipe((dir) => slide(dir));

  const slideRef = useRef(slide);
  useEffect(() => {
    slideRef.current = slide;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target !== document.body && e.target !== document.documentElement) return;
      const el = boardRef.current;
      const dir = keyToDirection(e.code, true);
      if (!el || !dir || el.closest('[inert]')) return;
      const rect = el.getBoundingClientRect();
      const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (visible < rect.height * 0.6) return;
      e.preventDefault();
      el.focus({ preventScroll: true });
      slideRef.current(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const dir = keyToDirection(e.code, true);
    if (!dir) return;
    e.preventDefault();
    slide(dir);
  };

  const grid = tilesToGrid(board.tiles);
  const description = grid
    .map((row, r) => `Row ${r + 1}: ${row.map((v) => (v === 0 ? 'empty' : String(v))).join(', ')}.`)
    .join(' ');

  const renderTile = (t: Tile, removed: boolean) => {
    const anim = removed ? undefined : board.merged.includes(t.id) ? 'merge' : board.fresh.includes(t.id) ? 'new' : undefined;
    return (
      <div
        key={t.id}
        className={styles.tile}
        data-v={t.value > 8192 ? 'max' : t.value}
        data-len={Math.min(6, String(t.value).length)}
        data-anim={anim}
        data-removed={removed || undefined}
        style={{ '--r': t.row, '--c': t.col } as React.CSSProperties}
      >
        <span className={styles.face}>{t.value}</span>
      </div>
    );
  };

  return (
    <div className={styles.wrap}>
      <div
        ref={boardRef}
        className={styles.board}
        role="application"
        aria-roledescription="game board"
        aria-label="2048 board. Use the arrow keys or swipe to slide the tiles."
        aria-describedby={descId}
        tabIndex={0}
        data-game-focus
        data-over={board.over || undefined}
        onKeyDown={onKeyDown}
        {...swipe}
      >
        <div className={styles.layer} aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} className={styles.cell} style={{ '--r': Math.floor(i / 4), '--c': i % 4 } as React.CSSProperties} />
          ))}
          {board.removed.map((t) => renderTile(t, true))}
          {board.tiles.map((t) => renderTile(t, false))}
        </div>
        <p id={descId} className="visually-hidden">
          {description}
        </p>
      </div>
    </div>
  );
}
