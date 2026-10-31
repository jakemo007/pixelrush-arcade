'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Thinker } from '@/games/chess/thinker';
import { keyToDirection, moveInGrid } from '@/games/dom/hooks';
import type { DomGameProps, DomRunResult, SoundCue } from '@/games/dom/types';
import { randomSeed } from '@/lib/utils/random';
import type { AiResult } from './ai';
import { CHECKERS_MAX_DEPTH, CHECKERS_THINK_MS, checkersSearch, type CheckersAiRequest } from './ai-request';
import { CheckerPiece } from './Piece';
import {
  DRAW_QUIET_PLIES,
  applyMove,
  continuations,
  countPieces,
  destination,
  gameStatus,
  initialState,
  isDarkSquare,
  isKing,
  legalMoves,
  sameMove,
  sideOf,
  squareName,
  type CheckersMove,
  type CheckersState,
  type GameStatus,
  type Side,
} from './rules';
import styles from './Checkers.module.css';

interface Entry {
  state: CheckersState;
  lastMove: CheckersMove | null;
}

interface Record3 {
  won: number;
  lost: number;
  drawn: number;
}

const STATS_KEY = 'stats';
const isCount = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1e9;
const isRecord = (v: unknown): v is Record3 =>
  typeof v === 'object' && v !== null && isCount((v as Record3).won) && isCount((v as Record3).lost) && isCount((v as Record3).drawn);

const SIDE_NAME: Record<Side, string> = { dark: 'Red', light: 'White' };
const MIN_COMPUTER_DELAY = 450;

function describePiece(piece: number): string {
  const side = sideOf(piece);
  if (!side) return 'empty';
  return `${SIDE_NAME[side]} ${isKing(piece) ? 'king' : 'man'}`;
}

function moveText(move: CheckersMove, piece: number): string {
  const who = describePiece(piece);
  const route = [move.from, ...move.path].map(squareName).join(move.captures.length ? ' takes ' : ' to ');
  const caps = move.captures.length;
  return `${who} ${route}${caps > 1 ? `, capturing ${caps} pieces` : caps === 1 ? ', capturing a piece' : ''}${move.crowns ? '. Crowned king!' : '.'}`;
}

