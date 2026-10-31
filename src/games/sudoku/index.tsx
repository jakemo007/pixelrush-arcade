'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DomGameProps } from '@/games/dom/types';
import { useStopwatch, useTimeout } from '@/games/dom/hooks';
import { formatDuration } from '@/lib/format';
import { randomSeed } from '@/lib/utils/random';
import { applyHint, chooseHint, digitCounts, findConflicts, findMistakes, initialState, isComplete, isEditable, setValue, toggleNote, type SudokuState } from './game';
import { dealPuzzle } from './generator';
import type { Difficulty } from './logic';
import { boxOf, colOf, rowOf } from './solver';
import styles from './Sudoku.module.css';

const OPTIONS_KEY = 'options';
const LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

interface Options {
  showMistakes: boolean;
}

const isOptions = (v: unknown): v is Options =>
  typeof v === 'object' && v !== null && typeof (v as Record<string, unknown>).showMistakes === 'boolean';

function toDifficulty(variant: string): Difficulty {
  return variant === 'medium' || variant === 'hard' ? variant : 'easy';
}

export default function Sudoku({ host, variant, paused }: DomGameProps) {
  const difficulty = toDifficulty(variant);
  const [deal] = useState(() => dealPuzzle(randomSeed(), difficulty));
  const { puzzle, solution } = deal;
  const [state, setState] = useState<SudokuState>(() => initialState(deal.puzzle));
  const [history, setHistory] = useState<SudokuState[]>([]);
  const [selected, setSelected] = useState(() => Math.max(0, deal.puzzle.findIndex((v) => v === 0)));
  const [notesMode, setNotesMode] = useState(false);
  const [showMistakes, setShowMistakes] = useState(() => host.storage.read(OPTIONS_KEY, isOptions)?.showMistakes ?? false);
  const [hints, setHints] = useState(0);
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState(false);
  const elapsed = useStopwatch(started && !paused && !over);
  const elapsedRef = useRef(0);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const focusAfterMove = useRef(false);

  useEffect(() => {
    elapsedRef.current = elapsed;
  });

  const conflicts = useMemo(() => findConflicts(state.values), [state.values]);
  const mistakes = useMemo(() => (showMistakes ? findMistakes(state.values, solution) : new Set<number>()), [showMistakes, state.values, solution]);
  const counts = useMemo(() => digitCounts(state.values), [state.values]);
  const left = state.values.filter((v) => v === 0).length;
  const selectedValue = state.values[selected] ?? 0;
  const seconds = Math.floor(elapsed / 1000);

  useEffect(() => {
    host.setHud([
      { id: 'time', label: 'Time', value: formatDuration(seconds * 1000) },
      { id: 'left', label: 'Empty', value: String(left) },
      { id: 'hints', label: 'Hints', value: String(hints) },
    ]);
  }, [host, seconds, left, hints]);

  useEffect(() => {
    if (!focusAfterMove.current) return;
    focusAfterMove.current = false;
    cellRefs.current[selected]?.focus();
  }, [selected]);

  useTimeout(
    () => {
      const ms = Math.max(1, Math.round(elapsedRef.current));
      const hintText = hints === 0 ? 'no hints' : `${hints} ${hints === 1 ? 'hint' : 'hints'}`;
      host.finish({ outcome: 'won', value: ms, title: 'Puzzle solved!', detail: `${LABELS[difficulty]} puzzle solved with ${hintText}.` });
    },
    host.reducedMotion ? 150 : 900,
    over,
  );

  const commit = (next: SudokuState) => {
    if (next === state) return false;
    setHistory((h) => [...h.slice(-499), state]);
    setState(next);
    if (!started) {
      setStarted(true);
      host.setInProgress(true);
    }
    if (isComplete(next.values, solution)) {
      setOver(true);
      host.setInProgress(false);
      host.playSound('win');
      host.announce('Puzzle solved!');
    }
    return true;
  };

  const describe = (cell: number) => `Row ${rowOf(cell) + 1}, column ${colOf(cell) + 1}`;

  const enterDigit = (digit: number, asNote = notesMode) => {
    if (over || paused) return;
    const cell = selected;
    if (!isEditable(puzzle, state, cell)) {
      host.playSound('invalid');
      host.announce(state.hinted[cell] ? 'That cell was filled by a hint.' : 'That number is part of the puzzle and cannot be changed.');
      return;
    }
    if (asNote) {
      if (state.values[cell] !== 0) {
        host.announce('Clear the cell before adding notes.');
        return;
      }
      const next = toggleNote(puzzle, state, cell, digit);
      commit(next);
      host.playSound('tick');
      host.announce(`Note ${digit} ${next.notes[cell]! & (1 << digit) ? 'added' : 'removed'}.`);
      return;
    }
    const value = state.values[cell] === digit ? 0 : digit;
    const next = setValue(puzzle, state, cell, value);
    if (!commit(next)) return;
    if (value === 0) {
      host.playSound('select');
      host.announce(`${describe(cell)} cleared.`);
      return;
    }
    const clash = findConflicts(next.values).has(cell);
    const wrong = showMistakes && solution[cell] !== value;
    host.playSound(clash || wrong ? 'invalid' : 'place');
    if (!isComplete(next.values, solution)) {
      host.announce(`${describe(cell)}: ${value}${clash ? `. Conflict: another ${value} is in the same row, column or box` : ''}${wrong ? '. Incorrect' : ''}.`);
    }
  };

  const erase = () => {
    if (over || paused) return;
    const cell = selected;
    if (!isEditable(puzzle, state, cell)) return;
    if (commit(setValue(puzzle, state, cell, 0))) {
      host.playSound('select');
      host.announce(`${describe(cell)} cleared.`);
    }
  };

  const undo = () => {
    if (over || paused || history.length === 0) return;
    const previous = history[history.length - 1]!;
    setHistory((h) => h.slice(0, -1));
    setState(previous);
    host.playSound('flip');
    host.announce('Undone.');
  };

  const hint = () => {
    if (over || paused) return;
    const h = chooseHint(puzzle, state, solution, selected);
    if (!h) return;
    setHints((n) => n + 1);
    setSelected(h.cell);
    commit(applyHint(state, h.cell, solution));
    host.playSound('select');
    host.announce(`Hint: ${describe(h.cell)} is ${h.digit}. ${h.reason}.`);
  };

  const toggleNotes = () => {
    if (over) return;
    host.announce(notesMode ? 'Notes off.' : 'Notes on. Digits now add or remove pencil marks.');
    setNotesMode(!notesMode);
  };

  const toggleMistakes = () => {
    const next = !showMistakes;
    setShowMistakes(next);
    host.storage.write(OPTIONS_KEY, { showMistakes: next });
  };

  const move = (dr: number, dc: number) => {
    const r = (rowOf(selected) + dr + 9) % 9;
    const c = (colOf(selected) + dc + 9) % 9;
    focusAfterMove.current = true;
    setSelected(r * 9 + c);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (paused || e.altKey) return;
    const target = e.target as HTMLElement;
    const onControl = target.closest('button, input, label');
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      undo();
      return;
    }
    if (e.ctrlKey || e.metaKey) return;
    const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const arrow = arrows[e.key];
    if (arrow) {
      e.preventDefault();
      move(arrow[0], arrow[1]);
      return;
    }
    const codeDigit = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (codeDigit && e.shiftKey) {
      e.preventDefault();
      enterDigit(Number(codeDigit[1]), true);
      return;
    }
    if (/^[1-9]$/.test(e.key)) {
      e.preventDefault();
      enterDigit(Number(e.key));
      return;
    }
    if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      erase();
      return;
    }
    if ((e.key === 'n' || e.key === 'N') && !onControl?.matches('input')) {
      e.preventDefault();
      toggleNotes();
    }
  };

  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  const cells = Array.from({ length: 81 }, (_, i) => i);
  const selRow = rowOf(selected);
  const selCol = colOf(selected);
  const selBox = boxOf(selected);

  return (
    <div className={styles.root} onKeyDown={onKeyDown} data-over={over || undefined}>
      <div className={styles.boardWrap}>
        <div className={styles.board} role="grid" aria-label={`Sudoku, ${LABELS[difficulty]}. ${left} empty cells.`} aria-readonly={over}>
          {Array.from({ length: 9 }, (_, r) => (
            <div key={r} role="row" className={styles.row}>
              {cells.slice(r * 9, r * 9 + 9).map((cell) => {
                const value = state.values[cell]!;
                const given = puzzle[cell] !== 0;
                const hinted = state.hinted[cell]!;
                const isSel = cell === selected;
                const peer = !isSel && (rowOf(cell) === selRow || colOf(cell) === selCol || boxOf(cell) === selBox);
                const same = !isSel && selectedValue !== 0 && value === selectedValue;
                const conflict = conflicts.has(cell) && !given;
                const givenConflict = conflicts.has(cell) && given;
                const wrong = mistakes.has(cell);
                const notes = state.notes[cell]!;
                const label = [
                  describe(cell),
                  value ? `${given ? 'given ' : hinted ? 'hint ' : ''}${value}` : 'empty',
                  !value && notes ? `notes ${DIGITS.filter((d) => notes & (1 << d)).join(', ')}` : '',
                  conflict || givenConflict ? 'conflict' : '',
                  wrong ? 'incorrect' : '',
                ]
                  .filter(Boolean)
                  .join(', ');
                return (
                  <div
                    key={cell}
                    ref={(el) => {
                      cellRefs.current[cell] = el;
                    }}
                    role="gridcell"
                    aria-label={label}
                    aria-selected={isSel}
                    tabIndex={isSel ? 0 : -1}
                    data-game-focus={isSel ? true : undefined}
                    className={styles.cell}
                    data-given={given || undefined}
                    data-hint={hinted || undefined}
                    data-selected={isSel || undefined}
                    data-peer={peer || undefined}
                    data-same={same || undefined}
                    data-conflict={conflict || givenConflict || undefined}
                    data-wrong={wrong || undefined}
                    data-box-right={colOf(cell) === 2 || colOf(cell) === 5 || undefined}
                    data-box-bottom={rowOf(cell) === 2 || rowOf(cell) === 5 || undefined}
                    onClick={() => setSelected(cell)}
                  >
                    {value ? (
                      <span className={styles.value} aria-hidden="true">
                        {value}
                      </span>
                    ) : notes ? (
                      <span className={styles.notes} aria-hidden="true">
                        {DIGITS.map((d) => (
                          <span key={d} data-match={selectedValue === d || undefined}>
                            {notes & (1 << d) ? d : ''}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.pad} role="group" aria-label={notesMode ? 'Number pad, notes mode' : 'Number pad'}>
          {DIGITS.map((d) => {
            const remaining = Math.max(0, 9 - counts[d]!);
            return (
              <button
                key={d}
                type="button"
                className={styles.padKey}
                data-notes={notesMode || undefined}
                data-done={remaining === 0 || undefined}
                onMouseDown={keepFocus}
                onClick={() => enterDigit(d)}
                disabled={over}
                aria-label={`${notesMode ? 'Note ' : ''}${d}, ${remaining} left`}
              >
                <span className={styles.padDigit}>{d}</span>
                <span className={styles.padCount} aria-hidden="true">
                  {remaining}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.action} onMouseDown={keepFocus} onClick={undo} disabled={over || history.length === 0}>
            <UndoIcon />
            <span>Undo</span>
          </button>
          <button type="button" className={styles.action} onMouseDown={keepFocus} onClick={erase} disabled={over}>
            <EraseIcon />
            <span>Erase</span>
          </button>
          <button type="button" className={styles.action} onMouseDown={keepFocus} onClick={toggleNotes} aria-pressed={notesMode} disabled={over}>
            <PencilIcon />
            <span>Notes {notesMode ? 'on' : 'off'}</span>
          </button>
          <button type="button" className={styles.action} onMouseDown={keepFocus} onClick={hint} disabled={over}>
            <BulbIcon />
            <span>Hint</span>
          </button>
        </div>

        <label className={styles.toggle}>
          <input type="checkbox" checked={showMistakes} onChange={toggleMistakes} />
          <span>Mark digits that do not match the solution</span>
        </label>
        <p className={styles.help}>
          Select a cell, then type 1-9 or use the pad. <kbd>N</kbd> switches notes, <kbd>Shift</kbd>+digit adds a note, <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes.
        </p>
      </div>
    </div>
  );
}

function UndoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 7H4V2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 7.5A8 8 0 1 1 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EraseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 20h12M5 15l9-10 6 6-9 9H8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M10 9l6 6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 20l1-5L16 4l4 4L9 19z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
