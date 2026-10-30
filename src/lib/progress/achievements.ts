import { getBrowserStorage, isPlainObject, readJson, storageKey, writeJson, type KeyValueStore } from '@/lib/storage/safe-storage';

export const ACHIEVEMENTS_KEY = 'achievements';
export const MAX_COUNTER_VALUE = 1_000_000_000;

export type CounterMode = 'add' | 'max';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  counter: string;
  target: number;
}

export interface AchievementState {
  counters: Readonly<Record<string, number>>;
  unlocked: Readonly<Record<string, string>>;
}

export interface CounterEvent {
  counter: string;
  value: number;
  mode: CounterMode;
}

export interface CounterOutcome {
  state: AchievementState;
  unlocked: AchievementDef[];
}

const ID_PATTERN = /^[a-z0-9][a-z0-9:-]{0,63}$/;

export function emptyAchievements(): AchievementState {
  return { counters: {}, unlocked: {} };
}

export function isValidAchievementId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

function isCounterValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_COUNTER_VALUE;
}

export function isAchievementState(value: unknown): value is AchievementState {
  if (!isPlainObject(value) || !isPlainObject(value.counters) || !isPlainObject(value.unlocked)) return false;
  for (const [key, v] of Object.entries(value.counters)) if (!isValidAchievementId(key) || !isCounterValue(v)) return false;
  for (const [key, v] of Object.entries(value.unlocked)) if (!isValidAchievementId(key) || typeof v !== 'string') return false;
  return true;
}

export function validateDefinitions(defs: readonly AchievementDef[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const def of defs) {
    if (!isValidAchievementId(def.id)) problems.push(`invalid id: ${def.id}`);
    if (seen.has(def.id)) problems.push(`duplicate id: ${def.id}`);
    seen.add(def.id);
    if (!isValidAchievementId(def.counter)) problems.push(`${def.id}: invalid counter ${def.counter}`);
    if (!Number.isInteger(def.target) || def.target < 1 || def.target > MAX_COUNTER_VALUE) problems.push(`${def.id}: invalid target`);
    if (def.name.trim() === '' || def.description.trim() === '') problems.push(`${def.id}: missing text`);
  }
  return problems;
}

export function recordCounter(state: AchievementState, defs: readonly AchievementDef[], event: CounterEvent, now: string): CounterOutcome {
  if (!isValidAchievementId(event.counter) || !isCounterValue(event.value)) return { state, unlocked: [] };
  const previous = state.counters[event.counter] ?? 0;
  const next = Math.min(MAX_COUNTER_VALUE, event.mode === 'add' ? previous + event.value : Math.max(previous, event.value));
  if (next === previous && event.mode === 'max') return { state, unlocked: [] };

  const counters = { ...state.counters, [event.counter]: next };
  const unlockedAt = { ...state.unlocked };
  const unlocked: AchievementDef[] = [];
  for (const def of defs) {
    if (def.counter !== event.counter || unlockedAt[def.id] || next < def.target) continue;
    unlockedAt[def.id] = now;
    unlocked.push(def);
  }
  return { state: { counters, unlocked: unlockedAt }, unlocked };
}

export function isUnlocked(state: AchievementState, id: string): boolean {
  return Boolean(state.unlocked[id]);
}

export function achievementProgress(state: AchievementState, def: AchievementDef): { value: number; target: number; done: boolean } {
  const value = Math.min(state.counters[def.counter] ?? 0, def.target);
  return { value, target: def.target, done: isUnlocked(state, def.id) };
}

export function loadAchievements(store: KeyValueStore | null = getBrowserStorage()): AchievementState {
  return readJson(store, storageKey(ACHIEVEMENTS_KEY), isAchievementState) ?? emptyAchievements();
}

export function saveAchievements(state: AchievementState, store: KeyValueStore | null = getBrowserStorage()): boolean {
  return writeJson(store, storageKey(ACHIEVEMENTS_KEY), state);
}
