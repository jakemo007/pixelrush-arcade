'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { DomGameProps, DomRunResult, GameHost } from '@/games/dom/types';
import { useInterval, useTimeout } from '@/games/dom/hooks';
import { Keyboard } from '@/games/words/Keyboard';
import { ANSWERS } from './answers';
import {
  MAX_GUESSES,
  WORD_LENGTH,
  dailySaveValidator,
  displayedStreak,
  emptyStats,
  evaluateGuess,
  formatCountdown,
  getDailyPuzzle,
  isValidGuess,
  isWordStats,
  keyboardStates,
  msUntilNextWord,
  recordDailyResult,
  shareText,
  statusOf,
  winPercent,
  winTitle,
  type DailyPuzzle,
  type LetterState,
  type WordStats,
} from './rules';
import styles from './DailyWord.module.css';

const DAILY_KEY = 'daily';
const STATS_KEY = 'stats';

type Mode = 'daily' | 'practice';

interface Setup {
  mode: Mode;
  puzzle: DailyPuzzle;
  answer: string;
  guesses: string[];
  stats: WordStats;
  restoredOver: boolean;
}

const STATE_LABEL: Record<LetterState, string> = {
  correct: 'correct, right spot',
  present: 'in the word, wrong spot',
  absent: 'not in the word',
};

function createSetup(mode: Mode, host: GameHost): Setup {
  const puzzle = getDailyPuzzle(new Date());
  const stats = host.storage.read(STATS_KEY, isWordStats) ?? emptyStats();
  if (mode === 'practice') {
    const pool = ANSWERS.filter((w) => w !== puzzle.answer);
    const answer = pool[Math.floor(Math.random() * pool.length)] ?? 'crane';
    return { mode, puzzle, answer, guesses: [], stats, restoredOver: false };
  }
  const saved = host.storage.read(DAILY_KEY, dailySaveValidator(puzzle.answer));
  const guesses = saved && saved.dateKey === puzzle.dateKey ? saved.guesses : [];
  return { mode, puzzle, answer: puzzle.answer, guesses, stats, restoredOver: statusOf(guesses, puzzle.answer) !== 'playing' };
}

