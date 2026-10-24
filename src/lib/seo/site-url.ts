/**
 * Resolves the canonical origin used for canonical tags, Open Graph URLs,
 * the sitemap and robots.txt.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL           (set this for your real domain)
 *   2. VERCEL_PROJECT_PRODUCTION_URL  (provided automatically by Vercel builds)
 *   3. http://localhost:3000          (local development only)
 *
 * The site never guesses a custom domain: an unverified domain must not be
 * used as the canonical origin.
 */

export type SiteUrlSource = 'NEXT_PUBLIC_SITE_URL' | 'VERCEL_PROJECT_PRODUCTION_URL' | 'fallback';

export interface ResolvedSiteUrl {
  /** Origin without a trailing slash, e.g. https://www.example.com */
  origin: string;
  source: SiteUrlSource;
}

export const FALLBACK_SITE_URL = 'http://localhost:3000';

function normalizeOrigin(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    // Keep only the origin; paths, queries and hashes are not meaningful here.
    return url.origin;
  } catch {
    return null;
  }
}

export function resolveSiteUrl(env: {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
}): ResolvedSiteUrl {
  const explicit = normalizeOrigin(env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return { origin: explicit, source: 'NEXT_PUBLIC_SITE_URL' };

  const vercel = normalizeOrigin(env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) return { origin: vercel, source: 'VERCEL_PROJECT_PRODUCTION_URL' };

  return { origin: FALLBACK_SITE_URL, source: 'fallback' };
}

/** Resolved once per build. Only meaningful in server code (metadata, sitemap). */
export const siteUrl = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
});

/**
 * Builds an absolute URL for a site path. Paths are normalized to end with a
 * slash to match `trailingSlash: true`, so each page has exactly one URL.
 */
export function absoluteUrl(path: string, origin: string = siteUrl.origin): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const isFile = /\.[a-z0-9]+$/i.test(clean);
  const normalized = isFile || clean.endsWith('/') ? clean : `${clean}/`;
  return `${origin}${normalized}`;
}
