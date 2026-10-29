'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { GameHost } from '@/games/dom/types';
import { CardBack, CardFace } from './CardFace';
import { cardName, faceDownCount, type Card } from './model';
import styles from './CardTable.module.css';

export interface PileRef {
  readonly pile: string;
  readonly index: number;
}

export interface PileSpec {
  id: string;
  kind: 'fan' | 'stack' | 'waste';
  cards: readonly Card[];
  name: string;
  placeholder?: ReactNode;
  spread?: number;
  span?: number;
  action?: string;
  badge?: string;
  hint?: string;
}

export interface CardTableProps {
  columns: number;
  topRow: readonly (PileSpec | null)[];
  tableau: readonly PileSpec[];
  version: unknown;
  canPick(pile: string, index: number): boolean;
  canDrop(from: PileRef, to: string): boolean;
  onMove(from: PileRef, to: string): boolean;
  onActivate?(pile: string): void;
  onAutoMove?(from: PileRef): boolean;
  onShortcut?(key: string, focused: PileRef | null): boolean;
  host: GameHost;
  disabled?: boolean;
  label: string;
  theme: 'green' | 'violet' | 'cyan';
  keyboardHelp?: string;
  heightRatio?: number;
}

interface Selection extends PileRef {
  version: unknown;
}

interface Press {
  pointerId: number;
  x: number;
  y: number;
  pile: string;
  index: number;
  draggable: boolean;
  dragging: boolean;
}

const DRAG_THRESHOLD = 6;
const DOUBLE_TAP_MS = 380;

const posKey = (pile: string, index: number) => `${pile}:${index}`;

function focusPositions(spec: PileSpec): number[] {
  const n = spec.cards.length;
  if (n === 0 || spec.action) return [n === 0 ? -1 : n - 1];
  if (spec.kind !== 'fan') return [n - 1];
  const first = Math.min(faceDownCount(spec.cards), n - 1);
  const out: number[] = [];
  for (let i = first; i < n; i++) out.push(i);
  return out;
}

function nearestPosition(spec: PileSpec, index: number): number {
  const positions = focusPositions(spec);
  let best = positions[0]!;
  for (const p of positions) if (p <= index) best = p;
  return best;
}

