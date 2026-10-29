'use client';

import Link from 'next/link';
import { Component, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { getDomGame, type GameId } from '@/config/games';
import type { DomGameProps, DomRunResult, GameHost, HudItem } from '@/games/dom/types';
import { SoundBoard } from '@/games/engine/audio';
import { formatResult, formatValue } from '@/lib/format';
import { createGameStorage } from '@/lib/storage/game-data';
import { loadBest, recordBest } from '@/lib/storage/high-scores';
import { getBrowserStorage, isPlainObject } from '@/lib/storage/safe-storage';
import { loadSettings, saveSettings } from '@/lib/storage/settings';
import { notifyLocalChange } from '@/lib/storage/use-local-value';
import { loadDomGame } from './game-loaders';
import shellStyles from './GameShell.module.css';
import styles from './DomGameShell.module.css';

type Phase = 'loading' | 'error' | 'playing' | 'over';

interface ResultView extends DomRunResult {
  best: number | null;
  isNewBest: boolean;
  persisted: boolean;
}

type Confirm = { kind: 'new' } | { kind: 'variant'; variant: string };

interface Prefs {
  variant: string;
}

const PREFS_KEY = 'prefs';
const isPrefs = (value: unknown): value is Prefs => isPlainObject(value) && typeof value.variant === 'string';

const HEADLINES = { won: 'You win!', lost: 'Game over', draw: 'Draw' } as const;

const toVariantKey = (hasVariants: boolean, id: string): string | undefined => (hasVariants && id ? id : undefined);

class GameErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(): void {
    this.props.onError();
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

export function DomGameShell({ gameId }: { gameId: GameId }) {
  const game = getDomGame(gameId);
  const variants = game.variants ?? [];
  const hasVariants = variants.length > 0;
  const bestConfig = game.best;
  const hintId = useId();
  const variantGroupId = useId();

  const stageRef = useRef<HTMLDivElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const soundRef = useRef<SoundBoard | null>(null);
  const runRef = useRef(0);
  const variantRef = useRef('');
  const reducedMotionRef = useRef(false);
  const focusRequestRef = useRef(false);
  const actionsRef = useRef<{ finish: (run: DomRunResult) => void; startNew: (variant?: string) => void } | null>(null);

  const storage = useMemo(() => createGameStorage(gameId), [gameId]);

  const [GameComponent, setGameComponent] = useState<ComponentType<DomGameProps> | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [variant, setVariant] = useState('');
  const [runId, setRunId] = useState(0);
  const [hud, setHud] = useState<readonly HudItem[]>([]);
  const [inProgress, setInProgress] = useState(false);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<ResultView | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string) => {
    setAnnouncement((previous) => (previous === message ? `${message} ` : message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const info = getDomGame(gameId);
    const ids = (info.variants ?? []).map((v) => v.id);
    const prefs = storage.read(PREFS_KEY, isPrefs);
    const initialVariant = prefs && ids.includes(prefs.variant) ? prefs.variant : (ids[0] ?? '');
    const settings = loadSettings();
    const sound = new SoundBoard(settings.muted);
    soundRef.current = sound;
    reducedMotionRef.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    loadDomGame(gameId)
      .then((component) => {
        if (cancelled) return;
        variantRef.current = initialVariant;
        setVariant(initialVariant);
        setBest(loadBest(gameId, ids.length > 0 && initialVariant ? initialVariant : undefined));
        setMuted(settings.muted);
        setGameComponent(() => component);
        setPhase('playing');
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });

    return () => {
      cancelled = true;
      sound.destroy();
      soundRef.current = null;
    };
  }, [gameId, storage]);

  const startNew = (nextVariant?: string) => {
    if (nextVariant !== undefined && nextVariant !== variantRef.current) {
      variantRef.current = nextVariant;
      setVariant(nextVariant);
      storage.write(PREFS_KEY, { variant: nextVariant });
      setBest(loadBest(gameId, toVariantKey(hasVariants, nextVariant)));
    }
    runRef.current += 1;
    setRunId(runRef.current);
    setHud([]);
    setInProgress(false);
    setPaused(false);
    setResult(null);
    setResultOpen(false);
    setConfirm(null);
    setPhase('playing');
    focusRequestRef.current = true;
  };

  const finish = (run: DomRunResult) => {
    const key = toVariantKey(hasVariants, variantRef.current);
    let bestAfter: number | null = null;
    let isNewBest = false;
    let persisted = getBrowserStorage() !== null;
    if (bestConfig) {
      const eligible =
        run.value !== undefined && (run.outcome === 'won' || (bestConfig.direction === 'higher' && !bestConfig.requiresWin));
      if (eligible) {
        const saved = recordBest(gameId, run.value!, { direction: bestConfig.direction, variant: key });
        bestAfter = saved.best > 0 ? saved.best : null;
        isNewBest = saved.isNewBest;
        persisted = saved.persisted;
        notifyLocalChange();
      } else {
        bestAfter = loadBest(gameId, key);
      }
    }
    setBest(bestAfter);
    setResult({ ...run, best: bestAfter, isNewBest, persisted });
    setResultOpen(true);
    setPhase('over');
    setInProgress(false);
    setPaused(false);
    setConfirm(null);
    const headline = run.title ?? HEADLINES[run.outcome];
    const value = bestConfig && run.value !== undefined ? ` ${bestConfig.label}: ${formatResult(run.value, bestConfig)}.` : '';
    announce(`${headline}${value}${isNewBest ? ' New personal best!' : ''}`);
  };

  useLayoutEffect(() => {
    actionsRef.current = { finish, startNew };
  });

  const host = useMemo<GameHost>(() => {
    const run = runId;
    const live = () => runRef.current === run;
    return {
      gameId,
      setHud: (items) => {
        if (live()) setHud(items);
      },
      setInProgress: (value) => {
        if (live()) setInProgress(value);
      },
      finish: (r) => {
        if (live()) actionsRef.current?.finish(r);
      },
      announce: (message) => {
        if (live()) announce(message);
      },
      playSound: (cue) => soundRef.current?.play(cue),
      storage,
      get reducedMotion() {
        return reducedMotionRef.current;
      },
      newGame: () => {
        if (live()) actionsRef.current?.startNew();
      },
    };
  }, [announce, gameId, runId, storage]);

  useEffect(() => {
    if (!game.pausable || !inProgress || phase !== 'playing' || paused) return;
    const onVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [game.pausable, inProgress, phase, paused]);

  useEffect(() => {
    if (!focusRequestRef.current || paused || confirm) return;
    focusRequestRef.current = false;
    const stage = stageRef.current;
    const target = stage?.querySelector<HTMLElement>('[data-game-focus]') ?? stage;
    target?.focus({ preventScroll: true });
  });

  useEffect(() => {
    if (resultOpen) primaryActionRef.current?.focus();
  }, [resultOpen]);

  const requestNewGame = () => {
    if (inProgress && phase === 'playing') setConfirm({ kind: 'new' });
    else startNew();
  };

  const requestVariant = (id: string) => {
    if (id === variant) return;
    if (inProgress && phase === 'playing') setConfirm({ kind: 'variant', variant: id });
    else startNew(id);
  };

  const confirmAction = () => {
    if (!confirm) return;
    startNew(confirm.kind === 'variant' ? confirm.variant : undefined);
  };

  const pause = () => {
    setPaused(true);
    announce('Paused.');
  };

  const resume = () => {
    setPaused(false);
    focusRequestRef.current = true;
    announce('Resumed.');
  };

  const keepPlaying = () => {
    setResultOpen(false);
    setPhase('playing');
    setInProgress(true);
    focusRequestRef.current = true;
  };

  const viewBoard = () => {
    setResultOpen(false);
    stageRef.current?.focus({ preventScroll: true });
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundRef.current?.setMuted(next);
    saveSettings({ muted: next });
  };

  const unlockSound = () => soundRef.current?.unlock();

  const variantLabel = variants.find((v) => v.id === variant)?.label;
  const showPause = Boolean(game.pausable) && inProgress && phase === 'playing' && !paused;
  const ratio = game.aspectRatio ?? 1;

  return (
    <section
      className={`${styles.shell} ${shellStyles[game.accent]}`}
      aria-label={`${game.name} game`}
      data-status={phase === 'playing' && paused ? 'paused' : phase}
      data-engine="dom"
      data-variant={variant || undefined}
      style={{ '--ratio': ratio } as React.CSSProperties}
      onPointerDownCapture={unlockSound}
      onKeyDownCapture={unlockSound}
    >
      <div className={shellStyles.hud}>
        <dl className={`${shellStyles.stats} ${styles.stats}`}>
          {bestConfig && (
            <div className={shellStyles.stat}>
              <dt title={variantLabel ? `Personal best, ${variantLabel}` : 'Personal best'}>Best</dt>
              <dd>{best !== null ? formatValue(best, bestConfig.format) : '–'}</dd>
            </div>
          )}
          {hud.map((item) => (
            <div key={item.id} className={shellStyles.stat}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className={shellStyles.hudButtons}>
          {showPause && (
            <button type="button" className={shellStyles.iconButton} onClick={pause} aria-label="Pause game">
              <PauseIcon />
            </button>
          )}
          <button
            type="button"
            className={`${shellStyles.iconButton} ${styles.newGameButton}`}
            onClick={requestNewGame}
            aria-label="New game"
            disabled={phase === 'loading' || phase === 'error'}
          >
            <RestartIcon />
            <span>New game</span>
          </button>
          <button
            type="button"
            className={shellStyles.iconButton}
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'Sound off. Turn sound on' : 'Sound on. Turn sound off'}
            title={muted ? 'Sound off' : 'Sound on'}
          >
            {muted ? <MutedIcon /> : <SoundIcon />}
          </button>
        </div>
      </div>

      {variants.length > 0 && (
        <div className={styles.toolbar}>
          <span id={variantGroupId} className={styles.toolbarLabel}>
            {game.variantLabel ?? 'Mode'}
          </span>
          <div className={styles.variantGroup} role="group" aria-labelledby={variantGroupId}>
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className={styles.variantButton}
                aria-pressed={v.id === variant}
                onClick={() => requestVariant(v.id)}
                disabled={phase === 'loading' || phase === 'error'}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        ref={stageRef}
        className={styles.stage}
        data-loading={phase === 'loading' ? 'true' : undefined}
        tabIndex={-1}
        aria-describedby={hintId}
      >
        {GameComponent && phase !== 'error' && (
          <div className={styles.game} hidden={paused} inert={Boolean(confirm) || resultOpen || undefined}>
            <GameErrorBoundary key={runId} onError={() => setPhase('error')}>
              <GameComponent key={runId} host={host} variant={variant} paused={paused} />
            </GameErrorBoundary>
          </div>
        )}

        {phase === 'loading' && (
          <div className={shellStyles.overlay}>
            <p className={shellStyles.overlayTitle}>Loading {game.name}…</p>
          </div>
        )}

        {phase === 'error' && (
          <div className={shellStyles.overlay} role="alert">
            <p className={shellStyles.overlayTitle}>The game could not start</p>
            <p className={shellStyles.overlayText}>
              Something went wrong while loading or running the game. Reloading the page usually fixes it.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        )}

        {paused && phase === 'playing' && (
          <div className={`${shellStyles.overlay} ${styles.overlaySolid}`}>
            <p className={shellStyles.overlayTitle}>Paused</p>
            <p className={shellStyles.overlayText}>The board is hidden and the timer is stopped.</p>
            <button type="button" className={`btn btn-primary ${shellStyles.bigButton}`} onClick={resume} autoFocus>
              <PlayIcon /> Resume
            </button>
          </div>
        )}

        {confirm && (
          <div
            className={`${shellStyles.overlay} ${styles.overlayTop}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${hintId}-confirm`}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setConfirm(null);
            }}
          >
            <div className={styles.panel}>
              <p id={`${hintId}-confirm`} className={shellStyles.overlayTitle}>
                Start a new game?
              </p>
              <p className={shellStyles.overlayText}>
                {confirm.kind === 'variant'
                  ? `Switching to ${variants.find((v) => v.id === confirm.variant)?.label ?? 'another mode'} ends the current game.`
                  : 'Your current game will be lost.'}
              </p>
              <div className="btn-row">
                <button type="button" className="btn btn-primary" onClick={confirmAction} autoFocus>
                  Start new game
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setConfirm(null)}>
                  Keep playing
                </button>
              </div>
            </div>
          </div>
        )}

        {resultOpen && result && (
          <div
            className={`${shellStyles.overlay} ${shellStyles.overlayResult} ${styles.overlayTop}`}
            role="dialog"
            aria-labelledby={`${hintId}-result`}
            onKeyDown={(e) => {
              if (e.key === 'Escape') (result.continuable ? keepPlaying : viewBoard)();
            }}
          >
            <div className={styles.panel}>
              <p id={`${hintId}-result`} className={shellStyles.overlayTitle}>
                {result.title ?? HEADLINES[result.outcome]}
              </p>
              {bestConfig && result.value !== undefined && (
                <p className={styles.resultValue}>
                  <span className={styles.resultLabel}>{bestConfig.label}</span>
                  <span className={shellStyles.finalScore}>{formatResult(result.value, bestConfig)}</span>
                </p>
              )}
              {result.detail && <p className={shellStyles.overlayText}>{result.detail}</p>}
              {result.isNewBest ? (
                <p className={shellStyles.bestBanner}>New personal best{variantLabel ? ` (${variantLabel})` : ''}!</p>
              ) : (
                bestConfig &&
                result.best !== null && (
                  <p className={shellStyles.overlayText}>
                    Personal best{variantLabel ? ` (${variantLabel})` : ''}: {formatResult(result.best, bestConfig)}
                  </p>
                )
              )}
              <div className="btn-row">
                {result.continuable ? (
                  <button ref={primaryActionRef} type="button" className={`btn btn-primary ${shellStyles.bigButton}`} onClick={keepPlaying}>
                    <PlayIcon /> Keep playing
                  </button>
                ) : (
                  result.canReplay !== false && (
                    <button ref={primaryActionRef} type="button" className={`btn btn-primary ${shellStyles.bigButton}`} onClick={() => startNew()}>
                      <RestartIcon /> Play again
                    </button>
                  )
                )}
                {result.continuable && result.canReplay !== false && (
                  <button type="button" className="btn btn-secondary" onClick={() => startNew()}>
                    New game
                  </button>
                )}
                {!result.continuable && (
                  <button
                    ref={result.canReplay === false ? primaryActionRef : undefined}
                    type="button"
                    className="btn btn-secondary"
                    onClick={viewBoard}
                  >
                    View board
                  </button>
                )}
                <Link href="/games/" className="btn btn-ghost">
                  Other games
                </Link>
              </div>
              {bestConfig && (
                <p className={shellStyles.overlayHint}>
                  {result.persisted
                    ? 'Personal bests are saved only in this browser.'
                    : 'This browser is blocking local storage, so results cannot be saved.'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <p id={hintId} className={shellStyles.hint}>
        <span className={shellStyles.hintKeyboard}>{game.controls.keyboard}.</span>
        <span className={shellStyles.hintTouch}>{game.controls.touch}.</span>
      </p>

      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="6" y="4.5" width="4.5" height="15" rx="1" fill="currentColor" />
      <rect x="13.5" y="4.5" width="4.5" height="15" rx="1" fill="currentColor" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 5a7 7 0 1 1-6.6 4.7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M4 4v6h6z" fill="currentColor" />
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
