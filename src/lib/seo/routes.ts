import { CATEGORIES, GAMES, categoryPath, gamePath } from '@/config/games';
import { siteConfig } from '@/config/site';
import { GUIDES } from '@/content/guides';

export interface SiteRoute {
  path: string;
  lastModified: string;
}

export function getSiteRoutes(): SiteRoute[] {
  const launch = '2026-10-24';
  return [
    { path: '/', lastModified: launch },
    { path: '/games/', lastModified: launch },
    ...GAMES.map((g) => ({ path: gamePath(g.id), lastModified: g.added })),
    ...CATEGORIES.map((c) => ({
      path: categoryPath(c.id),
      lastModified: GAMES.filter((g) => g.categories.includes(c.id)).reduce((latest, g) => (g.added > latest ? g.added : latest), launch),
    })),
    { path: '/daily-challenge/', lastModified: launch },
    { path: '/guides/', lastModified: launch },
    ...GUIDES.map((g) => ({ path: `/guides/${g.slug}/`, lastModified: g.updated })),
    { path: '/about/', lastModified: launch },
    { path: '/contact/', lastModified: launch },
    { path: '/privacy/', lastModified: siteConfig.legalLastUpdated },
    { path: '/terms/', lastModified: siteConfig.legalLastUpdated },
  ];
}
