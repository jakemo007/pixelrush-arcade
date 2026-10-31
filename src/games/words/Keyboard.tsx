'use client';

import type { ReactNode } from 'react';
import styles from './Keyboard.module.css';

export type KeyState = 'correct' | 'present' | 'absent';

export interface SpecialKey {
  id: string;
  label: ReactNode;
  ariaLabel: string;
}

interface KeyboardProps {
  onKey: (key: string) => void;
  label: string;
  states?: Readonly<Partial<Record<string, KeyState>>>;
  disabled?: boolean;
  leftKey?: SpecialKey | null;
  extraKey?: SpecialKey | null;
  compact?: boolean;
}

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;

const STATE_TEXT: Record<KeyState, string> = {
  correct: 'in the right spot',
  present: 'in the word, wrong spot',
  absent: 'not in the word',
};

export const ENTER_KEY: SpecialKey = { id: 'enter', label: 'Enter', ariaLabel: 'Enter' };

export function Keyboard({ onKey, label, states, disabled, leftKey = ENTER_KEY, extraKey = null, compact }: KeyboardProps) {
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();
  const press = (key: string) => {
    if (!disabled) onKey(key);
  };

  return (
    <div className={`${styles.keyboard} ${compact ? styles.compact : ''}`} role="group" aria-label={label}>
      {ROWS.map((row, r) => (
        <div key={row} className={styles.row}>
          {r === 1 && <span className={styles.spacer} aria-hidden="true" />}
          {r === 2 && leftKey && (
            <button
              type="button"
              className={`${styles.key} ${styles.wide}`}
              onMouseDown={keepFocus}
              onClick={() => press(leftKey.id)}
              aria-label={leftKey.ariaLabel}
              disabled={disabled}
              data-key={leftKey.id}
            >
              {leftKey.label}
            </button>
          )}
          {[...row].map((letter) => {
            const state = states?.[letter];
            return (
              <button
                key={letter}
                type="button"
                className={styles.key}
                data-state={state}
                data-key={letter}
                onMouseDown={keepFocus}
                onClick={() => press(letter)}
                aria-label={state ? `${letter.toUpperCase()}, ${STATE_TEXT[state]}` : letter.toUpperCase()}
                disabled={disabled}
              >
                {letter}
              </button>
            );
          })}
          {r === 2 && extraKey && (
            <button
              type="button"
              className={`${styles.key} ${styles.wide}`}
              onMouseDown={keepFocus}
              onClick={() => press(extraKey.id)}
              aria-label={extraKey.ariaLabel}
              disabled={disabled}
              data-key={extraKey.id}
            >
              {extraKey.label}
            </button>
          )}
          {r === 2 && (
            <button
              type="button"
              className={`${styles.key} ${styles.wide}`}
              onMouseDown={keepFocus}
              onClick={() => press('backspace')}
              aria-label="Backspace"
              disabled={disabled}
              data-key="backspace"
            >
              <BackspaceIcon />
            </button>
          )}
          {r === 1 && <span className={styles.spacer} aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

function BackspaceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11.5 9.5l5 5M16.5 9.5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
