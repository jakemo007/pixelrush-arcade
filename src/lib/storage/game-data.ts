import type { GameId } from '@/config/games';
import { getBrowserStorage, readJson, storageKey, writeJson, type KeyValueStore, type Validator } from './safe-storage';

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,47}$/;

export function gameDataKey(gameId: GameId, name: string): string {
  if (!NAME_PATTERN.test(name)) throw new Error(`Invalid game data name: ${name}`);
  return storageKey(`game:${gameId}:${name}`);
}

export interface GameStorage {
  read<T>(name: string, validate: Validator<T>): T | null;
  write(name: string, value: unknown): boolean;
  remove(name: string): void;
}

export function createGameStorage(gameId: GameId, store: KeyValueStore | null = getBrowserStorage()): GameStorage {
  return {
    read<T>(name: string, validate: Validator<T>): T | null {
      return readJson(store, gameDataKey(gameId, name), validate);
    },
    write(name: string, value: unknown): boolean {
      return writeJson(store, gameDataKey(gameId, name), value);
    },
    remove(name: string): void {
      if (!store) return;
      try {
        store.removeItem(gameDataKey(gameId, name));
      } catch {
      }
    },
  };
}
