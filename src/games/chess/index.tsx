'use client';

import { Chess, type Move, type Square } from 'chess.js';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { keyToDirection, moveInGrid } from '@/games/dom/hooks';
import type { DomGameProps, DomRunResult, SoundCue } from '@/games/dom/types';
import { randomSeed } from '@/lib/utils/random';
import { LEVELS, endState, engineSearch, isLevel, validatedMove, type EndState, type EngineReply, type EngineRequest, type Level } from './bridge';
import { ChessPiece, PIECE_NAMES, type PieceColor, type PieceType } from './Pieces';
import { Thinker, type ThinkMode } from './thinker';
import styles from './Chess.module.css';

interface Wld {
  won: number;
  lost: number;
  drawn: number;
}
type StatsMap = Partial<Record<Level, Wld>>;

const SIDE_KEY = 'side';
const STATS_KEY = 'stats';
const MIN_COMPUTER_DELAY = 500;
const FILES = 'abcdefgh';
const VALUES: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const LEVEL_LABEL: Record<Level, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const isCount = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 1e9;
const isWld = (v: unknown): v is Wld => typeof v === 'object' && v !== null && isCount((v as Wld).won) && isCount((v as Wld).lost) && isCount((v as Wld).drawn);
const isStatsMap = (v: unknown): v is StatsMap =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.entries(v).every(([k, x]) => isLevel(k) && isWld(x));
const isSide = (v: unknown): v is { color: PieceColor } =>
  typeof v === 'object' && v !== null && ((v as { color?: unknown }).color === 'w' || (v as { color?: unknown }).color === 'b');

const uciOf = (m: Pick<Move, 'from' | 'to' | 'promotion'>) => `${m.from}${m.to}${m.promotion ?? ''}`;
const colorName = (c: PieceColor) => (c === 'w' ? 'White' : 'Black');

function replay(moves: readonly string[]): Chess {
  const chess = new Chess();
  for (const m of moves) chess.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
  return chess;
}

function describeMove(m: Move): string {
  const who = `${colorName(m.color)} ${PIECE_NAMES[m.piece]}`;
  if (m.isKingsideCastle()) return `${colorName(m.color)} castles kingside (${m.san})`;
  if (m.isQueensideCastle()) return `${colorName(m.color)} castles queenside (${m.san})`;
  let text = `${who} ${m.from} to ${m.to}`;
  if (m.captured) text += `, takes ${PIECE_NAMES[m.captured]}${m.isEnPassant() ? ' en passant' : ''}`;
  if (m.promotion) text += `, promotes to ${PIECE_NAMES[m.promotion]}`;
  return `${text} (${m.san})`;
}

interface Press {
  id: number;
  x: number;
  y: number;
  sq: Square;
  movable: boolean;
  justSelected: boolean;
  dragging: boolean;
}

