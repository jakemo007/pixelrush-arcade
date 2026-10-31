'use client';

import { memo, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { DomGameProps } from '@/games/dom/types';
import { formatDuration } from '@/lib/format';
import { createRng, randomSeed } from '@/lib/utils/random';
import { PASSAGES } from './passages';
import {
  applyInput,
  buildText,
  computeStats,
  durationFor,
  initialState,
  minCharsFor,
  normalizeInput,
  splitWords,
  type TypingState,
  type TypingStats,
} from './rules';
import { usePlayClock } from '@/games/dom/use-play-clock';
import styles from './TypingSpeed.module.css';

const BLOCKED_INPUT = new Set([
  'insertFromPaste',
  'insertFromPasteAsQuotation',
  'insertFromDrop',
  'insertFromYank',
  'insertReplacementText',
  'insertLineBreak',
  'insertParagraph',
  'historyUndo',
  'historyRedo',
  'deleteByDrag',
  'deleteByCut',
]);
const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Enter']);

const LIVE_WPM_AFTER_MS = 2000;

const pct = (value: number | null) => (value === null ? '–' : `${Math.round(value * 100)}%`);

const Word = memo(function Word({ text, typed, caret }: { text: string; typed: string; caret: number }) {
  return (
    <span className={styles.word}>
      {[...text].map((ch, i) => (
        <span
          key={i}
          className={styles.ch}
          data-s={i >= typed.length ? 'pending' : typed[i] === ch ? 'correct' : 'incorrect'}
          data-caret={i === caret || undefined}
        >
          {ch}
        </span>
      ))}
    </span>
  );
});

export default function TypingSpeed({ host, variant, paused }: DomGameProps) {
  const [duration] = useState(() => durationFor(variant));
  const [state, setState] = useState<TypingState>(() =>
    initialState(buildText(PASSAGES, createRng(randomSeed()), minCharsFor(durationFor(variant)))),
  );
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<TypingStats | null>(null);
  const [focused, setFocused] = useState(false);
  const finished = result !== null;
  const { elapsed, read } = usePlayClock(started && !paused && !finished);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const descId = useId();
  const words = useMemo(() => splitWords(state.target), [state.target]);

  const remaining = finished ? 0 : Math.max(0, duration - elapsed);
  const secondsLeft = Math.ceil(remaining / 1000);
  const caretIndex = state.typed.length;

  const finish = (s: TypingState, elapsedMs: number, reason: 'time' | 'end') => {
    if (finished) return;
    const stats = computeStats(s, elapsedMs);
    setResult(stats);
    inputRef.current?.blur();
    host.playSound('win');
    host.finish({
      outcome: 'won',
      value: Math.round(stats.netWpm),
      title: reason === 'time' ? 'Time’s up!' : 'You typed the whole text!',
      detail: `Accuracy ${pct(stats.accuracy)}, gross speed ${Math.round(stats.grossWpm)} WPM, ${stats.correctChars} correct characters.`,
    });
  };

  const timeUpRef = useRef(() => {});
  useEffect(() => {
    timeUpRef.current = () => finish(state, duration, 'time');
  });
  useEffect(() => {
    if (!started || paused || finished) return;
    const id = window.setTimeout(() => timeUpRef.current(), Math.max(0, duration - read()));
    return () => window.clearTimeout(id);
  }, [started, paused, finished, duration, read]);

  useEffect(() => {
    if (!started || finished) return;
    if (secondsLeft > 0 && secondsLeft <= 5) host.playSound('tick');
    if (secondsLeft === 10) host.announce('10 seconds left.');
  }, [host, started, finished, secondsLeft]);

  const live = result ?? computeStats(state, started ? elapsed : 0);
  const wpmText = result || elapsed >= LIVE_WPM_AFTER_MS ? String(Math.round(live.netWpm)) : '–';
  const accuracyText = pct(live.accuracy);
  const timeText = formatDuration(secondsLeft * 1000);
  useEffect(() => {
    host.setHud([
      { id: 'wpm', label: 'WPM', value: wpmText },
      { id: 'accuracy', label: 'Accuracy', value: accuracyText },
      { id: 'time', label: 'Time', value: timeText },
    ]);
  }, [host, wpmText, accuracyText, timeText]);

  useLayoutEffect(() => {
    const view = viewRef.current;
    const caret = view?.querySelector<HTMLElement>('[data-caret]');
    if (!view || !caret) return;
    const lineHeight = parseFloat(getComputedStyle(view).lineHeight) || caret.offsetHeight;
    const top = Math.max(0, caret.offsetTop - lineHeight);
    if (Math.abs(view.scrollTop - top) > 2) view.scrollTo({ top, behavior: host.reducedMotion ? 'auto' : 'smooth' });
  }, [caretIndex, host]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onBeforeInput = (e: InputEvent) => {
      if (BLOCKED_INPUT.has(e.inputType)) e.preventDefault();
    };
    el.addEventListener('beforeinput', onBeforeInput);
    return () => el.removeEventListener('beforeinput', onBeforeInput);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (e.target !== document.body && e.target !== document.documentElement) return;
      const el = inputRef.current;
      if (!el || el.readOnly || el.closest('[inert]') || el.closest('[hidden]')) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      el.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleValue = (raw: string, isComposing: boolean) => {
    const el = inputRef.current;
    if (finished || paused) {
      if (el) el.value = state.typed;
      return;
    }
    if (started && read() >= duration) {
      if (el) el.value = state.typed;
      finish(state, duration, 'time');
      return;
    }
    if (!started) {
      if (normalizeInput(raw) === '') return;
      setStarted(true);
      host.setInProgress(true);
      host.announce(`Test started. You have ${duration / 1000} seconds.`);
    }
    const next = applyInput(state, raw.slice(0, state.target.length), isComposing);
    if (!isComposing && el && el.value !== next.typed) el.value = next.typed;
    setState(next);
    if (!isComposing && next.typed.length >= state.target.length) finish(next, Math.min(read(), duration), 'end');
  };

  const keepCaretAtEnd = (el: HTMLTextAreaElement) => {
    if (composing.current) return;
    const end = el.value.length;
    if (el.selectionStart !== end || el.selectionEnd !== end) el.setSelectionRange(end, end);
  };

  const preventAndExplain = (e: React.SyntheticEvent) => {
    e.preventDefault();
    host.announce('Pasting and dropping text are turned off. Type the passage yourself.');
  };

  const upcoming = state.target.slice(caretIndex, caretIndex + 90);
  const summary = result;

  return (
    <div className={styles.wrap}>
      <p className={styles.prompt} aria-hidden="true">
        {finished
          ? 'Test complete. Start a new game to try again with a different text.'
          : started
            ? `${secondsLeft} ${secondsLeft === 1 ? 'second' : 'seconds'} left`
            : `Start typing to begin. The ${duration / 1000}-second timer starts with your first keystroke.`}
      </p>

      <div className={styles.box} data-focused={focused || undefined} data-finished={finished || undefined}>
        <div ref={viewRef} className={styles.view} aria-hidden="true">
          {words.map((w) => {
            const end = w.start + w.text.length;
            return (
              <Word
                key={w.start}
                text={w.text}
                typed={caretIndex > w.start ? state.typed.slice(w.start, end) : ''}
                caret={caretIndex >= w.start && caretIndex < end && !finished ? caretIndex - w.start : -1}
              />
            );
          })}
        </div>
        <textarea
          ref={inputRef}
          className={styles.input}
          defaultValue=""
          maxLength={state.target.length}
          readOnly={finished}
          aria-label="Typing area. Type the passage exactly as shown."
          aria-describedby={descId}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="done"
          data-game-focus
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onInput={(e) => handleValue(e.currentTarget.value, (e.nativeEvent as InputEvent).isComposing || composing.current)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(e) => {
            composing.current = false;
            handleValue(e.currentTarget.value, false);
          }}
          onKeyDown={(e) => {
            if (NAV_KEYS.has(e.key)) e.preventDefault();
          }}
          onSelect={(e) => keepCaretAtEnd(e.currentTarget)}
          onPaste={preventAndExplain}
          onDrop={preventAndExplain}
          onDragOver={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
        />
        {!focused && !finished && (
          <div className={styles.hint} aria-hidden="true">
            <span>{started ? 'Click or tap here to keep typing' : 'Click or tap here, then start typing'}</span>
          </div>
        )}
      </div>
      <p id={descId} className="visually-hidden">
        {finished ? 'The test is over.' : `Next characters: ${upcoming}`}
      </p>

      {summary && (
        <dl className={styles.summary} aria-label="Your results">
          <div>
            <dt>Net speed</dt>
            <dd>{Math.round(summary.netWpm)} WPM</dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>{pct(summary.accuracy)}</dd>
          </div>
          <div>
            <dt>Gross speed</dt>
            <dd>{Math.round(summary.grossWpm)} WPM</dd>
          </div>
          <div>
            <dt>Correct characters</dt>
            <dd>{summary.correctChars}</dd>
          </div>
          <div>
            <dt>Errors left</dt>
            <dd>{summary.incorrectChars}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
