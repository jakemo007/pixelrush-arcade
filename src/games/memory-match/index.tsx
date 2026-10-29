'use client';

import { useEffect, useRef, useState } from 'react';
import type { DomGameProps } from '@/games/dom/types';
import { keyToDirection, moveInGrid, useTimeout } from '@/games/dom/hooks';
import { formatDuration } from '@/lib/format';
import { createRng, randomSeed } from '@/lib/utils/random';
import { boardSizeFor, closeOpen, flip, isComplete, isFaceUp, newGame, symbolName } from './rules';
import { SymbolArt } from './SymbolArt';
import { usePlayClock } from '@/games/dom/use-play-clock';
import styles from './MemoryMatch.module.css';

const MISMATCH_MS = 900;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default function MemoryMatch({ host, variant, paused }: DomGameProps) {
  const [size] = useState(() => boardSizeFor(variant));
  const [game, setGame] = useState(() => newGame(size.pairs, createRng(randomSeed())));
  const [started, setStarted] = useState(false);
  const [cursor, setCursor] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const complete = isComplete(game);
  const { elapsed, read } = usePlayClock(started && !paused && !complete);
  const mismatch = game.open.length === 2;

  useTimeout(() => setGame((g) => closeOpen(g)), MISMATCH_MS, mismatch && !paused);

  const timeText = formatDuration(elapsed);
  useEffect(() => {
    host.setHud([
      { id: 'moves', label: 'Moves', value: String(game.moves) },
      { id: 'time', label: 'Time', value: timeText },
    ]);
  }, [host, game.moves, timeText]);

  const onFlip = (index: number) => {
    if (paused || complete) return;
    const { state, event } = flip(game, index);
    if (event === 'ignored') return;
    setGame(state);
    if (!started) {
      setStarted(true);
      host.setInProgress(true);
    }
    const name = capitalize(symbolName(state, index));
    if (event === 'first') {
      host.playSound('flip');
      host.announce(`${name}.`);
    } else if (event === 'closed') {
      host.playSound('flip');
    } else if (event === 'mismatch') {
      host.playSound('flip');
      host.announce(`${name}. No match.`);
    } else if (event === 'match') {
      if (isComplete(state)) {
        const time = read();
        host.playSound('win');
        host.finish({
          outcome: 'won',
          value: state.moves,
          title: 'All pairs found!',
          detail: `${state.pairs} pairs in ${formatDuration(time)}.`,
        });
      } else {
        host.playSound('match');
        host.announce(`${name}. Match! ${state.pairsFound} of ${state.pairs} pairs found.`);
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const dir = keyToDirection(e.code);
    if (!dir) return;
    e.preventDefault();
    const index = Number((e.target as HTMLElement).dataset.index ?? cursor);
    const next = moveInGrid(Math.floor(index / size.cols), index % size.cols, dir, size.rows, size.cols);
    const nextIndex = next.row * size.cols + next.col;
    setCursor(nextIndex);
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-index="${nextIndex}"]`)?.focus();
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.status}>
        Pairs found: <strong>{game.pairsFound}</strong> of {game.pairs}
      </p>
      <div
        ref={gridRef}
        className={styles.grid}
        role="grid"
        aria-label={`Memory cards, ${size.rows} rows by ${size.cols} columns`}
        aria-rowcount={size.rows}
        aria-colcount={size.cols}
        data-size={variant === '6x6' ? 'large' : 'small'}
        style={{ '--rows': size.rows, '--cols': size.cols } as React.CSSProperties}
        onKeyDown={onKeyDown}
      >
        {Array.from({ length: size.rows }, (_, r) => (
          <div key={r} role="row" className={styles.row} aria-rowindex={r + 1}>
            {Array.from({ length: size.cols }, (_, c) => {
              const index = r * size.cols + c;
              const card = game.cards[index]!;
              const up = isFaceUp(game, index);
              const matched = game.matched[index] === true;
              const wrong = mismatch && game.open.includes(index);
              const label = up ? `${symbolName(game, index)}${matched ? ', matched' : ''}` : 'face down';
              return (
                <button
                  key={c}
                  type="button"
                  role="gridcell"
                  aria-colindex={c + 1}
                  aria-label={`Row ${r + 1}, column ${c + 1}, ${label}`}
                  className={styles.card}
                  data-index={index}
                  data-face={up ? 'up' : 'down'}
                  data-matched={matched || undefined}
                  data-wrong={wrong || undefined}
                  data-game-focus={index === cursor || undefined}
                  tabIndex={index === cursor ? 0 : -1}
                  onFocus={() => setCursor(index)}
                  onClick={() => {
                    setCursor(index);
                    onFlip(index);
                  }}
                >
                  <span className={styles.inner} aria-hidden="true">
                    <span className={styles.back}>
                      <span className={styles.emblem} />
                    </span>
                    <span className={styles.front}>
                      <SymbolArt symbol={card.symbol} className={styles.symbol} />
                    </span>
                  </span>
                  {matched && (
                    <svg className={styles.check} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                      <circle cx="10" cy="10" r="9" fill="#4dffb5" />
                      <path d="M5.5 10.5l3 3 6-7" fill="none" stroke="#04121c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {wrong && (
                    <svg className={styles.check} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                      <circle cx="10" cy="10" r="9" fill="#ff6b8a" />
                      <path d="M6.5 6.5l7 7M13.5 6.5l-7 7" stroke="#1a0008" strokeWidth="2.4" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
