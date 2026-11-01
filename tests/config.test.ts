import { describe, expect, it } from 'vitest';
import { GAMES, GAME_IDS, gamePath, getGame, isGameId } from '@/config/games';
import { adsConfig, analyticsConfig, resolveAdsConfig, resolveAnalyticsConfig } from '@/config/integrations';
import { normalizeContactEmail } from '@/config/site';
import { absoluteUrl, FALLBACK_SITE_URL, resolveSiteUrl } from '@/lib/seo/site-url';

const VALID_CLIENT = 'ca-pub-1234567890123456';

describe('advertising configuration', () => {
  it('is disabled with no configuration', () => {
    const ads = resolveAdsConfig({});
    expect(ads.enabled).toBe(false);
    expect(ads.publisherId).toBeNull();
    expect(ads.clientId).toBeNull();
    expect(ads.slots).toEqual({ 'game-page': null, 'content-page': null });
  });

  it('is disabled in this test environment (no env vars set)', () => {
    expect(adsConfig.enabled).toBe(false);
    expect(analyticsConfig.enabled).toBe(false);
  });

  it('stays disabled unless the flag is exactly "true"', () => {
    for (const flag of ['', 'false', '1', 'yes', 'TRUE ']) {
      const ads = resolveAdsConfig({ NEXT_PUBLIC_ADS_ENABLED: flag, NEXT_PUBLIC_ADSENSE_CLIENT_ID: VALID_CLIENT });
      expect(ads.enabled).toBe(flag.trim().toLowerCase() === 'true');
    }
  });

  it('stays disabled with a missing or malformed publisher ID', () => {
    for (const id of ['', 'pub-1234567890123456', 'ca-pub-123', 'ca-pub-XXXXXXXXXXXXXXXX']) {
      const ads = resolveAdsConfig({ NEXT_PUBLIC_ADS_ENABLED: 'true', NEXT_PUBLIC_ADSENSE_CLIENT_ID: id });
      expect(ads.enabled).toBe(false);
      expect(ads.publisherId).toBeNull();
      expect(ads.problems.length).toBeGreaterThan(0);
    }
  });

  it('keeps a valid publisher ID for the AdSense loader while ads stay disabled', () => {
    for (const flag of [undefined, '', 'false']) {
      const ads = resolveAdsConfig({
        NEXT_PUBLIC_ADS_ENABLED: flag,
        NEXT_PUBLIC_ADSENSE_CLIENT_ID: ` ${VALID_CLIENT} `,
        NEXT_PUBLIC_ADSENSE_SLOT_GAME_PAGE: '1234567890',
        NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_PAGE: '1234567890',
      });
      expect(ads.publisherId).toBe(VALID_CLIENT);
      expect(ads.enabled).toBe(false);
      expect(ads.clientId).toBeNull();
      expect(ads.slots).toEqual({ 'game-page': null, 'content-page': null });
    }
  });

  it('enables only valid slots once properly configured', () => {
    const ads = resolveAdsConfig({
      NEXT_PUBLIC_ADS_ENABLED: 'true',
      NEXT_PUBLIC_ADSENSE_CLIENT_ID: VALID_CLIENT,
      NEXT_PUBLIC_ADSENSE_SLOT_GAME_PAGE: '1234567890',
      NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_PAGE: 'not-a-slot',
    });
    expect(ads.enabled).toBe(true);
    expect(ads.clientId).toBe(VALID_CLIENT);
    expect(ads.slots['game-page']).toBe('1234567890');
    expect(ads.slots['content-page']).toBeNull();
  });
});

describe('analytics configuration', () => {
  it('is disabled without a valid measurement ID', () => {
    expect(resolveAnalyticsConfig({}).enabled).toBe(false);
    expect(resolveAnalyticsConfig({ NEXT_PUBLIC_GA_ID: 'UA-12345-1' }).enabled).toBe(false);
  });

  it('defaults consent to denied', () => {
    const ga = resolveAnalyticsConfig({ NEXT_PUBLIC_GA_ID: 'G-ABC123XYZ' });
    expect(ga).toEqual({ enabled: true, measurementId: 'G-ABC123XYZ', consentDefault: 'denied' });
    expect(resolveAnalyticsConfig({ NEXT_PUBLIC_GA_ID: 'G-ABC123XYZ', NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT: 'maybe' }).consentDefault).toBe('denied');
    expect(resolveAnalyticsConfig({ NEXT_PUBLIC_GA_ID: 'G-ABC123XYZ', NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT: 'granted' }).consentDefault).toBe('granted');
  });
});

describe('site URL', () => {
  it('prefers the explicit URL, then Vercel, then localhost', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://www.example.com/', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' })).toEqual({
      origin: 'https://www.example.com',
      source: 'NEXT_PUBLIC_SITE_URL',
    });
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'pixelrush.vercel.app' })).toEqual({
      origin: 'https://pixelrush.vercel.app',
      source: 'VERCEL_PROJECT_PRODUCTION_URL',
    });
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'not a url' })).toEqual({ origin: FALLBACK_SITE_URL, source: 'fallback' });
    expect(resolveSiteUrl({})).toEqual({ origin: FALLBACK_SITE_URL, source: 'fallback' });
  });

  it('builds one canonical form per page (trailing slash)', () => {
    expect(absoluteUrl('/', 'https://a.com')).toBe('https://a.com/');
    expect(absoluteUrl('/games/neon-dash', 'https://a.com')).toBe('https://a.com/games/neon-dash/');
    expect(absoluteUrl('games/neon-dash/', 'https://a.com')).toBe('https://a.com/games/neon-dash/');
    expect(absoluteUrl('/sitemap.xml', 'https://a.com')).toBe('https://a.com/sitemap.xml');
  });
});

describe('site and catalogue config', () => {
  it('only accepts real-looking contact emails', () => {
    expect(normalizeContactEmail(undefined)).toBe('');
    expect(normalizeContactEmail('  ')).toBe('');
    expect(normalizeContactEmail('nope')).toBe('');
    expect(normalizeContactEmail(' hello@example.org ')).toBe('hello@example.org');
  });

  it('lists every game exactly once with valid paths', () => {
    expect(GAMES.map((g) => g.id)).toEqual([...GAME_IDS]);
    for (const id of GAME_IDS) {
      expect(isGameId(id)).toBe(true);
      expect(getGame(id).id).toBe(id);
      expect(gamePath(id)).toBe(`/games/${id}/`);
    }
    expect(isGameId('pong')).toBe(false);
  });
});
