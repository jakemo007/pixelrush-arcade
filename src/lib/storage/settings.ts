import { getBrowserStorage, isPlainObject, readJson, storageKey, writeJson, type KeyValueStore } from './safe-storage';

export const SETTINGS_KEY = storageKey('settings');

export interface PlayerSettings {
  muted: boolean;
}

export const DEFAULT_SETTINGS: PlayerSettings = { muted: false };

function isSettings(value: unknown): value is PlayerSettings {
  return isPlainObject(value) && typeof value.muted === 'boolean';
}

export function loadSettings(store: KeyValueStore | null = getBrowserStorage()): PlayerSettings {
  return readJson(store, SETTINGS_KEY, isSettings) ?? DEFAULT_SETTINGS;
}

export function saveSettings(settings: PlayerSettings, store: KeyValueStore | null = getBrowserStorage()): boolean {
  return writeJson(store, SETTINGS_KEY, { muted: settings.muted });
}
