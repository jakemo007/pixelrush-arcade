import type { ActionState, InputSnapshot, PointerSnapshot } from '@/games/engine/types';

export const STEP = 1 / 120;

const idle: ActionState = { held: false, pressed: false, released: false };

export function makeInput<A extends string>(
  actions: readonly A[],
  state: Partial<Record<A, Partial<ActionState>>> = {},
  pointer: Partial<PointerSnapshot> = {},
): InputSnapshot<A> {
  const record = {} as Record<A, ActionState>;
  for (const a of actions) record[a] = { ...idle, ...state[a] };
  return {
    actions: record,
    pointer: { inside: false, x: 0, y: 0, down: false, pressed: false, released: false, moved: false, ...pointer },
  };
}

export class MemoryStore {
  readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

export class ThrowingStore {
  getItem(): string | null {
    throw new Error('SecurityError');
  }
  setItem(): void {
    throw new Error('QuotaExceededError');
  }
  removeItem(): void {
    throw new Error('SecurityError');
  }
}
