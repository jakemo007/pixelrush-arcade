'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DomGameProps, GameHost } from '@/games/dom/types';
import { useStopwatch, useTimeout } from '@/games/dom/hooks';
import { Keyboard } from '@/games/words/Keyboard';
import { formatDuration } from '@/lib/format';
import {
  buildPuzzle,
  entryIndexAt,
  firstEmptyCell,
  isFilled,
  isSolved,
  moveCell,
  stepEntry,
  whiteCells,
  wrongCells,
  type BuiltPuzzle,
  type Direction,
} from './grid';
import { PUZZLES } from './puzzles';
import styles from './Crossword.module.css';

const PROGRESS_KEY = 'progress';
const CURRENT_KEY = 'current';

interface SolvedInfo {
  ms: number | null;
  revealed: boolean;
}

interface Progress {
  version: 1;
  solved: Record<string, SolvedInfo>;
}

interface Current {
  id: string;
  explicit: boolean;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function isProgress(v: unknown): v is Progress {
  if (!isRecord(v) || v.version !== 1 || !isRecord(v.solved)) return false;
  return Object.values(v.solved).every(
    (s) => isRecord(s) && typeof s.revealed === 'boolean' && (s.ms === null || (typeof s.ms === 'number' && Number.isFinite(s.ms) && s.ms >= 0)),
  );
}

const isCurrent = (v: unknown): v is Current => isRecord(v) && typeof v.id === 'string' && typeof v.explicit === 'boolean';

type Scope = 'square' | 'word' | 'puzzle';

interface Setup {
  index: number;
  built: BuiltPuzzle;
  progress: Progress;
}

function nextUnsolvedIndex(progress: Progress, after: number): number {
  for (let k = 1; k <= PUZZLES.length; k++) {
    const i = (after + k) % PUZZLES.length;
    if (!progress.solved[PUZZLES[i]!.id]) return i;
  }
  return (after + 1) % PUZZLES.length;
}

function createSetup(host: GameHost): Setup {
  const progress = host.storage.read(PROGRESS_KEY, isProgress) ?? { version: 1, solved: {} };
  const current = host.storage.read(CURRENT_KEY, isCurrent);
  let index = current ? PUZZLES.findIndex((p) => p.id === current.id) : -1;
  if (index < 0 || (progress.solved[PUZZLES[index]!.id] && !current?.explicit)) {
    index = nextUnsolvedIndex(progress, index < 0 ? -1 : index);
  }
  return { index, built: buildPuzzle(PUZZLES[index]!), progress };
}

export default function CrosswordMini({ host, paused }: DomGameProps) {
  const [setup] = useState(() => createSetup(host));
  const { built, index, progress } = setup;
  const cellsCount = built.width * built.height;
  const [letters, setLetters] = useState<string[]>(() => new Array<string>(cellsCount).fill(''));
  const [wrong, setWrong] = useState<boolean[]>(() => new Array<boolean>(cellsCount).fill(false));
  const [locked, setLocked] = useState<('revealed' | 'checked' | null)[]>(() => new Array(cellsCount).fill(null));
  const [cursor, setCursor] = useState(() => built.entries[0]!.cells[0]!);
  const [direction, setDirection] = useState<Direction>('across');
  const [usedCheck, setUsedCheck] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: 'nav'; to: number } | { kind: 'reveal' } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const elapsed = useStopwatch(started && !paused && !over);
  const elapsedRef = useRef(0);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const focusGrid = useRef(false);

  useEffect(() => {
    elapsedRef.current = elapsed;
  });

  const entryIndex = entryIndexAt(built, cursor, direction);
  const entry = built.entries[entryIndex]!;
  const activeDirection = entry.direction;
  const crossIndex = activeDirection === 'across' ? built.downOf[cursor]! : built.acrossOf[cursor]!;
  const wordCells = useMemo(() => new Set(entry.cells), [entry]);
  const seconds = Math.floor(elapsed / 1000);
  const solvedInfo = progress.solved[built.id];

  useEffect(() => {
    host.setHud([
      { id: 'time', label: 'Time', value: formatDuration(seconds * 1000) },
      { id: 'puzzle', label: 'Puzzle', value: `${index + 1}/${PUZZLES.length}` },
    ]);
  }, [host, seconds, index]);

  useEffect(() => {
    if (!focusGrid.current) return;
    focusGrid.current = false;
    cellRefs.current[cursor]?.focus();
  });

