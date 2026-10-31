import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { CANVAS_LOADERS, DOM_LOADERS } from '@/components/games/game-loaders';
import {
  CATEGORIES,
  CATEGORY_IDS,
  GAMES,
  GAME_IDS,
  gamesInCategory,
  getGame,
  relatedGames,
  type GameCategory,
  type GameId,
  type GameInfo,
} from '@/config/games';
import { GAME_CONTENT } from '@/content/games';
import { getSiteRoutes } from '@/lib/seo/routes';

const ROOT = process.cwd();
const GAMES_DIR = join(ROOT, 'src', 'games');

const ORIGINAL_IDS: readonly GameId[] = ['neon-dash', 'brick-breaker', 'space-survival'];
const isOriginal = (id: GameId) => ORIGINAL_IDS.includes(id);

const META_FOLDERS = readdirSync(GAMES_DIR).filter((name) => existsSync(join(GAMES_DIR, name, 'meta.ts')));
const metaModules = new Map<string, GameInfo | undefined>();
const metaFor = (id: GameId) => metaModules.get(id);

beforeAll(async () => {
  for (const folder of META_FOLDERS) {
    const mod = (await import(`../src/games/${folder}/meta.ts`)) as { meta?: GameInfo };
    metaModules.set(folder, mod.meta);
  }
});