function aboutHours(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function resultFor(setup: Setup, guesses: readonly string[]): DomRunResult {
  const status = statusOf(guesses, setup.answer);
  const word = setup.answer.toUpperCase();
  if (setup.mode === 'practice') {
    return status === 'won'
      ? { outcome: 'won', title: winTitle(guesses.length), detail: `Solved in ${guesses.length}/${MAX_GUESSES}. Practice games never change your daily statistics.` }
      : { outcome: 'lost', title: 'Out of guesses', detail: `The word was ${word}. Play again for a new practice word.` };
  }
  const next = `The next word arrives at 00:00 UTC, in about ${aboutHours(msUntilNextWord(new Date()))}.`;
  return status === 'won'
    ? { outcome: 'won', title: winTitle(guesses.length), detail: `Daily #${setup.puzzle.puzzleNumber} solved in ${guesses.length}/${MAX_GUESSES}. ${next}`, canReplay: false }
    : { outcome: 'lost', title: 'Out of guesses', detail: `The word was ${word}. ${next}`, canReplay: false };
}

export default function DailyWord({ host, variant, paused }: DomGameProps) {
  const [setup] = useState(() => createSetup(variant === 'practice' ? 'practice' : 'daily', host));
  const { mode, puzzle, answer } = setup;
  const [guesses, setGuesses] = useState<string[]>(setup.guesses);
  const [current, setCurrent] = useState('');
  const [stats, setStats] = useState<WordStats>(setup.stats);
  const [message, setMessage] = useState<{ text: string; id: number } | null>(null);
  const [shake, setShake] = useState(0);
  const [revealRow, setRevealRow] = useState(-1);
  const [pendingFinish, setPendingFinish] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const restoredNotified = useRef(false);

  const status = statusOf(guesses, answer);
  const over = status !== 'playing';
  const reduced = host.reducedMotion;
  const letterStates = useMemo(() => keyboardStates(guesses, answer), [guesses, answer]);
  const today = getDailyPuzzleDay(now);
  const streak = displayedStreak(stats, today);

  useEffect(() => {
    if (!setup.restoredOver || restoredNotified.current) return;
    restoredNotified.current = true;
    host.finish(resultFor(setup, setup.guesses));
  }, [host, setup]);

  useEffect(() => {
    const items = [{ id: 'guess', label: 'Guess', value: `${Math.min(guesses.length + (over ? 0 : 1), MAX_GUESSES)}/${MAX_GUESSES}` }];
    if (mode === 'daily') items.push({ id: 'streak', label: 'Streak', value: String(streak) });
    host.setHud(items);
  }, [host, guesses.length, over, mode, streak]);

  useEffect(() => {
    if (!message || over) return;
    const id = window.setTimeout(() => setMessage(null), 1800);
    return () => window.clearTimeout(id);
  }, [message, over]);
  useTimeout(() => setCopied(null), 2200, copied !== null);
  useTimeout(
    () => {
      setPendingFinish(false);
      host.finish(resultFor(setup, guesses));
    },
    reduced ? 250 : 1700,
    pendingFinish,
  );
  useInterval(() => setNow(Date.now()), 1000, mode === 'daily' && over);

  const showMessage = (text: string) => setMessage({ text, id: Date.now() });

  const submit = () => {
    if (current.length < WORD_LENGTH) {
      showMessage('Not enough letters');
      setShake((n) => n + 1);
      host.playSound('invalid');
      host.announce('Not enough letters.');
      return;
    }
    if (!isValidGuess(current)) {
      showMessage('Not in the word list');
      setShake((n) => n + 1);
      host.playSound('invalid');
      host.announce(`${current.toUpperCase()} is not in the word list.`);
      return;
    }
    const next = [...guesses, current];
    const evaluation = evaluateGuess(current, answer);
    setGuesses(next);
    setCurrent('');
    setRevealRow(next.length - 1);
    const spoken = [...current].map((ch, i) => `${ch.toUpperCase()} ${STATE_LABEL[evaluation[i]!]}`).join(', ');
    host.announce(`Guess ${next.length}: ${spoken}.`);
    const nextStatus = statusOf(next, answer);
    if (mode === 'daily') {
      host.storage.write(DAILY_KEY, { version: 1, dateKey: puzzle.dateKey, guesses: next });
    } else if (next.length === 1) {
      host.setInProgress(true);
    }
    if (nextStatus === 'playing') {
      host.playSound('flip');
      return;
    }
    host.playSound(nextStatus === 'won' ? 'win' : 'invalid');
    if (nextStatus === 'lost') showMessage(answer.toUpperCase());
    if (mode === 'daily') {
      const updated = recordDailyResult(stats, puzzle.dayNumber, nextStatus === 'won', next.length);
      setStats(updated);
      host.storage.write(STATS_KEY, updated);
    } else {
      host.setInProgress(false);
    }
    setPendingFinish(true);
  };

  const handleKey = (key: string) => {
    if (over || paused || pendingFinish) return;
    if (key === 'enter') submit();
    else if (key === 'backspace') setCurrent((c) => c.slice(0, -1));
    else if (/^[a-z]$/.test(key)) setCurrent((c) => (c.length < WORD_LENGTH ? c + key : c));
  };

  const handleKeyRef = useRef(handleKey);
  useEffect(() => {
    handleKeyRef.current = handleKey;
  });
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const root = rootRef.current;
      if (!root || root.closest('[inert]') || root.closest('[hidden]')) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
      const control = target?.closest('a[href], button, summary, [role="button"], [role="dialog"]');
      if (control && !root.contains(control)) return;
      if ((e.key === 'Enter' || e.key === ' ') && control) return;
      let key: string | null = null;
      if (e.key === 'Enter') key = 'enter';
      else if (e.key === 'Backspace') key = 'backspace';
      else if (/^[a-zA-Z]$/.test(e.key)) key = e.key.toLowerCase();
      if (!key) return;
      e.preventDefault();
      handleKeyRef.current(key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const copyResult = () => {
    const text = shareText(puzzle.puzzleNumber, guesses, answer);
    const clip = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (!clip) {
      setCopied('fail');
      return;
    }
    clip.writeText(text).then(
      () => {
        setCopied('ok');
        host.announce('Result copied to the clipboard.');
      },
      () => setCopied('fail'),
    );
  };

  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => i);
  const nextWordMs = msUntilNextWord(new Date(now));
  const newDayReady = mode === 'daily' && getDailyPuzzleDay(now) !== puzzle.dayNumber;
  const boardLabel =
    mode === 'daily'
      ? `Daily word ${puzzle.puzzleNumber}. ${over ? (status === 'won' ? 'Solved.' : 'Not solved.') : `Guess ${guesses.length + 1} of ${MAX_GUESSES}. Type a five-letter word and press Enter.`}`
      : `Practice word. ${over ? 'Finished.' : `Guess ${guesses.length + 1} of ${MAX_GUESSES}. Type a five-letter word and press Enter.`}`;

  return (
    <div ref={rootRef} className={styles.root}>
      <div className={styles.play}>
        <p className={styles.caption}>
          {mode === 'daily' ? (
            <>
              <strong>Daily #{puzzle.puzzleNumber}</strong> <span className={styles.captionMuted}>{formatUtcDate(puzzle.dateKey)} (UTC)</span>
            </>
          ) : (
            <>
              <strong>Practice</strong> <span className={styles.captionMuted}>Random word, not counted in your stats</span>
            </>
          )}
        </p>
        <div className={styles.messageSlot} aria-hidden="true">
          {message && (
            <span key={message.id} className={styles.message}>
              {message.text}
            </span>
          )}
        </div>
        <div className={styles.board} role="group" aria-label={boardLabel} tabIndex={0} data-game-focus>
          {rows.map((r) => {
            const word = r < guesses.length ? guesses[r]! : r === guesses.length && !over ? current : '';
            const evaluation = r < guesses.length ? evaluateGuess(word, answer) : null;
            const isCurrent = r === guesses.length && !over;
            return (
              <div
                key={isCurrent ? `current-${shake}` : `row-${r}`}
                className={`${styles.row} ${isCurrent && shake > 0 && !reduced ? styles.shake : ''}`}
                role="group"
                aria-label={rowLabel(r, word, evaluation, isCurrent)}
              >
                {Array.from({ length: WORD_LENGTH }, (_, c) => {
                  const ch = word[c] ?? '';
                  const state = evaluation?.[c];
                  return (
                    <span
                      key={c}
                      className={`${styles.tile} ${r === revealRow && !reduced ? styles.reveal : ''}`}
                      data-state={state ?? (ch ? 'typed' : undefined)}
                      style={r === revealRow && !reduced ? { animationDelay: `${c * 140}ms` } : undefined}
                      aria-hidden="true"
                    >
                      {ch}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
        <Keyboard onKey={handleKey} label="On-screen keyboard" states={letterStates} disabled={over || paused} />
      </div>

      <aside className={styles.side} aria-label={mode === 'daily' ? 'Daily statistics' : 'Practice mode and statistics'}>
        {mode === 'daily' && over && (
          <div className={styles.panel}>
            <p className={styles.panelTitle}>{status === 'won' ? `Solved in ${guesses.length}/${MAX_GUESSES}` : `The word was ${answer.toUpperCase()}`}</p>
            {newDayReady ? (
              <>
                <p className={styles.countdownLabel}>A new daily word is ready.</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => host.newGame()}>
                  Play today&apos;s word
                </button>
              </>
            ) : (
              <>
                <p className={styles.countdownLabel}>Next word in</p>
                <p className={styles.countdown} role="timer" aria-label={`Next word in ${aboutHours(nextWordMs)}`}>
                  {formatCountdown(nextWordMs)}
                </p>
                <p className={styles.small}>New words arrive every day at 00:00 UTC.</p>
              </>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={copyResult}>
              {copied === 'ok' ? 'Copied!' : 'Copy result'}
            </button>
            {copied === 'fail' && <p className={styles.small}>Copying is not available in this browser.</p>}
          </div>
        )}
        {mode === 'practice' && (
          <div className={styles.panel}>
            <p className={styles.panelTitle}>Practice mode</p>
            <p className={styles.small}>
              A random word every game, as many as you like. Practice games are not saved and never change your daily statistics.
            </p>
          </div>
        )}
        <StatsPanel stats={stats} streak={streak} highlight={mode === 'daily' && status === 'won' ? guesses.length : 0} />
        <div className={styles.legend}>
          <p className={styles.legendTitle}>Reading the tiles</p>
          <ul>
            <li>
              <span className={styles.legendTile} data-state="correct" aria-hidden="true">
                a
              </span>
              Green with a bar: right letter, right spot.
            </li>
            <li>
              <span className={styles.legendTile} data-state="present" aria-hidden="true">
                b
              </span>
              Amber with a dot: in the word, wrong spot.
            </li>
            <li>
              <span className={styles.legendTile} data-state="absent" aria-hidden="true">
                c
              </span>
              Dark grey: not in the word (or no more copies).
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function StatsPanel({ stats, streak, highlight }: { stats: WordStats; streak: number; highlight: number }) {
  const max = Math.max(1, ...stats.distribution);
  const distId = useId();
  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>Daily statistics</p>
      <dl className={styles.stats}>
        <div>
          <dt>Played</dt>
          <dd>{stats.played}</dd>
        </div>
        <div>
          <dt>Win %</dt>
          <dd>{winPercent(stats)}</dd>
        </div>
        <div>
          <dt>Current streak</dt>
          <dd>{streak}</dd>
        </div>
        <div>
          <dt>Max streak</dt>
          <dd>{stats.maxStreak}</dd>
        </div>
      </dl>
      <p className={styles.distTitle} id={distId}>
        Guess distribution
      </p>
      <ol className={styles.dist} aria-labelledby={distId}>
        {stats.distribution.map((count, i) => (
          <li key={i} aria-label={`${i + 1} ${i === 0 ? 'guess' : 'guesses'}: ${count} ${count === 1 ? 'win' : 'wins'}`}>
            <span className={styles.distLabel} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.distTrack} aria-hidden="true">
              <span
                className={styles.distBar}
                data-current={highlight === i + 1 ? 'true' : undefined}
                style={{ width: `${Math.max(8, (count / max) * 100)}%` }}
              >
                {count}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className={styles.small}>Saved in this browser only.</p>
    </div>
  );
}

function rowLabel(r: number, word: string, evaluation: LetterState[] | null, isCurrent: boolean): string {
  const head = `Guess ${r + 1}`;
  if (evaluation) return `${head}: ${[...word].map((ch, i) => `${ch.toUpperCase()}, ${STATE_LABEL[evaluation[i]!]}`).join('; ')}`;
  if (isCurrent) return word ? `${head}, typing: ${word.toUpperCase().split('').join(' ')}` : `${head}, empty`;
  return `${head}, empty`;
}

function getDailyPuzzleDay(ms: number): number {
  return Math.floor(ms / 86_400_000);
}

function formatUtcDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}
