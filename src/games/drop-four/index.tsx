'use client';

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { DomGameProps, DomRunResult } from '@/games/dom/types';
import { createRng, randomSeed } from '@/lib/utils/random';
import { chooseColumn, DIFFICULTIES, type Difficulty } from './ai';
import { Disc, PLAYER_NAME } from './Disc';
import {
  CELLS,
  cellIndex,
  COLS,
  gameStatus,
  initialState,
  legalColumns,
  playColumn,
  ROWS,
  type DropState,
  type GameStatus,
  type Player,
} from './rules';
import styles from './DropFour.module.css';

interface Record3 {
  won: number;
  lost: number;
  drawn: number;
}

const isCount = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1e9;
const isRecord = (v: unknown): v is Record3 =>
  typeof v === 'object' && v !== null && isCount((v as Record3).won) && isCount((v as Record3).lost) && isCount((v as Record3).drawn);

const HUMAN: Player = 1;
const COMPUTER_DELAY = 550;
const FINISH_DELAY = 900;

function isDifficulty(value: string): value is Difficulty {
  return value in DIFFICULTIES;
}

function describeCell(row: number, col: number, value: number): string {
  const what = value === 0 ? 'empty' : `${PLAYER_NAME[value as Player]} disc`;
  return `Row ${row + 1}, column ${col + 1}, ${what}`;
}