function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe.each(GAME_IDS.map((id) => [id]))('%s', (id) => {
  const game = getGame(id);

  it('has exactly one catalogue entry with a matching id', () => {
    expect(GAMES.filter((g) => g.id === id)).toHaveLength(1);
  });

  it('has a meta.ts whose id matches its folder (new games)', () => {
    if (isOriginal(id)) {
      expect(metaFor(id)).toBeUndefined();
      return;
    }
    const meta = metaFor(id);
    expect(meta, `src/games/${id}/meta.ts`).toBeDefined();
    expect(meta!.id).toBe(id);
    expect(meta).toBe(game);
  });

  it('has valid, non-empty, unique categories', () => {
    expect(game.categories.length).toBeGreaterThan(0);
    expect(new Set(game.categories).size).toBe(game.categories.length);
    for (const c of game.categories) expect(CATEGORY_IDS).toContain(c);
  });

  it('has card text and tags', () => {
    expect(game.name.trim()).not.toBe('');
    expect(game.tagline.trim()).not.toBe('');
    expect(game.summary.trim()).not.toBe('');
    expect(game.genre.trim()).not.toBe('');
    expect(game.tags.length).toBeGreaterThanOrEqual(2);
    expect(game.tags.length).toBeLessThanOrEqual(4);
    expect(game.added).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('has exactly one loader, matching its engine', () => {
    const canvas = id in CANVAS_LOADERS;
    const dom = id in DOM_LOADERS;
    expect(canvas && dom, 'registered in both loader maps').toBe(false);
    if (game.engine === 'canvas') {
      expect(canvas).toBe(true);
      expect(Number.isInteger(game.canvas.width) && game.canvas.width > 0).toBe(true);
      expect(Number.isInteger(game.canvas.height) && game.canvas.height > 0).toBe(true);
    } else {
      expect(dom).toBe(true);
      expect('canvas' in game).toBe(false);
    }
  });

  it('has page content', () => {
    const content = GAME_CONTENT[id];
    expect(content).toBeDefined();
    expect(content.metaTitle.length).toBeLessThanOrEqual(70);
    expect(content.metaDescription.length).toBeGreaterThanOrEqual(110);
    expect(content.metaDescription.length).toBeLessThanOrEqual(170);
    expect(content.intro.length).toBeGreaterThan(0);
    expect(content.howToPlay.length).toBeGreaterThan(0);
    expect(content.controls.length).toBeGreaterThan(0);
    expect(content.faq.length).toBeGreaterThan(0);
  });

  it('has a route file and a sitemap entry', () => {
    expect(existsSync(join(ROOT, 'src', 'app', 'games', id, 'page.tsx'))).toBe(true);
    expect(getSiteRoutes().some((r) => r.path === `/games/${id}/`)).toBe(true);
  });

  it('has card art', () => {
    if (isOriginal(id)) {
      expect(readFileSync(join(ROOT, 'src', 'components', 'games', 'ClassicGameArt.tsx'), 'utf8')).toContain(`'${id}'`);
    } else {
      expect(existsSync(join(GAMES_DIR, id, 'art.tsx'))).toBe(true);
    }
  });

  it('has a game module', () => {
    const entry = game.engine === 'canvas' ? 'index.ts' : 'index.tsx';
    expect(existsSync(join(GAMES_DIR, id, entry)), `src/games/${id}/${entry}`).toBe(true);
  });

  it('has unique, well-formed variant ids', () => {
    if (game.engine !== 'dom' || !game.variants) return;
    const ids = game.variants.map((v) => v.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const v of game.variants) {
      expect(v.id).toMatch(/^[a-z0-9-]+$/);
      expect(v.label.trim()).not.toBe('');
    }
  });

  it('has a coherent personal-best config', () => {
    const best = game.best;
    if (best === null) return;
    expect(best.label.trim()).not.toBe('');
    expect(['points', 'duration', 'racetime', 'count']).toContain(best.format);
    expect(['higher', 'lower']).toContain(best.direction);
    if (best.format === 'duration' || best.format === 'racetime') expect(best.direction).toBe('lower');
    if (best.format === 'points') expect(best.direction).toBe('higher');
    if (best.unit !== undefined) expect(best.format).toBe('count');
  });

  it('ships no placeholder stubs (completion gate)', () => {
    const stubs = filesUnder(join(GAMES_DIR, id))
      .filter((file) => readFileSync(file, 'utf8').includes('PLACEHOLDER-STUB'))
      .map((file) => relative(ROOT, file).replaceAll('\\', '/'));
    expect(stubs, 'files still containing PLACEHOLDER-STUB').toEqual([]);
  });
});

describe('catalogue-wide rules', () => {
  it('lists every id once, in GAME_IDS order', () => {
    expect(GAMES.map((g) => g.id)).toEqual([...GAME_IDS]);
  });

  it('has no loaders, content or meta files for unknown games', () => {
    const ids = new Set<string>(GAME_IDS);
    for (const key of Object.keys(CANVAS_LOADERS)) expect(ids.has(key), key).toBe(true);
    for (const key of Object.keys(DOM_LOADERS)) expect(ids.has(key), key).toBe(true);
    for (const key of Object.keys(GAME_CONTENT)) expect(ids.has(key), key).toBe(true);
    for (const folder of META_FOLDERS) expect(ids.has(folder), `src/games/${folder}/meta.ts`).toBe(true);
  });

  it('uses unique names, page titles and meta descriptions', () => {
    const unique = (values: string[]) => new Set(values.map((v) => v.trim().toLowerCase())).size === values.length;
    expect(unique(GAMES.map((g) => g.name))).toBe(true);
    expect(unique(GAME_IDS.map((id) => GAME_CONTENT[id].metaTitle))).toBe(true);
    expect(unique(GAME_IDS.map((id) => GAME_CONTENT[id].metaDescription))).toBe(true);
  });

  it('has at least one game in every category, and unique category slugs', () => {
    expect(CATEGORIES.map((c) => c.id)).toEqual([...CATEGORY_IDS]);
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(CATEGORIES.length);
    for (const c of CATEGORIES) {
      expect(c.slug).toMatch(/^[a-z0-9-]+$/);
      expect(gamesInCategory(c.id).length, c.id).toBeGreaterThan(0);
    }
  });

  it('has featured games for the homepage', () => {
    expect(GAMES.some((g) => g.featured)).toBe(true);
  });
});

describe('gamesInCategory()', () => {
  it('returns exactly the games tagged with the category, in catalogue order', () => {
    for (const c of CATEGORY_IDS) {
      const expected = GAMES.filter((g) => g.categories.includes(c)).map((g) => g.id);
      expect(gamesInCategory(c).map((g) => g.id)).toEqual(expected);
    }
  });

  it('covers every game through its primary category', () => {
    const covered = new Set(CATEGORY_IDS.flatMap((c: GameCategory) => gamesInCategory(c).map((g) => g.id)));
    expect(covered.size).toBe(GAME_IDS.length);
  });
});

describe('relatedGames()', () => {
  it('never includes the game itself or duplicates, and respects the limit', () => {
    for (const id of GAME_IDS) {
      const related = relatedGames(id, 6).map((g) => g.id);
      expect(related).not.toContain(id);
      expect(new Set(related).size).toBe(related.length);
      expect(related.length).toBe(Math.min(6, GAME_IDS.length - 1));
    }
    expect(relatedGames('neon-dash', 2)).toHaveLength(2);
  });

  it('lists games sharing the primary category first', () => {
    for (const id of GAME_IDS) {
      const primary = getGame(id).categories[0];
      const related = relatedGames(id, GAME_IDS.length);
      const samePrimary = related.filter((g) => g.categories[0] === primary);
      expect(related.slice(0, samePrimary.length)).toEqual(samePrimary);
    }
  });

  it('can return the whole catalogue except the game itself', () => {
    expect(relatedGames('sudoku', 100)).toHaveLength(GAME_IDS.length - 1);
  });
});