function overlapArea(a: DOMRect, b: DOMRect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

export function CardTable(props: CardTableProps) {
  const { columns, topRow, tableau, version, canPick, canDrop, onMove, onActivate, onAutoMove, onShortcut, host, disabled, label, theme } = props;
  const helpId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<Press | null>(null);
  const lastTapRef = useRef<{ key: string; at: number } | null>(null);
  const focusPendingRef = useRef(false);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [drag, setDrag] = useState<Selection | null>(null);
  const [cursor, setCursor] = useState<PileRef>(() => ({ pile: tableau[0]?.id ?? '', index: Number.MAX_SAFE_INTEGER }));

  const piles = new Map<string, PileSpec>();
  for (const p of topRow) if (p) piles.set(p.id, p);
  for (const p of tableau) piles.set(p.id, p);

  const active = !disabled && selection && selection.version === version && canPick(selection.pile, selection.index) ? selection : null;
  const dragging = !disabled && drag && drag.version === version ? drag : null;
  const source = dragging ?? active;
  const targets = new Set<string>();
  if (source) for (const id of piles.keys()) if (id !== source.pile && canDrop(source, id)) targets.add(id);

  const cursorSpec = piles.get(cursor.pile) ?? tableau[0];
  const current: PileRef | null = cursorSpec ? { pile: cursorSpec.id, index: nearestPosition(cursorSpec, cursor.index) } : null;
  const currentKey = current ? posKey(current.pile, current.index) : '';

  useEffect(() => {
    if (!focusPendingRef.current) return;
    focusPendingRef.current = false;
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-pos="${CSS.escape(currentKey)}"]`);
    el?.focus({ preventScroll: true });
  });

  const hasFocus = () => {
    const root = rootRef.current;
    return Boolean(root && document.activeElement && root.contains(document.activeElement));
  };

  const describeRun = (ref: PileRef): string => {
    const cards = piles.get(ref.pile)?.cards ?? [];
    const card = cards[ref.index];
    if (!card) return 'card';
    const extra = cards.length - ref.index - 1;
    return extra > 0 ? `${cardName(card)} and ${extra} card${extra > 1 ? 's' : ''} on it` : cardName(card);
  };

  const select = (ref: PileRef) => {
    setSelection({ ...ref, version });
    host.playSound('select');
    let count = 0;
    for (const id of piles.keys()) if (id !== ref.pile && canDrop(ref, id)) count++;
    host.announce(`Picked up ${describeRun(ref)}. ${count > 0 ? 'Choose where to place it.' : 'It has no legal move right now.'}`);
  };

  const clearSelection = (announce: boolean) => {
    setSelection(null);
    if (announce) host.announce('Selection cancelled.');
  };

  const tryMove = (from: PileRef, to: string, keepFocus: boolean): boolean => {
    const moved = onMove(from, to);
    setSelection(null);
    if (moved) {
      setCursor({ pile: to, index: Number.MAX_SAFE_INTEGER });
      if (keepFocus) focusPendingRef.current = true;
    }
    return moved;
  };

  const activate = (ref: PileRef, viaKeyboard: boolean) => {
    const spec = piles.get(ref.pile);
    if (!spec) return;
    const keepFocus = viaKeyboard || hasFocus();
    if (spec.action) {
      setSelection(null);
      onActivate?.(spec.id);
      setCursor({ pile: spec.id, index: Number.MAX_SAFE_INTEGER });
      if (keepFocus) focusPendingRef.current = true;
      return;
    }
    if (active) {
      if (active.pile === ref.pile) {
        if (ref.index !== active.index && ref.index >= 0 && canPick(ref.pile, ref.index)) select(ref);
        else clearSelection(true);
        return;
      }
      if (canDrop(active, ref.pile)) {
        tryMove(active, ref.pile, keepFocus);
        return;
      }
      if (!viaKeyboard && ref.index >= 0 && canPick(ref.pile, ref.index)) {
        select(ref);
        return;
      }
      onMove(active, ref.pile);
      if (!viaKeyboard) setSelection(null);
      return;
    }
    if (ref.index >= 0 && canPick(ref.pile, ref.index)) {
      select(ref);
    } else if (viaKeyboard) {
      host.playSound('invalid');
      host.announce(spec.cards.length === 0 ? `${spec.name} is empty.` : 'That card cannot be picked up.');
    }
  };

  const moveCursor = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (!current || !cursorSpec) return;
    const topIndex = topRow.findIndex((p) => p?.id === current.pile);
    const inTop = topIndex >= 0;
    const col = inTop ? topIndex : tableau.findIndex((p) => p.id === current.pile);
    let next: PileRef | null = null;
    if (dir === 'left' || dir === 'right') {
      const step = dir === 'left' ? -1 : 1;
      const row = inTop ? topRow : tableau;
      for (let i = col + step; i >= 0 && i < row.length; i += step) {
        const p = row[i];
        if (p) {
          next = { pile: p.id, index: Number.MAX_SAFE_INTEGER };
          break;
        }
      }
    } else if (dir === 'up') {
      const positions = focusPositions(cursorSpec);
      const at = positions.indexOf(current.index);
      if (!inTop && at > 0) next = { pile: current.pile, index: positions[at - 1]! };
      else if (!inTop) {
        for (let d = 0; d < columns && !next; d++) {
          for (const c of [col - d, col + d]) {
            const p = topRow[c];
            if (p && !next) next = { pile: p.id, index: Number.MAX_SAFE_INTEGER };
          }
        }
      }
    } else if (inTop) {
      const p = tableau[Math.min(col, tableau.length - 1)];
      if (p) next = { pile: p.id, index: Number.MAX_SAFE_INTEGER };
    } else {
      const positions = focusPositions(cursorSpec);
      const at = positions.indexOf(current.index);
      if (at >= 0 && at < positions.length - 1) next = { pile: current.pile, index: positions[at + 1]! };
    }
    if (next) {
      setCursor(next);
      focusPendingRef.current = true;
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case 'ArrowUp':
        moveCursor('up');
        break;
      case 'ArrowDown':
        moveCursor('down');
        break;
      case 'ArrowLeft':
        moveCursor('left');
        break;
      case 'ArrowRight':
        moveCursor('right');
        break;
      case 'Enter':
      case ' ':
        if (e.repeat) break;
        if (current) activate(current, true);
        break;
      case 'Escape':
        if (!active) return;
        clearSelection(true);
        break;
      default:
        if (e.repeat || !onShortcut?.(e.key.toLowerCase(), current)) return;
        focusPendingRef.current = hasFocus();
    }
    e.preventDefault();
  };

  const setDragOffset = (dx: number, dy: number) => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty('--drag-x', `${dx}px`);
    root.style.setProperty('--drag-y', `${dy}px`);
  };

  const endDrag = () => {
    setDragOffset(0, 0);
    setDrag(null);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || pressRef.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const target = e.target as HTMLElement;
    const pileEl = target.closest<HTMLElement>('[data-pile]');
    if (!pileEl || !rootRef.current?.contains(pileEl)) return;
    const pile = pileEl.dataset.pile!;
    const cardEl = target.closest<HTMLElement>('[data-index]');
    const index = cardEl ? Number(cardEl.dataset.index) : -1;
    const spec = piles.get(pile);
    const draggable = Boolean(spec && !spec.action && index >= 0 && canPick(pile, index));
    pressRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, pile, index, draggable, dragging: false };
    if (draggable) {
      try {
        rootRef.current.setPointerCapture(e.pointerId);
      } catch {
      }
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    if (!press || press.pointerId !== e.pointerId || !press.draggable) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    if (!press.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      press.dragging = true;
      setDrag({ pile: press.pile, index: press.index, version });
      setSelection(null);
    }
    setDragOffset(dx, dy);
  };

  const dropTarget = (from: PileRef): string | null => {
    const root = rootRef.current;
    const cardEl = root?.querySelector<HTMLElement>(`[data-pile="${CSS.escape(from.pile)}"] [data-index="${from.index}"]`);
    if (!root || !cardEl) return null;
    const rect = cardEl.getBoundingClientRect();
    let bestLegal: { id: string; area: number } | null = null;
    let bestAny: { id: string; area: number } | null = null;
    root.querySelectorAll<HTMLElement>('[data-drop]').forEach((el) => {
      const id = el.dataset.drop!;
      if (id === from.pile) return;
      const area = overlapArea(rect, el.getBoundingClientRect());
      if (area <= 0) return;
      if (!bestAny || area > bestAny.area) bestAny = { id, area };
      if (canDrop(from, id) && (!bestLegal || area > bestLegal.area)) bestLegal = { id, area };
    });
    const legal = bestLegal as { id: string; area: number } | null;
    const any = bestAny as { id: string; area: number } | null;
    return legal?.id ?? any?.id ?? null;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current;
    if (!press || press.pointerId !== e.pointerId) return;
    pressRef.current = null;
    if (disabled) {
      endDrag();
      return;
    }
    if (press.dragging) {
      const from = { pile: press.pile, index: press.index };
      const to = dropTarget(from);
      endDrag();
      lastTapRef.current = null;
      if (to) {
        if (!tryMove(from, to, hasFocus())) host.playSound('invalid');
      }
      return;
    }
    const ref = { pile: press.pile, index: press.index };
    const key = posKey(ref.pile, ref.index);
    const now = performance.now();
    const last = lastTapRef.current;
    setCursor(ref.index >= 0 ? ref : { pile: ref.pile, index: Number.MAX_SAFE_INTEGER });
    if (last && last.key === key && now - last.at < DOUBLE_TAP_MS && ref.index >= 0 && onAutoMove) {
      lastTapRef.current = null;
      if (onAutoMove(ref)) {
        setSelection(null);
        return;
      }
    } else {
      lastTapRef.current = { key, at: now };
    }
    activate(ref, false);
  };

  const onPointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    if (pressRef.current?.pointerId !== e.pointerId) return;
    pressRef.current = null;
    endDrag();
  };

  const renderCard = (spec: PileSpec, card: Card, index: number, style: CSSProperties, focusable: boolean) => {
    const key = posKey(spec.id, index);
    const isCurrent = focusable && key === currentKey;
    const lifted = Boolean(active && active.pile === spec.id && index >= active.index);
    const isDragged = Boolean(dragging && dragging.pile === spec.id && index >= dragging.index);
    const draggable = card.faceUp && !spec.action && canPick(spec.id, index);
    const classes = [styles.card, card.faceUp ? styles.up : styles.down];
    if (lifted) classes.push(styles.selected);
    if (isDragged) classes.push(styles.dragging);
    if (draggable) classes.push(styles.draggable);
    if (card.faceUp) classes.push(card.suit === 'hearts' || card.suit === 'diamonds' ? styles.red : styles.black);
    const isTop = index === spec.cards.length - 1;
    if (isTop && targets.has(spec.id)) classes.push(styles.target);
    const name = card.faceUp ? `${cardName(card)}, face up` : 'Face-down card';
    const status = [lifted ? 'selected' : '', isTop && targets.has(spec.id) ? 'valid destination' : ''].filter(Boolean).join(', ');
    return (
      <div
        key={card.id}
        className={classes.join(' ')}
        style={style}
        data-index={index}
        data-pos={focusable ? key : undefined}
        role={focusable ? 'button' : undefined}
        tabIndex={focusable ? (isCurrent ? 0 : -1) : undefined}
        aria-label={focusable ? `${name}, ${spec.name}${status ? `, ${status}` : ''}` : undefined}
        aria-hidden={focusable ? undefined : true}
        data-game-focus={isCurrent ? '' : undefined}
      >
        {card.faceUp ? <CardFace card={card} /> : <CardBack />}
      </div>
    );
  };

  const renderEmpty = (spec: PileSpec) => {
    const key = posKey(spec.id, -1);
    const isCurrent = key === currentKey;
    const isTarget = targets.has(spec.id);
    const actionable = Boolean(spec.action);
    return (
      <div
        className={`${styles.slot} ${isTarget ? styles.target : ''} ${actionable ? styles.slotAction : ''}`}
        data-pos={key}
        role="button"
        tabIndex={isCurrent ? 0 : -1}
        aria-label={actionable ? spec.action : `${spec.name}, empty${spec.hint ? `. ${spec.hint}` : ''}${isTarget ? ', valid destination' : ''}`}
        data-game-focus={isCurrent ? '' : undefined}
      >
        {spec.placeholder !== undefined && (
          <span className={styles.placeholder} aria-hidden="true">
            {spec.placeholder}
          </span>
        )}
      </div>
    );
  };

  const renderStack = (spec: PileSpec) => {
    const n = spec.cards.length;
    if (n === 0) return renderEmpty(spec);
    if (spec.action) {
      const key = posKey(spec.id, n - 1);
      const isCurrent = key === currentKey;
      return (
        <div
          className={`${styles.card} ${styles.down} ${styles.stockButton}`}
          data-index={n - 1}
          data-pos={key}
          role="button"
          tabIndex={isCurrent ? 0 : -1}
          aria-label={spec.action}
          data-game-focus={isCurrent ? '' : undefined}
          style={{ '--depth': Math.min(4, Math.ceil(n / 8)) } as CSSProperties}
        >
          <CardBack />
        </div>
      );
    }
    const visible = spec.kind === 'waste' ? Math.max(1, Math.min(spec.spread ?? 1, n)) : 1;
    const first = Math.max(0, n - visible - 1);
    const out: ReactNode[] = [];
    for (let i = first; i < n; i++) {
      const spreadPos = Math.max(0, i - (n - visible));
      const style = { '--j': spec.kind === 'waste' ? spreadPos : 0 } as CSSProperties;
      out.push(renderCard(spec, spec.cards[i]!, i, style, i === n - 1));
    }
    return out;
  };

  const renderFan = (spec: PileSpec) => {
    const n = spec.cards.length;
    if (n === 0) return renderEmpty(spec);
    const down = Math.min(faceDownCount(spec.cards), n - 1);
    const firstFocusable = down;
    return spec.cards.map((card, i) => renderCard(spec, card, i, { '--i': i } as CSSProperties, i >= firstFocusable));
  };

  const pileLabel = (spec: PileSpec) => {
    const n = spec.cards.length;
    if (spec.kind !== 'fan') return `${spec.name}: ${n === 0 ? 'empty' : `${n} card${n > 1 ? 's' : ''}`}`;
    const down = faceDownCount(spec.cards);
    const parts = [];
    if (down > 0) parts.push(`${down} face down`);
    if (n - down > 0) parts.push(`${n - down} face up`);
    return `${spec.name}: ${parts.length ? parts.join(', ') : 'empty'}`;
  };

  const renderPile = (spec: PileSpec, gridColumn: string) => {
    const n = spec.cards.length;
    const down = Math.min(faceDownCount(spec.cards), Math.max(0, n - 1));
    const style = {
      gridColumn,
      '--down': down,
      '--up': Math.max(1, n - down),
    } as CSSProperties;
    const kindClass = spec.kind === 'fan' ? styles.fan : spec.kind === 'waste' ? styles.waste : styles.stack;
    return (
      <div
        key={spec.id}
        className={`${styles.pile} ${kindClass}`}
        style={style}
        data-pile={spec.id}
        data-drop={spec.action ? undefined : spec.id}
        data-target={targets.has(spec.id) || undefined}
        role="group"
        aria-label={pileLabel(spec)}
      >
        {spec.kind === 'fan' ? renderFan(spec) : renderStack(spec)}
        {spec.badge && (
          <span className={styles.badge} aria-hidden="true">
            {spec.badge}
          </span>
        )}
      </div>
    );
  };

  const feltStyle = { '--cols': columns, '--height-ratio': props.heightRatio ?? 0.21 } as CSSProperties;

  return (
    <div className={styles.table}>
      <div
        ref={rootRef}
        className={styles.felt}
        data-theme={theme}
        data-dragging={dragging ? 'true' : undefined}
        data-disabled={disabled || undefined}
        style={feltStyle}
        role="region"
        aria-label={label}
        aria-describedby={helpId}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onPointerCancel}
      >
        <p id={helpId} className="visually-hidden">
          Arrow keys move between piles and cards. Enter or Space picks up the focused card and places it on the focused pile. Escape
          cancels. {props.keyboardHelp ?? ''}
        </p>
        <div className={`${styles.row} ${styles.topRow}`}>
          {topRow.map((spec, i) => (spec ? renderPile(spec, `${i + 1} / span ${spec.span ?? 1}`) : null))}
        </div>
        <div className={`${styles.row} ${styles.tableauRow}`}>{tableau.map((spec, i) => renderPile(spec, `${i + 1}`))}</div>
      </div>
    </div>
  );
}
