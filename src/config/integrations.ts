/**
 * Optional third-party integrations: Google Analytics and Google AdSense.
 *
 * Both are OFF unless explicitly configured. The resolve* functions are pure
 * so their "disabled by default" behaviour is unit tested
 * (tests/integrations.test.ts).
 *
 * Next.js inlines NEXT_PUBLIC_* variables only when they are referenced
 * literally (process.env.NEXT_PUBLIC_X), which is why the env objects below
 * list every variable explicitly.
 */

export type AdPlacement = 'game-page' | 'content-page';

export interface AdsConfig {
  /** True only when the flag is "true" AND the publisher ID is valid. */
  enabled: boolean;
  clientId: string | null;
  slots: Record<AdPlacement, string | null>;
  /** Human-readable reasons ads are disabled (for logs/docs, never shown to players). */
  problems: string[];
}

export interface AnalyticsConfig {
  enabled: boolean;
  measurementId: string | null;
  consentDefault: 'denied' | 'granted';
}

export interface IntegrationEnv {
  NEXT_PUBLIC_ADS_ENABLED?: string;
  NEXT_PUBLIC_ADSENSE_CLIENT_ID?: string;
  NEXT_PUBLIC_ADSENSE_SLOT_GAME_PAGE?: string;
  NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_PAGE?: string;
  NEXT_PUBLIC_GA_ID?: string;
  NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT?: string;
}

/** AdSense publisher IDs look like ca-pub- followed by 16 digits. */
export const ADSENSE_CLIENT_PATTERN = /^ca-pub-\d{16}$/;
/** AdSense ad unit (slot) IDs are numeric. */
export const ADSENSE_SLOT_PATTERN = /^\d{6,20}$/;
/** GA4 measurement IDs look like G-XXXXXXXXXX. */
export const GA_ID_PATTERN = /^G-[A-Z0-9]{4,16}$/;

function clean(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function resolveAdsConfig(env: IntegrationEnv): AdsConfig {
  const problems: string[] = [];
  const flag = clean(env.NEXT_PUBLIC_ADS_ENABLED).toLowerCase();
  const rawClient = clean(env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);
  const clientId = ADSENSE_CLIENT_PATTERN.test(rawClient) ? rawClient : null;

  if (flag !== 'true') problems.push('NEXT_PUBLIC_ADS_ENABLED is not "true".');
  if (!rawClient) problems.push('NEXT_PUBLIC_ADSENSE_CLIENT_ID is empty.');
  else if (!clientId) problems.push('NEXT_PUBLIC_ADSENSE_CLIENT_ID is not a valid ca-pub-XXXXXXXXXXXXXXXX ID.');

  const enabled = flag === 'true' && clientId !== null;

  const slot = (value: string | undefined): string | null => {
    const v = clean(value);
    return enabled && ADSENSE_SLOT_PATTERN.test(v) ? v : null;
  };

  return {
    enabled,
    clientId: enabled ? clientId : null,
    slots: {
      'game-page': slot(env.NEXT_PUBLIC_ADSENSE_SLOT_GAME_PAGE),
      'content-page': slot(env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_PAGE),
    },
    problems,
  };
}

export function resolveAnalyticsConfig(env: IntegrationEnv): AnalyticsConfig {
  const id = clean(env.NEXT_PUBLIC_GA_ID).toUpperCase();
  const measurementId = GA_ID_PATTERN.test(id) ? id : null;
  const consent = clean(env.NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT).toLowerCase();
  return {
    enabled: measurementId !== null,
    measurementId,
    // Anything other than an explicit "granted" falls back to the safer default.
    consentDefault: consent === 'granted' ? 'granted' : 'denied',
  };
}

const env: IntegrationEnv = {
  NEXT_PUBLIC_ADS_ENABLED: process.env.NEXT_PUBLIC_ADS_ENABLED,
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  NEXT_PUBLIC_ADSENSE_SLOT_GAME_PAGE: process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME_PAGE,
  NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_PAGE: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_PAGE,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT: process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT,
};

export const adsConfig = resolveAdsConfig(env);
export const analyticsConfig = resolveAnalyticsConfig(env);
