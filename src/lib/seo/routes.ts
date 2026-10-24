import { GAMES, gamePath } from '@/config/games';
import { siteConfig } from '@/config/site';
import { GUIDES } from '@/content/guides';

export interface SiteRoute {
  path: string;
  /**
   * YYYY-MM-DD the page content last changed meaningfully. Google only uses
   * lastmod when it is consistently accurate, so update it with real edits.
   * (changefreq and priority are ignored by Google and therefore omitted.)
   */
  lastModified: string;
}

/** The single list of indexable pages, used by sitemap.xml (and tests). */
export function getSiteRoutes(): SiteRoute[] {
  const launch = '2026-10-24';
  return [
    { path: '/', lastModified: launch },
    { path: '/games/', lastModified: launch },
    ...GAMES.map((g) => ({ path: gamePath(g.id), lastModified: g.added })),
    // The challenge content changes daily (computed in the browser); the page itself is stable.
    { path: '/daily-challenge/', lastModified: launch },
    { path: '/guides/', lastModified: launch },
    ...GUIDES.map((g) => ({ path: `/guides/${g.slug}/`, lastModified: g.updated })),
    { path: '/about/', lastModified: launch },
    { path: '/contact/', lastModified: launch },
    { path: '/privacy/', lastModified: siteConfig.legalLastUpdated },
    { path: '/terms/', lastModified: siteConfig.legalLastUpdated },
  ];
}