export default function ChessGame({ host, variant, paused }: DomGameProps) {
  const level: Level = isLevel(variant) ? variant : 'easy';
  const [color] = useState<PieceColor>(() => host.storage.read(SIDE_KEY, isSide)?.color ?? 'w');
  const [nextColor, setNextColor] = useState<PieceColor>(color);
  const [moves, setMoves] = useState<string[]>([]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [cursor, setCursor] = useState({ r: 6, c: 4 });
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'warn' | 'good' }>({
    text: color === 'w' ? 'You play White. Tap or drag a piece to a highlighted square.' : 'You play Black. The computer moves first.',
    tone: 'info',
  });
  const [resigned, setResigned] = useState(false);
  const [pendingFinish, setPendingFinish] = useState<DomRunResult | null>(null);
  const [stats, setStats] = useState<StatsMap>(() => host.storage.read(STATS_KEY, isStatsMap) ?? {});
  const [engineInfo, setEngineInfo] = useState<{ mode: ThinkMode; depth: number } | null>(null);
  const [dragSq, setDragSq] = useState<Square | null>(null);
  const thinkerRef = useRef<Thinker<EngineRequest, EngineReply | null> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<Press | null>(null);
  const focusPendingRef = useRef(false);
  const startedRef = useRef(false);
  const movesListRef = useRef<HTMLOListElement>(null);

  const chess = useMemo(() => replay(moves), [moves]);
  const legal = useMemo(() => chess.moves({ verbose: true }), [chess]);
  const history = useMemo(() => chess.history({ verbose: true }), [chess]);
  const end: EndState = useMemo(() => endState(chess), [chess]);
  const over = end !== null || resigned;
  const turn = chess.turn();
  const computerTurn = turn !== color && !over;
  const thinking = computerTurn && !paused;
  const playerTurn = turn === color && !over && !paused;
  const lastMove = history[history.length - 1];
  const boardRows = chess.board();
  const { setHud } = host;

  let material = 0;
  for (const rowCells of boardRows) for (const p of rowCells) if (p) material += (p.color === color ? 1 : -1) * VALUES[p.type];

  useEffect(() => {
    setHud([
      { id: 'move', label: 'Move', value: String(chess.moveNumber()) },
      { id: 'you', label: 'You', value: colorName(color) },
      { id: 'material', label: 'Material', value: material > 0 ? `+${material}` : String(material) },
    ]);
  }, [setHud, chess, color, material]);

  useEffect(() => {
    const thinker = new Thinker<EngineRequest, EngineReply | null>({
      createWorker: () => new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' }),
      search: engineSearch,
      workerTimeoutMs: (req) => (req.timeMs ?? LEVELS[req.level].timeMs) + 5000,
    });
    thinkerRef.current = thinker;
    return () => {
      thinker.dispose();
      thinkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!pendingFinish) return;
    const id = window.setTimeout(() => host.finish(pendingFinish), 800);
    return () => window.clearTimeout(id);
  }, [pendingFinish, host]);

  const recordResult = (key: keyof Wld) => {
    const current = stats[level] ?? { won: 0, lost: 0, drawn: 0 };
    const updated: StatsMap = { ...stats, [level]: { ...current, [key]: current[key] + 1 } };
    setStats(updated);
    host.storage.write(STATS_KEY, updated);
  };

  const finishGame = (e: Exclude<EndState, null>, after: Chess) => {
    const n = Math.ceil(after.history().length / 2);
    let result: DomRunResult;
    if (e.outcome === 'checkmate') {
      const won = e.winner === color;
      result = { outcome: won ? 'won' : 'lost', title: won ? 'Checkmate! You win' : 'Checkmate: the computer wins', detail: `Checkmate in ${n} moves (${LEVEL_LABEL[level]}).` };
      recordResult(won ? 'won' : 'lost');
      host.playSound(won ? 'win' : 'gameOver');
    } else {
      result = { outcome: 'draw', title: 'Draw', detail: `${e.reason} after ${n} moves.` };
      recordResult('drawn');
      host.playSound('tick');
    }
    setMessage({ text: `${result.title}. ${result.detail}`, tone: result.outcome === 'lost' ? 'warn' : 'good' });
    host.announce(`${result.title}. ${result.detail}`);
    setPendingFinish(result);
  };

  const play = (uci: string, byComputer: boolean) => {
    const next = [...moves, uci];
    const after = replay(next);
    const move = after.history({ verbose: true }).at(-1)!;
    setMoves(next);
    setSelected(null);
    setPromotion(null);
    if (!byComputer && !startedRef.current) {
      startedRef.current = true;
      host.setInProgress(true);
    }
    const e = endState(after);
    const text = `${byComputer ? 'Computer' : 'You'}: ${describeMove(move)}${after.isCheck() && !after.isCheckmate() ? '. Check!' : '.'}`;
    if (e) {
      setMessage({ text, tone: 'info' });
      finishGame(e, after);
      return;
    }
    const sound: SoundCue = move.promotion ? 'powerup' : move.captured ? 'pop' : after.isCheck() ? 'tick' : move.isKingsideCastle() || move.isQueensideCastle() ? 'swish' : 'place';
    host.playSound(sound);
    setMessage({ text, tone: after.isCheck() && byComputer ? 'warn' : 'info' });
    host.announce(`${text}${byComputer ? ' Your move.' : ''}`);
  };

  useEffect(() => {
    const thinker = thinkerRef.current;
    if (!thinking || !thinker) return;
    const requestedAt = performance.now();
    let timer: number | null = null;
    thinker.think({ moves, level, seed: randomSeed() }, (res, mode) => {
      const chosen = (res && validatedMove(chess, res.uci)) ?? chess.moves({ verbose: true })[0] ?? null;
      if (!chosen) return;
      setEngineInfo({ mode, depth: res?.depth ?? 0 });
      timer = window.setTimeout(() => play(uciOf(chosen), true), Math.max(0, MIN_COMPUTER_DELAY - (performance.now() - requestedAt)));
    });
    return () => {
      thinker.cancel();
      if (timer !== null) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking, moves, level, chess]);

  useEffect(() => {
    const list = movesListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [moves.length]);

  useEffect(() => {
    if (!focusPendingRef.current) return;
    focusPendingRef.current = false;
    boardRef.current?.querySelector<HTMLElement>(`[data-cell="${cursor.r * 8 + cursor.c}"]`)?.focus({ preventScroll: true });
  });

  const warn = (text: string) => {
    host.playSound('invalid');
    host.announce(text);
    setMessage({ text, tone: 'warn' });
  };

  const selectSquare = (sq: Square): boolean => {
    const piece = chess.get(sq);
    if (!piece) return false;
    const targets = [...new Set(legal.filter((m) => m.from === sq).map((m) => m.to))];
    if (targets.length === 0) {
      setSelected(null);
      warn(`That ${PIECE_NAMES[piece.type]} has no legal moves${chess.isCheck() ? ': your king is in check' : ''}.`);
      return false;
    }
    setSelected(sq);
    host.playSound('select');
    host.announce(`${colorName(piece.color)} ${PIECE_NAMES[piece.type]} on ${sq} selected. It can move to ${targets.join(', ')}.`);
    return true;
  };

  const onSquare = (sq: Square) => {
    if (over || paused || promotion) return;
    if (!playerTurn) {
      warn('Wait for the computer to move.');
      return;
    }
    const piece = chess.get(sq);
    if (selected) {
      if (sq === selected) {
        setSelected(null);
        host.announce('Selection cancelled.');
        return;
      }
      const options = legal.filter((m) => m.from === selected && m.to === sq);
      if (options.length > 0) {
        if (options.some((m) => m.promotion)) {
          setPromotion({ from: selected, to: sq });
          host.announce('Promotion: choose a queen, rook, bishop or knight.');
          return;
        }
        play(uciOf(options[0]!), false);
        return;
      }
      if (piece && piece.color === color) {
        selectSquare(sq);
        return;
      }
      warn(`That move is not legal.${chess.isCheck() ? ' Your king is in check.' : ''}`);
      return;
    }
    if (piece && piece.color === color) selectSquare(sq);
    else if (piece) warn('That is the computer’s piece. Choose one of yours.');
  };

  const choosePromotion = (type: 'q' | 'r' | 'b' | 'n') => {
    if (!promotion) return;
    play(`${promotion.from}${promotion.to}${type}`, false);
  };

  const takeBack = () => {
    if (over) return;
    let i = moves.length - 1;
    while (i >= 0 && (i % 2 === 0 ? 'w' : 'b') !== color) i--;
    if (i < 0) return;
    const undoneReply = i < moves.length - 1;
    setMoves(moves.slice(0, i));
    setSelected(null);
    setPromotion(null);
    host.playSound('select');
    const text = undoneReply ? 'Took back your last move and the computer’s reply.' : 'Took back your last move.';
    host.announce(text);
    setMessage({ text, tone: 'info' });
  };

  const resign = () => {
    if (over) return;
    setResigned(true);
    recordResult('lost');
    host.playSound('gameOver');
    host.finish({ outcome: 'lost', title: 'You resigned', detail: `After ${Math.ceil(moves.length / 2)} moves (${LEVEL_LABEL[level]}).` });
  };

  const chooseSide = (c: PieceColor) => {
    setNextColor(c);
    host.storage.write(SIDE_KEY, { color: c });
    if (c === color) {
      setMessage({ text: `You keep playing ${colorName(c)}.`, tone: 'info' });
      return;
    }
    const playerMoved = history.some((m) => m.color === color);
    if (!playerMoved) {
      host.newGame();
      return;
    }
    setMessage({ text: `You will play ${colorName(c)} from your next game.`, tone: 'info' });
  };

  const flip = color === 'b';
  const squareAt = (r: number, c: number): Square => {
    const file = flip ? 7 - c : c;
    const rank = flip ? r + 1 : 8 - r;
    return `${FILES[file]}${rank}` as Square;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const dir = keyToDirection(e.code);
    if (dir) {
      const next = moveInGrid(cursor.r, cursor.c, dir, 8, 8);
      setCursor({ r: next.row, c: next.col });
      focusPendingRef.current = true;
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!e.repeat) onSquare(squareAt(cursor.r, cursor.c));
    } else if (e.key === 'Escape') {
      if (promotion) setPromotion(null);
      else if (selected) {
        setSelected(null);
        host.announce('Selection cancelled.');
      } else return;
    } else return;
    e.preventDefault();
  };

  const setDragOffset = (dx: number, dy: number) => {
    boardRef.current?.style.setProperty('--drag-x', `${dx}px`);
    boardRef.current?.style.setProperty('--drag-y', `${dy}px`);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (pressRef.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-square]');
    if (!cell || over || promotion) return;
    const sq = cell.dataset.square as Square;
    const piece = chess.get(sq);
    const movable = Boolean(playerTurn && piece && piece.color === color && legal.some((m) => m.from === sq));
    let justSelected = false;
    if (movable && selected !== sq) justSelected = selectSquare(sq);
    pressRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, sq, movable, justSelected, dragging: false };
    if (movable) {
      try {
        boardRef.current?.setPointerCapture(e.pointerId);
      } catch {
      }
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    if (!press || press.id !== e.pointerId || !press.movable) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    if (!press.dragging) {
      if (Math.hypot(dx, dy) < 6) return;
      press.dragging = true;
      setDragSq(press.sq);
    }
    setDragOffset(dx, dy);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    if (!press || press.id !== e.pointerId) return;
    pressRef.current = null;
    if (press.dragging) {
      setDragOffset(0, 0);
      setDragSq(null);
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-square]');
      const sq = target?.dataset.square as Square | undefined;
      if (sq && sq !== press.sq && boardRef.current?.contains(target!)) {
        const options = legal.filter((m) => m.from === press.sq && m.to === sq);
        if (options.length === 0) warn('That move is not legal.');
        else if (options.some((m) => m.promotion)) {
          setPromotion({ from: press.sq, to: sq });
          host.announce('Promotion: choose a queen, rook, bishop or knight.');
        } else play(uciOf(options[0]!), false);
      }
      return;
    }
    if (press.justSelected) return;
    onSquare(press.sq);
  };

  const onPointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    if (pressRef.current?.id !== e.pointerId) return;
    pressRef.current = null;
    setDragOffset(0, 0);
    setDragSq(null);
  };

  const targets = new Map<string, boolean>();
  if (selected && playerTurn) for (const m of legal) if (m.from === selected) targets.set(m.to, Boolean(m.captured));
  const checkSquare = chess.isCheck()
    ? boardRows.flat().find((p) => p && p.type === 'k' && p.color === turn)?.square
    : undefined;

  const captured: Record<PieceColor, PieceType[]> = { w: [], b: [] };
  for (const m of history) if (m.captured) captured[m.color].push(m.captured);
  for (const c of ['w', 'b'] as const) captured[c].sort((a, b) => VALUES[b] - VALUES[a]);

  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i]!.san, history[i + 1]?.san]);

  const record = stats[level] ?? { won: 0, lost: 0, drawn: 0 };
  const playerMoved = history.some((m) => m.color === color);
  const cursorIndex = cursor.r * 8 + cursor.c;
  const turnLabel = over ? 'Game over' : playerTurn ? `Your move (${colorName(color)})` : `Computer’s move (${colorName(turn)})`;

  return (
    <div className={styles.game}>
      <div className={styles.boardWrap}>
        <div
          ref={boardRef}
          className={styles.board}
          role="grid"
          aria-label={`Chess board, you play ${colorName(color)}. ${turnLabel}.`}
          data-dragging={dragSq ? 'true' : undefined}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {Array.from({ length: 8 }, (_, r) => (
            <div key={r} className={styles.row} role="row">
              {Array.from({ length: 8 }, (_, c) => {
                const sq = squareAt(r, c);
                const fileIdx = sq.charCodeAt(0) - 97;
                const rankNum = Number(sq[1]);
                const isLight = (fileIdx + rankNum) % 2 === 0;
                const piece = chess.get(sq);
                const classes = [styles.cell, isLight ? styles.light : styles.dark];
                const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
                if (isLast) classes.push(styles.last);
                if (sq === selected) classes.push(styles.selected);
                if (sq === checkSquare) classes.push(styles.check);
                if (piece && piece.color === color && playerTurn) classes.push(styles.movable);
                if (sq === dragSq) classes.push(styles.dragging);
                const target = targets.get(sq);
                const states: string[] = [];
                if (sq === selected) states.push('selected');
                if (target !== undefined) states.push(target ? 'capture' : 'legal move');
                if (sq === checkSquare) states.push('in check');
                if (isLast) states.push('last move');
                const label = `${sq}, ${piece ? `${colorName(piece.color)} ${PIECE_NAMES[piece.type]}` : 'empty'}${states.length ? `, ${states.join(', ')}` : ''}`;
                const index = r * 8 + c;
                return (
                  <div
                    key={c}
                    role="gridcell"
                    className={classes.join(' ')}
                    data-square={sq}
                    data-cell={index}
                    tabIndex={index === cursorIndex ? 0 : -1}
                    aria-label={label}
                    aria-selected={sq === selected || undefined}
                    data-game-focus={index === cursorIndex ? '' : undefined}
                  >
                    {piece && (
                      <span className={styles.piece}>
                        <ChessPiece type={piece.type} color={piece.color} />
                      </span>
                    )}
                    {target !== undefined && <span className={target ? styles.ring : styles.dot} aria-hidden="true" />}
                    {r === 7 && (
                      <span className={`${styles.coord} ${styles.file}`} aria-hidden="true">
                        {sq[0]}
                      </span>
                    )}
                    {c === 0 && (
                      <span className={`${styles.coord} ${styles.rank}`} aria-hidden="true">
                        {sq[1]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {promotion && (
          <div
            className={styles.promo}
            role="dialog"
            aria-modal="true"
            aria-label="Choose a piece for promotion"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setPromotion(null);
              }
            }}
          >
            <div className={styles.promoPanel}>
              <p className={styles.promoTitle}>Promote your pawn to</p>
              <div className={styles.promoChoices}>
                {(['q', 'r', 'b', 'n'] as const).map((t, i) => (
                  <button key={t} type="button" className={styles.promoButton} onClick={() => choosePromotion(t)} autoFocus={i === 0}>
                    <ChessPiece type={t} color={color} />
                    {PIECE_NAMES[t][0]!.toUpperCase() + PIECE_NAMES[t].slice(1)}
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPromotion(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.panel}>
        <p className={styles.turn}>
          {turnLabel}
          {chess.isCheck() && !over ? ' · Check!' : ''}
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
          <button type="button" className="btn btn-secondary btn-sm" onClick={takeBack} disabled={over || !playerMoved}>
            Take back
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={resign} disabled={over}>
            Resign
          </button>
          {selected && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
              Cancel
            </button>
          )}
        </div>
        <div className={styles.sidePicker} role="group" aria-label="Play as">
          <span>Play as</span>
          {(['w', 'b'] as const).map((c) => (
            <button key={c} type="button" className={styles.sideButton} aria-pressed={nextColor === c} onClick={() => chooseSide(c)}>
              {colorName(c)}
            </button>
          ))}
        </div>
        {nextColor !== color && <p className={styles.note}>You will play {colorName(nextColor)} from your next game.</p>}
        <div className={styles.captured}>
          {(['w', 'b'] as const).map((c) => {
            const lead = c === color ? material : -material;
            return (
              <div key={c} className={styles.capturedRow} aria-label={`${c === color ? 'You' : 'Computer'} captured: ${captured[c].map((t) => PIECE_NAMES[t]).join(', ') || 'nothing yet'}`}>
                <span>{c === color ? 'You' : 'Computer'}:</span>
                {captured[c].length === 0 && <span>–</span>}
                {captured[c].map((t, i) => (
                  <ChessPiece key={i} type={t} color={c === 'w' ? 'b' : 'w'} />
                ))}
                {lead > 0 && <span className={styles.advantage}>+{lead}</span>}
              </div>
            );
          })}
        </div>
        <ol ref={movesListRef} className={styles.moves} aria-label="Moves played">
          {pairs.length === 0 ? (
            <li className={styles.empty}>No moves yet.</li>
          ) : (
            pairs.map(([w, b], i) => (
              <li key={i}>
                <span className={styles.moveNo}>{i + 1}.</span>
                <span>{w}</span>
                <span>{b ?? ''}</span>
              </li>
            ))
          )}
        </ol>
        <p className={styles.note}>
          Your record on {LEVEL_LABEL[level]} in this browser: {record.won} won, {record.lost} lost, {record.drawn} drawn.
        </p>
        {engineInfo && (
          <p className={styles.note}>
            Last computer move: searched {engineInfo.depth} {engineInfo.depth === 1 ? 'ply' : 'plies'} ahead
            {engineInfo.mode === 'main-thread' ? ' (without a background worker)' : ''}.
          </p>
        )}
      </div>
    </div>
  );
}
