'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { getCanvasGame, getGame, gamePath, POINTS_BEST, type GameId } from '@/config/games';
import { mountGame, RESTART_LOCK_MS, type GameController, type HudState, type RunResult } from '@/games/engine/controller';
import type { GameStatus } from '@/games/engine/status';
import { getDailyChallenge, isGoalMet, type DailyChallenge } from '@/lib/daily/challenge';
import { getDailyEntry, updateDailyEntry } from '@/lib/storage/daily-progress';
import { formatResult, formatValue } from '@/lib/format';
import { getBrowserStorage } from '@/lib/storage/safe-storage';
import { loadBest, recordBest } from '@/lib/storage/high-scores';
import { loadSettings, saveSettings } from '@/lib/storage/settings';
import { notifyLocalChange } from '@/lib/storage/use-local-value';
import { randomSeed } from '@/lib/utils/random';
import { loadGameDefinition } from './game-loaders';
import styles from './GameShell.module.css';

type Phase = 'loading' | 'error' | GameStatus;

interface ResultView {
  score: number;
  best: number;
  isNewBest: boolean;
  persisted: boolean;
  won: boolean;
  challengeMet: boolean | null;
}

export function GameShell({ gameId }: { gameId: GameId }) {
  const game = getCanvasGame(gameId);
  const bestConfig = game.best ?? POINTS_BEST;
  const hintId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<GameController | null>(null);
  const overAtRef = useRef(0);

  const [phase, setPhase] = useState<Phase>('loading');
  const [hud, setHud] = useState<HudState | null>(null);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [result, setResult] = useState<ResultView | null>(null);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [otherChallenge, setOtherChallenge] = useState<DailyChallenge | null>(null);
  const [goalMet, setGoalMet] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    let cancelled = false;
    let controller: GameController | null = null;
    let previousStatus: GameStatus = 'ready';
    let goalMetThisRun = false;
    let active: DailyChallenge | null = null;

    const announce = (message: string) => setAnnouncement(message);

    const onHud = (next: HudState) => {
      setHud(next);
      if (active && !goalMetThisRun && isGoalMet(active.goal, next.stats)) {
        goalMetThisRun = true;
        setGoalMet(true);
        updateDailyEntry(active.dateKey, { score: next.score, completed: true });
        notifyLocalChange();
        announce('Daily challenge complete! Keep going for a higher score.');
      }
    };

    const onGameOver = (run: RunResult) => {
      overAtRef.current = performance.now();
      let view: ResultView;
      if (active) {
        const before = getDailyEntry(active.dateKey)?.best ?? 0;
        const met = goalMetThisRun || isGoalMet(active.goal, run.stats);
        const entry = updateDailyEntry(active.dateKey, { score: run.score, completed: met });
        view = {
          score: run.score,
          best: entry.best,
          isNewBest: run.score > before && run.score > 0,
          persisted: true,
          won: run.outcome === 'won',
          challengeMet: met,
        };
      } else {
        const config = getCanvasGame(gameId).best;
        const eligible = config !== null && (run.outcome === 'won' || (config.direction === 'higher' && !config.requiresWin));
        const saved = eligible
          ? recordBest(gameId, run.score, { direction: config.direction })
          : { best: loadBest(gameId) ?? 0, isNewBest: false, persisted: getBrowserStorage() !== null };
        view = {
          score: run.score,
          best: saved.best,
          isNewBest: saved.isNewBest,
          persisted: saved.persisted,
          won: run.outcome === 'won',
          challengeMet: null,
        };
      }
      notifyLocalChange();
      setBest(view.best);
      setResult(view);
      const headline = view.won ? 'You win!' : 'Game over.';
      const config = active ? POINTS_BEST : (getCanvasGame(gameId).best ?? POINTS_BEST);
      announce(
        `${headline} ${config.label} ${formatResult(view.score, config)}.${view.isNewBest ? ' New personal best!' : ''}${
          view.challengeMet === true ? ' Daily challenge complete.' : ''
        } Press Enter or choose Play again.`,
      );
    };

    const onStatusChange = (status: GameStatus) => {
      const isNewRun = status === 'playing' && previousStatus !== 'paused';
      previousStatus = status;
      setPhase(status);
      if (status === 'playing') {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        rootRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      }
      if (isNewRun) {
        goalMetThisRun = false;
        setGoalMet(false);
        setResult(null);
        announce(`${game.name} started.`);
      } else if (status === 'paused') {
        announce('Paused. Press P, Escape or Resume to continue.');
      } else if (status === 'playing') {
        announce('Resumed.');
      }
    };

    loadGameDefinition(gameId)
      .then((definition) => {
        const canvas = canvasRef.current;
        const root = rootRef.current;
        const stage = stageRef.current;
        if (cancelled || !canvas || !root || !stage) return;

        const wantsDaily = new URLSearchParams(window.location.search).get('mode') === 'daily';
        const today = getDailyChallenge(new Date());
        active = wantsDaily && today.gameId === gameId ? today : null;
        const settings = loadSettings();

        controller = mountGame(definition, {
          canvas,
          root,
          stage,
          muted: settings.muted,
          getRunOptions: () =>
            active ? { seed: active.seed, modifier: active.modifier?.id ?? null } : { seed: randomSeed(), modifier: null },
          callbacks: {
            onStatusChange,
            onHud,
            onGameOver,
            onAnnounce: announce,
            onError: () => setPhase('error'),
          },
        });
        controllerRef.current = controller;
        setChallenge(active);
        setOtherChallenge(wantsDaily && !active ? today : null);
        setMuted(settings.muted);
        setBest(active ? (getDailyEntry(active.dateKey)?.best ?? 0) : (loadBest(gameId) ?? 0));
        setPhase('ready');
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });

    return () => {
      cancelled = true;
      controller?.destroy();
      controllerRef.current = null;
    };
  }, [gameId, game.name]);

  const start = () => controllerRef.current?.start();
  const resume = () => controllerRef.current?.resume();
  const pause = () => controllerRef.current?.pause();
  const restart = () => {
    if (phase === 'over' && performance.now() - overAtRef.current < RESTART_LOCK_MS) return;
    controllerRef.current?.restart();
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    controllerRef.current?.setMuted(next);
    saveSettings({ muted: next });
  };

  const score = hud?.score ?? 0;
  const config = challenge ? POINTS_BEST : bestConfig;
  const higherIsBetter = config.direction === 'higher';
  const running = phase === 'playing' || phase === 'paused';
  const liveBest = higherIsBetter ? Math.max(best, running ? score : 0) : best;
  const beatingBest = higherIsBetter && best > 0 && score > best && running;
  const bestLabel = challenge ? 'Today' : 'Best';
  const show = (n: number) => formatValue(n, config.format);

  return (
    <section
      ref={rootRef}
      className={`${styles.shell} ${styles[game.accent]}`}
      aria-label={`${game.name} game`}
      data-status={phase}
      data-layout={game.canvas.width > game.canvas.height ? 'landscape' : 'portrait'}
      data-challenge={challenge ? 'true' : undefined}
      style={{ '--game-w': game.canvas.width, '--game-h': game.canvas.height } as React.CSSProperties}
    >
      {challenge && (
        <div className={styles.challengeBar}>
          <span className="pill pill-accent">Daily Challenge</span>
          <span>{challenge.goal.description}</span>
          {challenge.modifier && <span className="pill">Modifier: {challenge.modifier.name}</span>}
          {goalMet && <span className="pill pill-success">Completed ✓</span>}
        </div>
      )}
      {otherChallenge && (
        <p className={styles.challengeNotice}>
          Today&apos;s daily challenge is in{' '}
          <Link href={`${gamePath(otherChallenge.gameId)}?mode=daily`}>{getGame(otherChallenge.gameId).name}</Link>. This is a
          standard run.
        </p>
      )}

      <div className={styles.hud}>
        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>{config.label}</dt>
            <dd className={styles.scoreValue}>{show(score)}</dd>
          </div>
          <div className={`${styles.stat} ${beatingBest ? styles.newBest : ''}`}>
            <dt>{bestLabel}</dt>
            <dd>{liveBest > 0 || higherIsBetter ? show(liveBest) : '–'}</dd>
          </div>
          {hud?.items.map((item) => (
            <div key={item.id} className={styles.stat}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.hudButtons}>
          {(phase === 'playing' || phase === 'paused') && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={phase === 'playing' ? pause : resume}
              aria-label={phase === 'playing' ? 'Pause game' : 'Resume game'}
            >
              {phase === 'playing' ? <PauseIcon /> : <PlayIcon />}
            </button>
          )}
          <button
            type="button"
            className={styles.iconButton}
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'Sound off. Turn sound on' : 'Sound on. Turn sound off'}
            title={muted ? 'Sound off' : 'Sound on'}
          >
            {muted ? <MutedIcon /> : <SoundIcon />}
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={styles.stage}
        role="group"
        tabIndex={0}
        aria-label={`${game.name} play area`}
        aria-describedby={hintId}
      >
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

        {phase === 'loading' && (
          <div className={styles.overlay}>
            <p className={styles.overlayTitle}>Loading {game.name}…</p>
          </div>
        )}

        {phase === 'error' && (
          <div className={styles.overlay} role="alert">
            <p className={styles.overlayTitle}>The game could not start</p>
            <p className={styles.overlayText}>Something went wrong while loading or running the game. Reloading the page usually fixes it.</p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        )}

        {phase === 'ready' && (
          <div className={styles.overlay}>
            <p className={styles.overlayTitle}>{challenge ? 'Daily Challenge' : game.name}</p>
            {challenge ? (
              <p className={styles.overlayText}>
                {challenge.goal.description}
                {challenge.modifier ? ` ${challenge.modifier.name}: ${challenge.modifier.description}` : ''}
              </p>
            ) : (
              <p className={styles.overlayText}>{game.tagline}</p>
            )}
            <ul className={styles.controlsList}>
              <li>
                <span className={styles.controlsLabel}>Keyboard</span>
                <span>{game.controls.keyboard}</span>
              </li>
              <li>
                <span className={styles.controlsLabel}>Touch</span>
                <span>{game.controls.touch}</span>
              </li>
              <li>
                <span className={styles.controlsLabel}>Pause</span>
                <span>P or Esc</span>
              </li>
            </ul>
            <button type="button" className={`btn btn-primary ${styles.bigButton}`} onClick={start}>
              <PlayIcon /> {challenge ? 'Start challenge' : 'Start game'}
            </button>
          </div>
        )}

        {phase === 'paused' && (
          <div className={styles.overlay}>
            <p className={styles.overlayTitle}>Paused</p>
            <div className="btn-row">
              <button type="button" className={`btn btn-primary ${styles.bigButton}`} onClick={resume}>
                <PlayIcon /> Resume
              </button>
              <button type="button" className="btn btn-secondary" onClick={restart}>
                Restart
              </button>
            </div>
            <p className={styles.overlayHint}>Press P or Esc to resume.</p>
          </div>
        )}

        {phase === 'over' && result && (
          <div className={`${styles.overlay} ${styles.overlayResult}`}>
            <p className={styles.overlayTitle}>{result.won ? 'Victory!' : 'Game over'}</p>
            <p className={styles.finalScore}>
              <span className="visually-hidden">{config.label}: </span>
              {formatResult(result.score, config)}
            </p>
            {result.isNewBest ? (
              <p className={styles.bestBanner}>New {challenge ? 'best for today' : 'personal best'}!</p>
            ) : (
              (result.best > 0 || higherIsBetter) && (
                <p className={styles.overlayText}>
                  {challenge ? 'Best today' : 'Personal best'}: {formatResult(result.best, config)}
                </p>
              )
            )}
            {result.challengeMet !== null && (
              <p className={result.challengeMet ? styles.challengeDone : styles.overlayText}>
                {result.challengeMet ? 'Daily challenge complete ✓' : `Challenge: ${challenge?.goal.description ?? ''}`}
              </p>
            )}
            <div className="btn-row">
              <button type="button" className={`btn btn-primary ${styles.bigButton}`} onClick={restart}>
                <RestartIcon /> Play again
              </button>
              <Link href="/games/" className="btn btn-secondary">
                Other games
              </Link>
            </div>
            <p className={styles.overlayHint}>
              {result.persisted
                ? 'Scores are saved only in this browser.'
                : 'This browser is blocking local storage, so scores cannot be saved.'}
            </p>
          </div>
        )}
      </div>

      <p id={hintId} className={styles.hint}>
        <span className={styles.hintKeyboard}>{game.controls.keyboard}. P or Esc pauses.</span>
        <span className={styles.hintTouch}>{game.controls.touch}.</span>
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
      <path
        d="M12 5a7 7 0 1 1-6.6 4.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
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