export default function DropFour({ host, variant }: DomGameProps) {
  const level: Difficulty | null = variant === 'two-player' ? null : isDifficulty(variant) ? variant : 'medium';
  const vsComputer = level !== null;
  const statsName = `stats-${level ?? 'two-player'}`;

  const [history, setHistory] = useState<DropState[]>(() => [initialState()]);
  const [cursor, setCursor] = useState(3);
  const [dropped, setDropped] = useState<number | null>(null);
  const [result, setResult] = useState<GameStatus | null>(null);
  const [pendingFinish, setPendingFinish] = useState<DomRunResult | null>(null);
  const [record, setRecord] = useState<Record3>(() => host.storage.read(statsName, isRecord) ?? { won: 0, lost: 0, drawn: 0 });
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'warn' | 'good' }>({
    text: vsComputer ? 'You play Red and go first. Choose a column to drop a disc.' : 'Red goes first. Pass the device after each move.',
    tone: 'info',
  });
  const boardRef = useRef<HTMLDivElement>(null);
  const focusPendingRef = useRef(false);
  const startedRef = useRef(false);

  const state = history[history.length - 1]!;
  const over = result !== null;
  const computerTurn = vsComputer && state.turn !== HUMAN && !over;
  const thinking = computerTurn;
  const canAct = !over && !computerTurn;
  const winLine = new Set(result?.kind === 'won' ? result.line : []);
  const { setHud } = host;

  useEffect(() => {
    setHud([
      { id: 'turn', label: 'Turn', value: over ? '–' : PLAYER_NAME[state.turn] },
      { id: 'moves', label: 'Moves', value: String(state.moves) },
    ]);
  }, [setHud, over, state.turn, state.moves]);

  useEffect(() => {
    if (!pendingFinish) return;
    const id = window.setTimeout(() => host.finish(pendingFinish), FINISH_DELAY);
    return () => window.clearTimeout(id);
  }, [pendingFinish, host]);

  const endGame = (status: GameStatus) => {
    if (status.kind === 'playing') return;
    setResult(status);
    let outcome: DomRunResult['outcome'] = 'draw';
    let title = 'Draw';
    let detail = `The board is full after ${CELLS} discs. Nobody connected four.`;
    if (status.kind === 'won') {
      const colour = PLAYER_NAME[status.winner];
      detail = `${colour} connected four.`;
      if (vsComputer) {
        outcome = status.winner === HUMAN ? 'won' : 'lost';
        title = outcome === 'won' ? 'You win!' : 'The computer wins';
      } else {
        outcome = 'won';
        title = `${colour} wins!`;
      }
    }
    if (vsComputer) {
      const key = outcome === 'won' ? 'won' : outcome === 'lost' ? 'lost' : 'drawn';
      const updated = { ...record, [key]: record[key] + 1 };
      setRecord(updated);
      host.storage.write(statsName, updated);
    }
    host.playSound(outcome === 'lost' ? 'gameOver' : outcome === 'won' ? 'win' : 'tick');
    host.announce(`${title} ${detail}`);
    setMessage({ text: `${title} ${detail}`, tone: outcome === 'lost' ? 'warn' : 'good' });
    setPendingFinish({ outcome, title, detail });
  };

  const commit = (col: number, byComputer: boolean) => {
    const next = playColumn(state, col);
    if (!next) return;
    setHistory((list) => [...list, next]);
    setDropped(next.last);
    if (!startedRef.current && !byComputer) {
      startedRef.current = true;
      host.setInProgress(true);
    }
    host.playSound('place');
    const who = PLAYER_NAME[state.turn];
    const text = `${byComputer ? 'Computer: ' : ''}${who} dropped a disc in column ${col + 1}.`;
    const status = gameStatus(next);
    if (status.kind !== 'playing') {
      endGame(status);
      return;
    }
    let follow = '';
    if (vsComputer) follow = byComputer ? ' Your turn.' : ' Computer is thinking…';
    else follow = ` ${PLAYER_NAME[next.turn]} to move.`;
    host.announce(`${text}${follow}`);
    setMessage({ text, tone: 'info' });
  };

  useEffect(() => {
    if (!thinking || level === null) return;
    const id = window.setTimeout(() => {
      const col = chooseColumn(state, { ...DIFFICULTIES[level], rng: createRng(randomSeed()) });
      if (col >= 0) commit(col, true);
    }, COMPUTER_DELAY);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking, state]);

  useEffect(() => {
    if (!focusPendingRef.current) return;
    focusPendingRef.current = false;
    boardRef.current?.querySelector<HTMLElement>(`[data-cell="${cellIndex(0, cursor)}"]`)?.focus({ preventScroll: true });
  });

  const warn = (text: string) => {
    host.playSound('invalid');
    host.announce(text);
    setMessage({ text, tone: 'warn' });
  };

  const onColumn = (col: number) => {
    if (over) return;
    if (computerTurn) {
      warn('Wait for the computer to move.');
      return;
    }
    if (!legalColumns(state).includes(col)) {
      warn(`Column ${col + 1} is full. Choose another column.`);
      return;
    }
    commit(col, false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const digit = /^(?:Digit|Numpad)([1-7])$/.exec(e.code);
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Home' || e.code === 'End') {
      const next = e.code === 'Home' ? 0 : e.code === 'End' ? COLS - 1 : Math.min(COLS - 1, Math.max(0, cursor + (e.code === 'ArrowLeft' ? -1 : 1)));
      setCursor(next);
      focusPendingRef.current = true;
    } else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'ArrowDown') {
      if (!e.repeat) onColumn(cursor);
    } else if (digit) {
      const col = Number(digit[1]) - 1;
      setCursor(col);
      focusPendingRef.current = true;
      if (!e.repeat) onColumn(col);
    } else return;
    e.preventDefault();
  };

  const takeBack = () => {
    if (over) return;
    let keep = history.length - 1;
    if (vsComputer) {
      let n = history.length - 2;
      while (n >= 0 && history[n]!.turn !== HUMAN) n--;
      if (n < 0) return;
      keep = n + 1;
    }
    if (keep < 1) return;
    setHistory(history.slice(0, keep));
    setDropped(null);
    host.playSound('select');
    host.announce('Move taken back.');
    setMessage({ text: 'Move taken back.', tone: 'info' });
  };

  const turnLabel = over
    ? 'Game over'
    : vsComputer
      ? state.turn === HUMAN
        ? 'Your turn (Red)'
        : 'Computer’s turn (Yellow)'
      : `${PLAYER_NAME[state.turn]} to move`;
  const reds = state.board.reduce((n, v) => n + (v === 1 ? 1 : 0), 0);
  const yellows = state.board.reduce((n, v) => n + (v === 2 ? 1 : 0), 0);

  return (
    <div className={styles.game}>
      <div className={styles.boardWrap}>
        <div
          ref={boardRef}
          className={styles.board}
          role="grid"
          aria-label={`Drop Four board, ${COLS} columns by ${ROWS} rows. ${turnLabel}. Use the left and right arrow keys to choose a column and Enter to drop a disc, or press a number from 1 to ${COLS}.`}
          onKeyDown={onKeyDown}
        >
          {Array.from({ length: ROWS }, (_, r) => (
            <div key={r} className={styles.row} role="row">
              {Array.from({ length: COLS }, (_, c) => {
                const index = cellIndex(r, c);
                const value = state.board[index]!;
                const classes = [styles.cell];
                if (c === cursor && canAct) classes.push(styles.colActive);
                if (winLine.has(index)) classes.push(styles.win);
                if (state.last === index && !over) classes.push(styles.lastMove);
                const states: string[] = [];
                if (winLine.has(index)) states.push('part of the winning four');
                if (state.last === index) states.push('last move');
                const label = `${describeCell(r, c, value)}${states.length ? `, ${states.join(', ')}` : ''}`;
                const animate = dropped === index && !host.reducedMotion;
                return (
                  <div
                    key={c}
                    role="gridcell"
                    className={classes.join(' ')}
                    data-cell={index}
                    tabIndex={r === 0 && c === cursor ? 0 : -1}
                    aria-label={label}
                    data-game-focus={r === 0 && c === cursor ? '' : undefined}
                    onClick={() => {
                      setCursor(c);
                      onColumn(c);
                    }}
                  >
                    <span className={styles.hole} aria-hidden="true" />
                    {value !== 0 && (
                      <span
                        className={`${styles.disc}${animate ? ` ${styles.drop}` : ''}`}
                        style={animate ? ({ '--fall': r + 1 } as CSSProperties) : undefined}
                      >
                        <Disc player={value as Player} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.panel}>
        <p className={styles.turn}>
          <span className={styles.turnDisc} aria-hidden="true">
            <Disc player={state.turn} />
          </span>
          {turnLabel}
        </p>
        <p className={styles.status} data-tone={message.tone} aria-hidden="true">
          {thinking ? (
            <span className={styles.thinking}>
              <span className={styles.spinner} /> Computer is thinking…
            </span>
          ) : (
            message.text
          )}
        </p>
        <div className={styles.buttons}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={takeBack} disabled={over || history.length <= 1}>
            {vsComputer ? 'Take back' : 'Undo move'}
          </button>
        </div>
        <p className={styles.tally}>
          <span>
            <Disc player={1} /> {reds} Red
          </span>
          <span>
            <Disc player={2} /> {yellows} Yellow
          </span>
        </p>
        {vsComputer ? (
          <p className={styles.stats}>
            Your record on {level} in this browser: {record.won} won, {record.lost} lost, {record.drawn} drawn.
          </p>
        ) : (
          <p className={styles.stats}>Two players on one device. Red goes first, then Yellow.</p>
        )}
      </div>
    </div>
  );
}
