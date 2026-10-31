'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DomGameProps } from '@/games/dom/types';
import { useStopwatch, useTimeout } from '@/games/dom/hooks';
import { formatDuration } from '@/lib/format';
import { randomSeed } from '@/lib/utils/random';
import { availablePairs, buildGeometry, generateDeal, isFree, remainingCount, shuffleRemaining, suggestPair, type Tiles } from './board';
import { getLayout } from './layouts';
import { TileFace } from './TileFace';
import { tileName, tilesMatch, type TileKind } from './tiles';
import styles from './Mahjong.module.css';

export const SHUFFLE_PENALTY_MS = 30_000;

const DEPTH = 0.32;
const ROW = 1.3;

interface Removed {
  a: number;
  b: number;
  ka: TileKind;
  kb: TileKind;
}

export default function MahjongSolitaire({ host, variant, paused }: DomGameProps) {
  const [layout] = useState(() => getLayout(variant));
  const [geometry] = useState(() => buildGeometry(layout.positions));
  const [tiles, setTiles] = useState<Tiles>(() => generateDeal(layout, randomSeed(), geometry).tiles);
  const [selected, setSelected] = useState<number | null>(null);
  const [history, setHistory] = useState<Removed[]>([]);
  const [hintPair, setHintPair] = useState<[number, number] | null>(null);
  const [hints, setHints] = useState(0);
  const [shuffles, setShuffles] = useState(0);
  const [blockedFlash, setBlockedFlash] = useState<{ i: number; id: number } | null>(null);
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState(false);
  const elapsed = useStopwatch(started && !paused && !over);
  const elapsedRef = useRef(0);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const flashCounter = useRef(0);

  useEffect(() => {
    elapsedRef.current = elapsed;
  });

  const penalty = shuffles * SHUFFLE_PENALTY_MS;
  const left = remainingCount(tiles);
  const pairs = useMemo(() => availablePairs(geometry, tiles), [geometry, tiles]);
  const free = useMemo(() => tiles.map((_, i) => isFree(geometry, tiles, i)), [geometry, tiles]);
  const stuck = left > 0 && pairs.length === 0;
  const seconds = Math.floor((elapsed + penalty) / 1000);

  const frame = useMemo(() => {
    const ps = layout.positions;
    const minX = Math.min(...ps.map((p) => p.x));
    const maxX = Math.max(...ps.map((p) => p.x)) + 2;
    const minY = Math.min(...ps.map((p) => p.y));
    const maxY = Math.max(...ps.map((p) => p.y)) + 2;
    const maxZ = Math.max(...ps.map((p) => p.z));
    const width = maxX - minX + (maxZ + 1) * DEPTH;
    const height = (maxY - minY) * ROW + (maxZ + 1) * DEPTH;
    return { minX, minY, maxZ, width, height };
  }, [layout]);

  const domOrder = useMemo(
    () =>
      layout.positions
        .map((p, i) => ({ p, i }))
        .sort((a, b) => a.p.y - b.p.y || a.p.x - b.p.x || b.p.z - a.p.z)
        .map((e) => e.i),
    [layout],
  );

  useEffect(() => {
    host.setHud([
      { id: 'time', label: 'Time', value: formatDuration(seconds * 1000) },
      { id: 'tiles', label: 'Tiles', value: String(left) },
      { id: 'pairs', label: 'Pairs', value: String(pairs.length) },
    ]);
  }, [host, seconds, left, pairs.length]);

  useTimeout(() => setBlockedFlash(null), 450, blockedFlash !== null);
  useTimeout(() => setHintPair(null), 4000, hintPair !== null);
  useTimeout(
    () => {
      const parts = [`${layout.name} cleared`];
      parts.push(hints === 0 ? 'with no hints' : `with ${hints} ${hints === 1 ? 'hint' : 'hints'}`);
      if (shuffles > 0) parts.push(`and ${shuffles} ${shuffles === 1 ? 'shuffle' : 'shuffles'} (+${formatDuration(penalty)} added)`);
      host.finish({ outcome: 'won', value: Math.max(1, Math.round(elapsedRef.current + penalty)), title: 'Board cleared!', detail: `${parts.join(' ')}.` });
    },
    host.reducedMotion ? 150 : 700,
    over,
  );

  const begin = () => {
    if (!started) {
      setStarted(true);
      host.setInProgress(true);
    }
  };

  const describe = (i: number) => tileName(tiles[i]!);

  const afterRemoval = (next: Tiles) => {
    const remaining = remainingCount(next);
    if (remaining === 0) {
      setOver(true);
      host.setInProgress(false);
      host.playSound('win');
      host.announce('Board cleared!');
      return;
    }
    const nextPairs = availablePairs(geometry, next).length;
    if (nextPairs === 0) {
      host.playSound('invalid');
      host.announce(`No matching pairs are free. ${remaining} tiles left. Shuffle or undo to continue.`);
    } else {
      host.announce(`${remaining} tiles left, ${nextPairs} ${nextPairs === 1 ? 'pair' : 'pairs'} available.`);
    }
  };

  const clickTile = (i: number) => {
    if (over || paused || !tiles[i]) return;
    if (!free[i]) {
      flashCounter.current += 1;
      setBlockedFlash({ i, id: flashCounter.current });
      host.playSound('invalid');
      host.announce(`${describe(i)} is blocked.`);
      return;
    }
    begin();
    setHintPair(null);
    if (selected === null) {
      setSelected(i);
      host.playSound('select');
      host.announce(`${describe(i)} selected.`);
      return;
    }
    if (selected === i) {
      setSelected(null);
      host.announce('Selection cleared.');
      return;
    }
    const a = selected;
    if (!tilesMatch(tiles[a]!, tiles[i]!)) {
      setSelected(i);
      host.playSound('select');
      host.announce(`${describe(i)} selected. It does not match ${describe(a)}.`);
      return;
    }
    const next = [...tiles];
    next[a] = null;
    next[i] = null;
    setHistory((h) => [...h, { a, b: i, ka: tiles[a]!, kb: tiles[i]! }]);
    setTiles(next);
    setSelected(null);
    host.playSound('match');
    host.announce(`Matched ${describe(a)} and ${describe(i)}.`);
    afterRemoval(next);
  };

  const undo = () => {
    if (over || paused || history.length === 0) return;
    const last = history[history.length - 1]!;
    const next = [...tiles];
    next[last.a] = last.ka;
    next[last.b] = last.kb;
    setTiles(next);
    setHistory((h) => h.slice(0, -1));
    setSelected(null);
    setHintPair(null);
    host.playSound('flip');
    host.announce(`Put back ${tileName(last.ka)} and ${tileName(last.kb)}.`);
  };

  const hint = () => {
    if (over || paused) return;
    const pair = suggestPair(geometry, tiles);
    if (!pair) {
      host.announce('No pairs are available. Try Shuffle or Undo.');
      host.playSound('invalid');
      return;
    }
    begin();
    setHints((n) => n + 1);
    setHintPair(pair);
    setSelected(null);
    host.playSound('select');
    host.announce(`Hint: ${describe(pair[0])} and ${describe(pair[1])}.`);
    tileRefs.current[pair[0]]?.focus({ preventScroll: true });
  };

  const shuffle = () => {
    if (over || paused || left === 0) return;
    begin();
    const res = shuffleRemaining(geometry, tiles, randomSeed());
    setTiles(res.tiles);
    setHistory([]);
    setSelected(null);
    setHintPair(null);
    setShuffles((n) => n + 1);
    host.playSound('flip');
    const moves = availablePairs(geometry, res.tiles).length;
    host.announce(
      `Tiles shuffled${res.moved ? ' and moved to the bottom layer' : ''}. ${formatDuration(SHUFFLE_PENALTY_MS)} added to your time. ${moves} ${moves === 1 ? 'pair' : 'pairs'} available.`,
    );
  };

  const onTileKeyDown = (e: React.KeyboardEvent, i: number) => {
    const dirs: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const d = dirs[e.key];
    if (!d) return;
    e.preventDefault();
    const from = layout.positions[i]!;
    let best = -1;
    let bestScore = Infinity;
    tiles.forEach((t, j) => {
      if (!t || !free[j] || j === i) return;
      const p = layout.positions[j]!;
      const dx = p.x - from.x;
      const dy = (p.y - from.y) * ROW;
      const along = dx * d[0] + dy * d[1];
      if (along <= 0) return;
      const across = Math.abs(dx * d[1]) + Math.abs(dy * d[0]);
      const score = along + across * 2;
      if (score < bestScore) {
        bestScore = score;
        best = j;
      }
    });
    if (best >= 0) tileRefs.current[best]?.focus();
  };

  const selectedKind = selected !== null ? tiles[selected] : null;
  const firstFree = domOrder.find((i) => tiles[i] && free[i]);

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={hint} disabled={over || left === 0}>
          Hint
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={undo} disabled={over || history.length === 0}>
          Undo
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={shuffle} disabled={over || left === 0}>
          Shuffle (+{formatDuration(SHUFFLE_PENALTY_MS)})
        </button>
        <p className={styles.status}>
          {left === 0 ? 'Cleared!' : `${pairs.length} ${pairs.length === 1 ? 'pair' : 'pairs'} free`}
          {hints > 0 || shuffles > 0 ? ` · ${hints} ${hints === 1 ? 'hint' : 'hints'}, ${shuffles} ${shuffles === 1 ? 'shuffle' : 'shuffles'}` : ''}
        </p>
      </div>

      {stuck && !over && (
        <div className={styles.stuck} role="alert">
          <p>No matching pairs are free. Shuffle the remaining {left} tiles (adds {formatDuration(SHUFFLE_PENALTY_MS)}) or undo your last move.</p>
          <div className="btn-row">
            <button type="button" className="btn btn-primary btn-sm" onClick={shuffle}>
              Shuffle tiles
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={undo} disabled={history.length === 0}>
              Undo
            </button>
          </div>
        </div>
      )}

      <div className={styles.boardWrap} style={{ '--ar': frame.width / frame.height } as React.CSSProperties}>
        <div
          className={styles.board}
          role="group"
          aria-label={`${layout.name} layout, ${left} tiles left. Free tiles are buttons; arrow keys move between them.`}
          style={{ '--depth': `calc(100cqi * ${DEPTH / frame.width})` } as React.CSSProperties}
          data-over={over || undefined}
        >
          {domOrder.map((i) => {
            const kind = tiles[i];
            if (!kind) return null;
            const p = layout.positions[i]!;
            const lift = frame.maxZ - p.z;
            const isFreeTile = free[i]!;
            const isSelected = selected === i;
            const isHint = hintPair !== null && (hintPair[0] === i || hintPair[1] === i);
            const isCandidate = selectedKind !== null && !isSelected && isFreeTile && tilesMatch(selectedKind!, kind);
            const style = {
              left: `${((p.x - frame.minX + lift * DEPTH) / frame.width) * 100}%`,
              top: `${(((p.y - frame.minY) * ROW + lift * DEPTH) / frame.height) * 100}%`,
              width: `${(2 / frame.width) * 100}%`,
              height: `${((2 * ROW) / frame.height) * 100}%`,
              zIndex: p.z * 1000 + p.y * 20 + p.x + 10,
            } as React.CSSProperties;
            return (
              <button
                key={i}
                ref={(el) => {
                  tileRefs.current[i] = el;
                }}
                type="button"
                className={styles.tile}
                style={style}
                data-layer={p.z}
                data-free={isFreeTile || undefined}
                data-selected={isSelected || undefined}
                data-hint={isHint || undefined}
                data-candidate={isCandidate || undefined}
                data-blocked-flash={blockedFlash?.i === i || undefined}
                data-game-focus={i === firstFree ? true : undefined}
                tabIndex={isFreeTile ? 0 : -1}
                aria-disabled={!isFreeTile || undefined}
                aria-pressed={isFreeTile ? isSelected : undefined}
                aria-label={`${tileName(kind)}, layer ${p.z + 1}, ${isFreeTile ? 'free' : 'blocked'}${isHint ? ', hint' : ''}${isCandidate ? ', matches the selected tile' : ''}`}
                onClick={() => clickTile(i)}
                onKeyDown={(e) => onTileKeyDown(e, i)}
              >
                <TileFace kind={kind} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
