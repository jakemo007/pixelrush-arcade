/**
 * Collects keyboard and pointer input between simulation steps.
 *
 * DOM events arrive at arbitrary times; the simulation runs on a fixed step.
 * Edges ("pressed"/"released") are latched here until the next snapshot so a
 * quick tap between two steps is never lost, and auto-repeat keydown events
 * are ignored so holding a key cannot re-trigger an action.
 *
 * This class has no DOM dependency, so it is unit tested directly.
 */

import type { ActionState, InputSnapshot, PointerSnapshot } from './types';

export class InputManager<A extends string> {
  private readonly actions: readonly A[];
  private readonly codeToActions = new Map<string, A[]>();
  private readonly heldCodes = new Set<string>();
  private readonly pressed = new Set<A>();
  private readonly released = new Set<A>();
  private readonly activePointers = new Set<number>();
  private readonly pointer: PointerSnapshot = {
    inside: false,
    x: 0,
    y: 0,
    down: false,
    pressed: false,
    released: false,
    moved: false,
  };

  constructor(private readonly bindings: Readonly<Record<A, readonly string[]>>) {
    this.actions = Object.keys(bindings) as A[];
    for (const action of this.actions) {
      for (const code of bindings[action]) {
        const list = this.codeToActions.get(code) ?? [];
        list.push(action);
        this.codeToActions.set(code, list);
      }
    }
  }

  isBound(code: string): boolean {
    return this.codeToActions.has(code);
  }

  private isHeld(action: A): boolean {
    return this.bindings[action].some((code) => this.heldCodes.has(code));
  }

  /** Returns true when the key belongs to this game (caller should preventDefault). */
  keyDown(code: string, repeat: boolean): boolean {
    const actions = this.codeToActions.get(code);
    if (!actions) return false;
    if (repeat || this.heldCodes.has(code)) return true;
    const before = actions.map((a) => this.isHeld(a));
    this.heldCodes.add(code);
    actions.forEach((a, i) => {
      if (!before[i]) this.pressed.add(a);
    });
    return true;
  }

  keyUp(code: string): boolean {
    const actions = this.codeToActions.get(code);
    if (!actions) return false;
    if (!this.heldCodes.has(code)) return true;
    this.heldCodes.delete(code);
    for (const a of actions) {
      if (!this.isHeld(a)) this.released.add(a);
    }
    return true;
  }

  pointerDown(id: number, x: number, y: number): void {
    this.activePointers.add(id);
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.inside = true;
    this.pointer.pressed = true;
    this.pointer.moved = true;
    this.pointer.down = true;
  }

  pointerMove(x: number, y: number): void {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.inside = true;
    this.pointer.moved = true;
  }

  pointerUp(id: number, isTouch: boolean): void {
    this.activePointers.delete(id);
    if (this.activePointers.size === 0 && this.pointer.down) {
      this.pointer.down = false;
      this.pointer.released = true;
      // Touch has no hover state: once the finger lifts, the pointer is gone.
      if (isTouch) this.pointer.inside = false;
    }
  }

  pointerLeave(): void {
    if (!this.pointer.down) this.pointer.inside = false;
  }

  /** Releases everything (used on pause, blur and restart). */
  releaseAll(): void {
    for (const code of [...this.heldCodes]) this.keyUp(code);
    if (this.pointer.down) this.pointer.released = true;
    this.activePointers.clear();
    this.pointer.down = false;
    this.pointer.inside = false;
  }

  /** Returns the current state and clears the latched edges. */
  snapshot(): InputSnapshot<A> {
    const actions = {} as Record<A, ActionState>;
    for (const a of this.actions) {
      actions[a] = { held: this.isHeld(a), pressed: this.pressed.has(a), released: this.released.has(a) };
    }
    const pointer: PointerSnapshot = { ...this.pointer };
    this.pressed.clear();
    this.released.clear();
    this.pointer.pressed = false;
    this.pointer.released = false;
    this.pointer.moved = false;
    return { actions, pointer };
  }
}

/** An all-released snapshot, useful for tests and attract screens. */
export function emptyInput<A extends string>(actions: readonly A[]): InputSnapshot<A> {
  const record = {} as Record<A, ActionState>;
  for (const a of actions) record[a] = { held: false, pressed: false, released: false };
  return {
    actions: record,
    pointer: { inside: false, x: 0, y: 0, down: false, pressed: false, released: false, moved: false },
  };
}
