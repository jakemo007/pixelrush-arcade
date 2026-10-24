import type { MetadataRoute } from 'next';
import { getSiteRoutes } from '@/lib/seo/routes';
import { absoluteUrl } from '@/lib/seo/site-url';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return getSiteRoutes().map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: route.lastModified,
  }));
}