  useTimeout(() => setMessage(null), 2600, message !== null && !over);

  useTimeout(
    () => {
      const ms = Math.max(1, Math.round(elapsedRef.current));
      const where = `${built.title} (puzzle ${index + 1} of ${PUZZLES.length})`;
      const latest = host.storage.read(PROGRESS_KEY, isProgress) ?? progress;
      host.storage.write(PROGRESS_KEY, { version: 1, solved: { ...latest.solved, [built.id]: { ms: revealed > 0 ? null : ms, revealed: revealed > 0 } } });
      if (revealed > 0) {
        host.finish({
          outcome: 'won',
          title: 'Crossword complete',
          detail: `${where} finished with ${revealed} revealed ${revealed === 1 ? 'square' : 'squares'}, so the time does not count as a best.`,
        });
      } else {
        host.finish({ outcome: 'won', value: ms, title: 'Crossword solved!', detail: `${where} solved ${usedCheck ? 'using Check' : 'with no help'}.` });
      }
    },
    host.reducedMotion ? 150 : 900,
    over,
  );

  const begin = () => {
    if (!started) {
      setStarted(true);
      host.setInProgress(true);
    }
  };

  const complete = (finalRevealed: number) => {
    setOver(true);
    host.setInProgress(false);
    host.playSound('win');
    host.announce('Crossword solved!');
    const ms = Math.max(1, Math.round(elapsedRef.current));
    const solved = { ...progress.solved, [built.id]: { ms: finalRevealed > 0 ? null : ms, revealed: finalRevealed > 0 } };
    host.storage.write(PROGRESS_KEY, { version: 1, solved });
    host.storage.write(CURRENT_KEY, { id: PUZZLES[nextUnsolvedIndex({ version: 1, solved }, index)]!.id, explicit: false });
  };

  const applyLetters = (next: string[], finalRevealed = revealed) => {
    setLetters(next);
    if (isSolved(built, next)) complete(finalRevealed);
    else if (isFilled(built, next)) {
      setMessage('The grid is full, but some letters are wrong.');
      host.announce('The grid is full, but some letters are wrong.');
    }
  };

  const announceEntry = (i: number) => {
    const e = built.entries[i]!;
    host.announce(`${e.number} ${e.direction}: ${e.clue}. ${e.cells.length} letters.`);
  };

  const selectEntry = (i: number, focus = true) => {
    const e = built.entries[i]!;
    setDirection(e.direction);
    setCursor(firstEmptyCell(e, letters));
    focusGrid.current = focus;
    announceEntry(i);
  };

  const writableFrom = (): { cell: number; entry: number } | null => {
    if (!locked[cursor]) return { cell: cursor, entry: entryIndex };
    const pos = entry.cells.indexOf(cursor);
    const rest = entry.cells.slice(pos + 1).find((c) => !locked[c]);
    if (rest !== undefined) return { cell: rest, entry: entryIndex };
    for (let k = 1; k <= built.entries.length; k++) {
      const ei = (entryIndex + k) % built.entries.length;
      const free = built.entries[ei]!.cells.find((c) => !locked[c] && !letters[c]) ?? built.entries[ei]!.cells.find((c) => !locked[c]);
      if (free !== undefined) return { cell: free, entry: ei };
    }
    return null;
  };

  const typeLetter = (letter: string) => {
    if (over || paused) return;
    begin();
    const target = writableFrom();
    if (!target) return;
    const { cell } = target;
    const e = built.entries[target.entry]!;
    if (letters[cell] !== letter) {
      const next = [...letters];
      next[cell] = letter;
      if (wrong[cell]) setWrong((w) => w.map((v, i) => (i === cell ? false : v)));
      applyLetters(next);
      if (isSolved(built, next)) return;
    }
    if (target.entry !== entryIndex) setDirection(e.direction);
    const pos = e.cells.indexOf(cell);
    if (pos < e.cells.length - 1) {
      setCursor(e.cells[pos + 1]!);
    } else {
      const ni = stepEntry(built, target.entry, 1);
      const ne = built.entries[ni]!;
      setDirection(ne.direction);
      setCursor(firstEmptyCell(ne, letters.map((l, i) => (i === cell ? letter : l))));
      announceEntry(ni);
    }
    focusGrid.current = true;
  };