export default function Checkers({ host, variant, paused }: DomGameProps) {
  const vsComputer = variant !== 'two-player';
  const human: Side = 'dark';
  const [entries, setEntries] = useState<Entry[]>(() => [{ state: initialState(), lastMove: null }]);
  const [selected, setSelected] = useState<number | null>(null);
  const [partial, setPartial] = useState<number[]>([]);
  const [cursor, setCursor] = useState({ r: 5, c: 0 });
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'warn' | 'good' }>({
    text: vsComputer ? 'You play Red and move first. Tap a piece, then a highlighted square.' : 'Red moves first. Pass the device after each move.',
    tone: 'info',
  });
  const [result, setResult] = useState<GameStatus | null>(null);
  const [record, setRecord] = useState<Record3>(() => host.storage.read(STATS_KEY, isRecord) ?? { won: 0, lost: 0, drawn: 0 });
  const [engineMode, setEngineMode] = useState<string | null>(null);
  const [pendingFinish, setPendingFinish] = useState<DomRunResult | null>(null);
  const thinkerRef = useRef<Thinker<CheckersAiRequest, AiResult | null> | null>(null);
  const focusPendingRef = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const current = entries[entries.length - 1]!;
  const state = current.state;
  const over = result !== null;
  const moves = useMemo(() => legalMoves(state), [state]);
  const computerTurn = vsComputer && state.turn !== human && !over;
  const thinking = computerTurn && !paused;
  const canAct = !over && !paused && !computerTurn;
  const mustCapture = moves.length > 0 && moves[0]!.captures.length > 0;
  const { setHud } = host;

  const dark = countPieces(state, 'dark');
  const light = countPieces(state, 'light');
  useEffect(() => {
    setHud([
      { id: 'turn', label: 'Turn', value: over ? '–' : SIDE_NAME[state.turn] },
      { id: 'red', label: 'Red', value: String(dark.men + dark.kings) },
      { id: 'white', label: 'White', value: String(light.men + light.kings) },
    ]);
  }, [setHud, over, state.turn, dark.men, dark.kings, light.men, light.kings]);

  useEffect(() => {
    const thinker = new Thinker<CheckersAiRequest, AiResult | null>({
      createWorker: () => new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' }),
      search: checkersSearch,
      workerTimeoutMs: (req) => req.timeMs + 4000,
    });
    thinkerRef.current = thinker;
    return () => {
      thinker.dispose();
      thinkerRef.current = null;
    };
  }, []);

  const endGame = (status: GameStatus, next: CheckersState) => {
    if (status.kind === 'playing') return;
    setResult(status);
    let outcome: 'won' | 'lost' | 'draw' = 'draw';
    let title = 'Draw';
    let detail = `No capture and no man moved for ${DRAW_QUIET_PLIES / 2} moves each.`;
    if (status.kind === 'won') {
      const loser = status.winner === 'dark' ? 'light' : 'dark';
      detail = status.reason === 'no-pieces' ? `${SIDE_NAME[loser]} has no pieces left.` : `${SIDE_NAME[loser]} has no legal move.`;
      if (vsComputer) {
        outcome = status.winner === human ? 'won' : 'lost';
        title = outcome === 'won' ? 'You win!' : 'The computer wins';
      } else {
        outcome = 'won';
        title = `${SIDE_NAME[status.winner]} wins!`;
      }
    }
    detail += ` ${Math.ceil(next.plies / 2)} moves played.`;
    if (vsComputer) {
      const key = outcome === 'won' ? 'won' : outcome === 'lost' ? 'lost' : 'drawn';
      const updated = { ...record, [key]: record[key] + 1 };
      setRecord(updated);
      host.storage.write(STATS_KEY, updated);
    }
    host.playSound(outcome === 'lost' ? 'gameOver' : outcome === 'won' ? 'win' : 'tick');
    setMessage({ text: `${title} ${detail}`, tone: outcome === 'lost' ? 'warn' : 'good' });
    setPendingFinish({ outcome, title, detail });
  };

  useEffect(() => {
    if (!pendingFinish) return;
    const id = window.setTimeout(() => host.finish(pendingFinish), 700);
    return () => window.clearTimeout(id);
  }, [pendingFinish, host]);

  const commit = (move: CheckersMove, byComputer: boolean) => {
    const piece = state.board[move.from]!;
    const next = applyMove(state, move);
    setEntries((list) => [...list, { state: next, lastMove: move }]);
    setSelected(null);
    setPartial([]);
    if (!startedRef.current && !byComputer) {
      startedRef.current = true;
      host.setInProgress(true);
    }
    const text = moveText(move, piece);
    const status = gameStatus(next);
    const sound: SoundCue = move.crowns ? 'powerup' : move.captures.length > 0 ? 'pop' : 'place';
    host.playSound(sound);
    if (status.kind !== 'playing') {
      host.announce(text);
      endGame(status, next);
      return;
    }
    const nextMoves = legalMoves(next);
    const forced = nextMoves[0]!.captures.length > 0;
    let follow = '';
    if (vsComputer) follow = next.turn === human ? (forced ? ' Your turn: you must capture.' : ' Your turn.') : ' Computer is thinking…';
    else follow = ` ${SIDE_NAME[next.turn]} to move${forced ? ' and must capture' : ''}.`;
    host.announce(`${byComputer ? 'Computer: ' : ''}${text}${follow}`);
    setMessage({ text: `${byComputer ? 'Computer: ' : ''}${text}`, tone: 'info' });
  };

  useEffect(() => {
    const thinker = thinkerRef.current;
    if (!thinking || !thinker) return;
    const requestedAt = performance.now();
    let delay: number | null = null;
    thinker.think({ state, timeMs: CHECKERS_THINK_MS, maxDepth: CHECKERS_MAX_DEPTH, seed: randomSeed() }, (res, mode) => {
      setEngineMode(mode);
      const legal = legalMoves(state);
      const chosen = (res && legal.find((m) => sameMove(m, res.move))) ?? legal[0];
      if (!chosen) return;
      const wait = Math.max(0, MIN_COMPUTER_DELAY - (performance.now() - requestedAt));
      delay = window.setTimeout(() => commit(chosen, true), wait);
    });
    return () => {
      thinker.cancel();
      if (delay !== null) window.clearTimeout(delay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking, state]);

  useEffect(() => {
    if (!focusPendingRef.current) return;
    focusPendingRef.current = false;
    boardRef.current?.querySelector<HTMLElement>(`[data-sq="${cursor.r * 8 + cursor.c}"]`)?.focus({ preventScroll: true });
  });

  const warn = (text: string) => {
    host.playSound('invalid');
    host.announce(text);
    setMessage({ text, tone: 'warn' });
  };

  const onSquare = (sq: number) => {
    if (over || paused) return;
    if (computerTurn) {
      warn('Wait for the computer to move.');
      return;
    }
    const piece = state.board[sq]!;
    if (selected !== null) {
      const cands = continuations(moves, selected, partial);
      if (cands.some((m) => m.path[partial.length] === sq)) {
        const nextPartial = [...partial, sq];
        const complete = cands.find((m) => m.path.length === nextPartial.length && m.path[partial.length] === sq);
        if (complete) {
          commit(complete, false);
          return;
        }
        setPartial(nextPartial);
        host.playSound('pop');
        const text = `Jumped to ${squareName(sq)}. Keep jumping: choose the next landing square.`;
        host.announce(text);
        setMessage({ text, tone: 'info' });
        return;
      }
      if (partial.length > 0) {
        warn('Finish the jump: choose one of the marked landing squares, or press Escape to start this move again.');
        return;
      }
      if (sq === selected) {
        setSelected(null);
        host.announce('Selection cancelled.');
        return;
      }
    }
    if (sideOf(piece) === state.turn) {
      if (moves.some((m) => m.from === sq)) {
        setSelected(sq);
        setPartial([]);
        host.playSound('select');
        const targets = continuations(moves, sq, []).map((m) => squareName(m.path[0]!));
        host.announce(`${describePiece(piece)} on ${squareName(sq)} selected. Moves to ${[...new Set(targets)].join(', ')}.`);
        return;
      }
      warn(mustCapture ? 'A capture is available, so you must jump. Pieces that can capture are marked.' : 'That piece has no legal move.');
      return;
    }
    if (selected !== null) warn('That is not a legal move for the selected piece.');
    else if (piece !== 0) warn(`That is a ${SIDE_NAME[sideOf(piece)!]} piece. ${SIDE_NAME[state.turn]} is to move.`);
  };

  const cancelSelection = () => {
    if (selected === null) return false;
    setSelected(null);
    setPartial([]);
    host.announce(partial.length > 0 ? 'Jump cancelled. The piece is back on its square.' : 'Selection cancelled.');
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const dir = keyToDirection(e.code);
    if (dir) {
      const next = moveInGrid(cursor.r, cursor.c, dir, 8, 8);
      setCursor({ r: next.row, c: next.col });
      focusPendingRef.current = true;
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!e.repeat) onSquare(cursor.r * 8 + cursor.c);
    } else if (e.key === 'Escape') {
      if (!cancelSelection()) return;
    } else return;
    e.preventDefault();
  };

  const takeBack = () => {
    if (over || entries.length <= 1) return;
    let keep = entries.length - 1;
    if (vsComputer) {
      let n = entries.length - 1;
      do n--;
      while (n > 0 && entries[n]!.state.turn !== human);
      if (entries[n]!.state.turn !== human) return;
      keep = n + 1;
    }
    setEntries(entries.slice(0, keep));
    setSelected(null);
    setPartial([]);
    host.playSound('select');
    host.announce('Move taken back.');
    setMessage({ text: 'Move taken back.', tone: 'info' });
  };

  const resign = () => {
    if (over || !vsComputer || !startedRef.current) return;
    const status: GameStatus = { kind: 'won', winner: 'light', reason: 'no-moves' };
    setResult(status);
    const updated = { ...record, lost: record.lost + 1 };
    setRecord(updated);
    host.storage.write(STATS_KEY, updated);
    host.playSound('gameOver');
    host.finish({ outcome: 'lost', title: 'You resigned', detail: `After ${Math.ceil(state.plies / 2)} moves.` });
  };

  const display = state.board.slice();
  const ghosts = new Set<number>();
  if (selected !== null && partial.length > 0) {
    const piece = display[selected]!;
    display[selected] = 0;
    display[partial[partial.length - 1]!] = piece;
    const path = continuations(moves, selected, partial)[0];
    path?.captures.slice(0, partial.length).forEach((c) => ghosts.add(c));
  }
  const targets = new Map<number, boolean>();
  if (selected !== null && canAct) {
    for (const m of continuations(moves, selected, partial)) targets.set(m.path[partial.length]!, m.captures.length > 0);
  }
  const jumpers = new Set<number>();
  if (canAct && mustCapture && selected === null) for (const m of moves) jumpers.add(m.from);
  const last = new Set<number>();
  if (current.lastMove) {
    last.add(current.lastMove.from);
    last.add(destination(current.lastMove));
  }
  const pieceOnSquare = selected !== null && partial.length > 0 ? partial[partial.length - 1]! : selected;

  const cursorSq = cursor.r * 8 + cursor.c;
  const turnLabel = over
    ? 'Game over'
    : vsComputer
      ? state.turn === human
        ? 'Your turn (Red)'
        : 'Computer’s turn (White)'
      : `${SIDE_NAME[state.turn]} to move`;

  return (
    <div className={styles.game}>
      <div className={styles.boardWrap}>
        <div
          ref={boardRef}
          className={styles.board}
          role="grid"
          aria-label={`Checkers board. ${turnLabel}.`}
          onKeyDown={onKeyDown}
        >
          {Array.from({ length: 8 }, (_, r) => (
            <div key={r} className={styles.row} role="row">
              {Array.from({ length: 8 }, (_, c) => {
                const sq = r * 8 + c;
                const darkSq = isDarkSquare(sq);
                const piece = display[sq]!;
                const classes = [styles.cell, darkSq ? styles.dark : styles.light];
                if (last.has(sq)) classes.push(styles.last);
                if (sq === pieceOnSquare) classes.push(styles.selected);
                if (jumpers.has(sq)) classes.push(styles.mustJump);
                if (ghosts.has(sq)) classes.push(styles.ghost);
                const target = targets.get(sq);
                const states: string[] = [];
                if (sq === pieceOnSquare) states.push('selected');
                if (target !== undefined) states.push(target ? 'capture landing square' : 'legal move');
                if (jumpers.has(sq)) states.push('can capture');
                if (ghosts.has(sq)) states.push('being captured');
                if (last.has(sq)) states.push('last move');
                const label = darkSq ? `${squareName(sq)}, ${describePiece(ghosts.has(sq) ? state.board[sq]! : piece)}${states.length ? `, ${states.join(', ')}` : ''}` : `${squareName(sq)}, light square`;
                return (
                  <div
                    key={c}
                    role="gridcell"
                    className={classes.join(' ')}
                    data-sq={sq}
                    tabIndex={sq === cursorSq ? 0 : -1}
                    aria-label={label}
                    aria-selected={sq === pieceOnSquare || undefined}
                    data-game-focus={sq === cursorSq ? '' : undefined}
                    onClick={() => {
                      setCursor({ r, c });
                      onSquare(sq);
                    }}
                  >
                    {(piece !== 0 || ghosts.has(sq)) && (
                      <span className={styles.piece}>
                        <CheckerPiece side={(ghosts.has(sq) ? state.board[sq]! : piece) > 0 ? 'dark' : 'light'} king={isKing(ghosts.has(sq) ? state.board[sq]! : piece)} />
                      </span>
                    )}
                    {target !== undefined && <span className={target ? styles.ring : styles.dot} aria-hidden="true" />}
                    {r === 7 && (
                      <span className={`${styles.coord} ${styles.file}`} aria-hidden="true">
                        {'abcdefgh'[c]}
                      </span>
                    )}
                    {c === 0 && (
                      <span className={`${styles.coord} ${styles.rank}`} aria-hidden="true">
                        {8 - r}
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
          <span className={styles.turnPiece} aria-hidden="true">
            <CheckerPiece side={state.turn} king={false} />
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={takeBack} disabled={over || entries.length <= 1}>
            {vsComputer ? 'Take back' : 'Undo move'}
          </button>
          {selected !== null && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={cancelSelection}>
              Cancel
            </button>
          )}
          {vsComputer && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={resign} disabled={over || entries.length <= 1}>
              Resign
            </button>
          )}
        </div>
        <p className={styles.tally}>
          <span>
            <CheckerPiece side="dark" king={false} /> {dark.men} men, {dark.kings} kings
          </span>
          <span>
            <CheckerPiece side="light" king={false} /> {light.men} men, {light.kings} kings
          </span>
        </p>
        {vsComputer ? (
          <p className={styles.stats}>
            Your record vs the computer in this browser: {record.won} won, {record.lost} lost, {record.drawn} drawn.
            {engineMode === 'main-thread' ? ' (Computer running without a background worker.)' : ''}
          </p>
        ) : (
          <p className={styles.stats}>Two players on one device. Red plays from the bottom, White from the top.</p>
        )}
        <p className={styles.stats}>
          {state.quietPlies >= 20 ? `Draw counter: ${state.quietPlies} of ${DRAW_QUIET_PLIES} turns without a capture or man move.` : ''}
        </p>
      </div>
    </div>
  );
}

