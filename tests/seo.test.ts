import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GUIDES } from '@/content/guides';
import { GUIDE_BODIES } from '@/content/guides/bodies';
import { getSiteRoutes } from '@/lib/seo/routes';

const APP_DIR = join(process.cwd(), 'src', 'app');

/** Maps a site path to the page file that renders it. */
function pageFileFor(path: string): string {
  const guide = /^\/guides\/([^/]+)\/$/.exec(path);
  if (guide) return join(APP_DIR, 'guides', '[slug]', 'page.tsx');
  const segments = path.split('/').filter(Boolean);
  return join(APP_DIR, ...segments, 'page.tsx');
}

describe('sitemap routes', () => {
  const routes = getSiteRoutes();

  it('lists each page once, with a trailing slash and a valid date', () => {
    const paths = routes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const route of routes) {
      expect(route.path.endsWith('/')).toBe(true);
      expect(route.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('only lists pages that actually exist', () => {
    for (const route of routes) expect(existsSync(pageFileFor(route.path)), route.path).toBe(true);
  });

  it('includes every guide, and every guide has an article body', () => {
    for (const guide of GUIDES) {
      expect(routes.some((r) => r.path === `/guides/${guide.slug}/`)).toBe(true);
      expect(GUIDE_BODIES[guide.slug]).toBeDefined();
    }
  });
});