  const backspace = () => {
    if (over || paused) return;
    const cell = cursor;
    if (letters[cell] && !locked[cell]) {
      applyLetters(letters.map((l, i) => (i === cell ? '' : l)));
      setWrong((w) => w.map((v, i) => (i === cell ? false : v)));
      return;
    }
    const pos = entry.cells.indexOf(cell);
    let target: number;
    if (pos > 0) {
      target = entry.cells[pos - 1]!;
    } else {
      const pe = built.entries[stepEntry(built, entryIndex, -1)]!;
      setDirection(pe.direction);
      target = pe.cells[pe.cells.length - 1]!;
    }
    setCursor(target);
    if (letters[target] && !locked[target]) {
      applyLetters(letters.map((l, i) => (i === target ? '' : l)));
      setWrong((w) => w.map((v, i) => (i === target ? false : v)));
    }
    focusGrid.current = true;
  };

  const toggleDirection = () => {
    const other: Direction = activeDirection === 'across' ? 'down' : 'across';
    if ((other === 'across' ? built.acrossOf[cursor]! : built.downOf[cursor]!) < 0) return;
    setDirection(other);
    announceEntry(entryIndexAt(built, cursor, other));
  };

  const arrow = (dr: number, dc: number) => {
    const axis: Direction = dc !== 0 ? 'across' : 'down';
    const hasAxis = (axis === 'across' ? built.acrossOf[cursor]! : built.downOf[cursor]!) >= 0;
    if (activeDirection !== axis && hasAxis) {
      setDirection(axis);
      announceEntry(entryIndexAt(built, cursor, axis));
      return;
    }
    setCursor(moveCell(built, cursor, dr, dc));
    focusGrid.current = true;
  };

  const clickCell = (cell: number) => {
    if (!built.solution[cell] || paused) return;
    if (cell === cursor) {
      toggleDirection();
      return;
    }
    const keep = (activeDirection === 'across' ? built.acrossOf[cell]! : built.downOf[cell]!) >= 0;
    const dir = keep ? activeDirection : activeDirection === 'across' ? 'down' : 'across';
    setDirection(dir);
    setCursor(cell);
    focusGrid.current = true;
  };

  const scopeCells = (scope: Scope): number[] => (scope === 'square' ? [cursor] : scope === 'word' ? entry.cells : whiteCells(built));

  const check = (scope: Scope) => {
    if (over || paused) return;
    begin();
    setUsedCheck(true);
    const cells = scopeCells(scope);
    const bad = wrongCells(built, letters, cells);
    setWrong((w) => w.map((v, i) => (cells.includes(i) ? bad.includes(i) : v)));
    setLocked((l) => l.map((v, i) => (v ? v : cells.includes(i) && letters[i] && letters[i] === built.solution[i] ? 'checked' : null)));
    const empty = cells.filter((c) => !letters[c]).length;
    const text = bad.length
      ? `${bad.length} wrong ${bad.length === 1 ? 'letter' : 'letters'} marked.`
      : empty === cells.length
        ? 'Nothing to check yet.'
        : `No wrong letters${empty ? `, ${empty} still empty` : ''}.`;
    setMessage(text);
    host.announce(text);
    host.playSound(bad.length ? 'invalid' : 'match');
  };

  const reveal = (scope: Scope) => {
    if (over || paused) return;
    begin();
    const cells = scopeCells(scope);
    const changed = cells.filter((c) => letters[c] !== built.solution[c]);
    if (changed.length === 0) {
      setMessage('Those letters are already correct.');
      return;
    }
    const total = revealed + changed.length;
    setRevealed(total);
    setLocked((l) => l.map((v, i) => (changed.includes(i) ? 'revealed' : v)));
    setWrong((w) => w.map((v, i) => (changed.includes(i) ? false : v)));
    host.playSound('flip');
    host.announce(`Revealed ${changed.length} ${changed.length === 1 ? 'letter' : 'letters'}.`);
    applyLetters(
      letters.map((l, i) => (changed.includes(i) ? built.solution[i]! : l)),
      total,
    );
  };

  const goToPuzzle = (to: number) => {
    host.storage.write(CURRENT_KEY, { id: PUZZLES[to]!.id, explicit: true });
    host.newGame();
  };

  const requestPuzzle = (delta: number) => {
    const to = (index + delta + PUZZLES.length) % PUZZLES.length;
    if (started && !over) setConfirm({ kind: 'nav', to });
    else goToPuzzle(to);
  };

  const onOnScreenKey = (key: string) => {
    if (key === 'backspace') backspace();
    else if (key === 'toggle') toggleDirection();
    else typeLetter(key.toUpperCase());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (paused || confirm || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target as HTMLElement;
    const onButton = Boolean(target.closest('button, input'));
    const inGrid = Boolean(target.closest('[role="grid"]'));
    if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      typeLetter(e.key.toUpperCase());
      return;
    }
    const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const a = arrows[e.key];
    if (a && !onButton) {
      e.preventDefault();
      arrow(a[0], a[1]);
      return;
    }
    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        backspace();
        return;
      case 'Delete':
        e.preventDefault();
        if (letters[cursor] && !locked[cursor]) applyLetters(letters.map((l, i) => (i === cursor ? '' : l)));
        return;
      case ' ':
        if (onButton) return;
        e.preventDefault();
        toggleDirection();
        return;
      case 'Enter':
        if (onButton) return;
        e.preventDefault();
        selectEntry(stepEntry(built, entryIndex, e.shiftKey ? -1 : 1));
        return;
      case 'Tab': {
        if (!inGrid) return;
        const last = built.entries.length - 1;
        if ((!e.shiftKey && entryIndex === last) || (e.shiftKey && entryIndex === 0)) return;
        e.preventDefault();
        selectEntry(stepEntry(built, entryIndex, e.shiftKey ? -1 : 1));
        return;
      }
      case 'Escape':
        if (!inGrid) return;
        e.preventDefault();
        toolbarRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
        return;
    }
  };

  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  const cellLabel = (cell: number): string => {
    const r = Math.floor(cell / built.width) + 1;
    const c = (cell % built.width) + 1;
    if (!built.solution[cell]) return `Row ${r}, column ${c}, black square`;
    const parts = [`Row ${r}, column ${c}`, letters[cell] ? `letter ${letters[cell]}` : 'empty'];
    const inEntries = [built.acrossOf[cell]!, built.downOf[cell]!]
      .filter((i) => i >= 0)
      .map((i) => `${built.entries[i]!.number} ${built.entries[i]!.direction === 'across' ? 'Across' : 'Down'}`);
    parts.push(`part of ${inEntries.join(' and ')}`);
    if (wrong[cell]) parts.push('marked wrong');
    if (locked[cell] === 'revealed') parts.push('revealed');
    if (locked[cell] === 'checked') parts.push('checked correct');
    return parts.join(', ');
  };

  const clueList = (dir: Direction) => (
    <div className={styles.clueGroup}>
      <h3 className={styles.clueHeading}>{dir === 'across' ? 'Across' : 'Down'}</h3>
      <ol className={styles.clues}>
        {(dir === 'across' ? built.across : built.down).map((e) => {
          const i = built.entries.indexOf(e);
          const done = e.cells.every((c) => letters[c]);
          return (
            <li key={`${dir}-${e.number}`}>
              <button
                type="button"
                className={styles.clueButton}
                data-active={i === entryIndex || undefined}
                data-cross={i === crossIndex || undefined}
                data-done={done || undefined}
                onClick={() => selectEntry(i)}
                aria-current={i === entryIndex ? 'true' : undefined}
              >
                <span className={styles.clueNum}>{e.number}</span>
                <span>{e.clue}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );

  return (
    <div className={styles.root} onKeyDown={onKeyDown}>
      <div className={styles.main}>
        <div className={styles.nav}>
          <button type="button" className={styles.navButton} onClick={() => requestPuzzle(-1)} aria-label="Previous puzzle">
            <Chevron left />
          </button>
          <p className={styles.navText}>
            <strong>
              Puzzle {index + 1} of {PUZZLES.length}
            </strong>
            <span className={styles.navTitle}>{built.title}</span>
            {solvedInfo && (
              <span className={styles.navSolved}>
                {solvedInfo.revealed ? 'Completed with reveals' : `Solved ✓ ${solvedInfo.ms !== null ? formatDuration(solvedInfo.ms) : ''}`}
              </span>
            )}
          </p>
          <button type="button" className={styles.navButton} onClick={() => requestPuzzle(1)} aria-label="Next puzzle">
            <Chevron />
          </button>
        </div>

        {confirm && (
          <div className={styles.confirm} role="group" aria-label="Confirm">
            <p>
              {confirm.kind === 'nav'
                ? `Switch to puzzle ${confirm.to + 1}? Your letters in this puzzle will be lost.`
                : 'Reveal the whole puzzle? Your time will not count as a best.'}
            </p>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                autoFocus
                onClick={() => {
                  const c = confirm;
                  setConfirm(null);
                  if (c.kind === 'nav') goToPuzzle(c.to);
                  else reveal('puzzle');
                }}
              >
                {confirm.kind === 'nav' ? 'Switch puzzle' : 'Reveal puzzle'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className={styles.clueBar}>
          <button type="button" className={styles.clueStep} onMouseDown={keepFocus} onClick={() => selectEntry(stepEntry(built, entryIndex, -1))} aria-label="Previous clue">
            <Chevron left />
          </button>
          <p className={styles.clueText} aria-live="off">
            <span className={styles.clueTag}>
              {entry.number}
              {activeDirection === 'across' ? 'A' : 'D'}
            </span>
            {entry.clue}
          </p>
          <button type="button" className={styles.clueStep} onMouseDown={keepFocus} onClick={() => selectEntry(stepEntry(built, entryIndex, 1))} aria-label="Next clue">
            <Chevron />
          </button>
        </div>

        <div className={styles.gridWrap}>
          <div className={styles.grid} role="grid" aria-label={`Crossword grid, ${built.width} by ${built.height}`} style={{ '--w': built.width } as React.CSSProperties} data-over={over || undefined}>
            {Array.from({ length: built.height }, (_, r) => (
              <div key={r} role="row" className={styles.row}>
                {Array.from({ length: built.width }, (_, c) => {
                  const cell = r * built.width + c;
                  const black = !built.solution[cell];
                  const isCursor = cell === cursor;
                  return (
                    <div
                      key={cell}
                      ref={(el) => {
                        cellRefs.current[cell] = el;
                      }}
                      role="gridcell"
                      aria-label={cellLabel(cell)}
                      aria-selected={isCursor}
                      tabIndex={isCursor ? 0 : -1}
                      data-game-focus={isCursor ? true : undefined}
                      className={styles.cell}
                      data-black={black || undefined}
                      data-cursor={isCursor || undefined}
                      data-word={(!black && wordCells.has(cell) && !isCursor) || undefined}
                      data-wrong={wrong[cell] || undefined}
                      data-locked={locked[cell] ?? undefined}
                      onClick={() => clickCell(cell)}
                    >
                      {built.numbers[cell] ? (
                        <span className={styles.num} aria-hidden="true">
                          {built.numbers[cell]}
                        </span>
                      ) : null}
                      {!black && (
                        <span className={styles.letter} aria-hidden="true">
                          {letters[cell]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <p className={styles.message} aria-hidden="true">
          {message ?? ' '}
        </p>

        <div className={styles.osk}>
          <Keyboard
            onKey={onOnScreenKey}
            label="On-screen keyboard"
            disabled={over || paused}
            leftKey={{ id: 'toggle', label: <span aria-hidden="true">{activeDirection === 'across' ? '↕' : '↔'}</span>, ariaLabel: 'Switch between across and down' }}
            compact
          />
        </div>

        <div className={styles.toolbar} ref={toolbarRef}>
          <div className={styles.toolGroup} role="group" aria-label="Check">
            <span className={styles.toolLabel}>Check</span>
            {(['square', 'word', 'puzzle'] as const).map((s) => (
              <button key={s} type="button" className="btn btn-secondary btn-sm" onMouseDown={keepFocus} onClick={() => check(s)} disabled={over} aria-label={`Check ${s}`}>
                {s[0]!.toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className={styles.toolGroup} role="group" aria-label="Reveal">
            <span className={styles.toolLabel}>Reveal</span>
            {(['square', 'word', 'puzzle'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="btn btn-secondary btn-sm"
                onMouseDown={keepFocus}
                onClick={() => (s === 'puzzle' ? setConfirm({ kind: 'reveal' }) : reveal(s))}
                disabled={over}
                aria-label={`Reveal ${s}`}
              >
                {s[0]!.toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.side}>
        {clueList('across')}
        {clueList('down')}
        <p className={styles.help}>
          Type to fill squares. Click the selected square or press <kbd>Space</kbd> to switch between across and down; <kbd>Tab</kbd> or{' '}
          <kbd>Enter</kbd> jumps to the next clue.
        </p>
      </div>
    </div>
  );
}

function Chevron({ left }: { left?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={left ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
