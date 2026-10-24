/**
 * Central brand and identity configuration.
 *
 * Rename the site, change the tagline or add social profiles here; every page,
 * metadata tag and the web manifest read from this object.
 *
 * Items marked LAUNCH-REQUIRED must be completed by the operator before a
 * public launch. `npm run check:launch` reports which ones are still missing.
 */

export interface SocialLink {
  /** Visible label, e.g. "YouTube". */
  label: string;
  /** Full https:// URL of a profile you control. */
  href: string;
}

const EMAIL_PATTERN = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/;

/** Returns the address only if it looks like a real email address. */
export function normalizeContactEmail(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  return EMAIL_PATTERN.test(trimmed) ? trimmed : '';
}

export const siteConfig = {
  name: 'PixelRush Arcade',
  shortName: 'PixelRush',
  tagline: 'Original arcade games. Instant play, no sign-up.',
  description:
    'Play free, original browser arcade games on PixelRush Arcade: an endless runner, a brick breaker and a space survival shooter that start instantly on desktop, tablet and mobile.',
  locale: 'en_US',
  language: 'en',
  /** Browser UI color on mobile; matches --color-bg in globals.css. */
  themeColor: '#0a0d1a',

  /**
   * LAUNCH-REQUIRED: public contact address. Set NEXT_PUBLIC_CONTACT_EMAIL
   * (see .env.example). While empty, /contact explains that no address has
   * been published yet instead of showing a fake one.
   */
  contactEmail: normalizeContactEmail(process.env.NEXT_PUBLIC_CONTACT_EMAIL),

  /**
   * LAUNCH-REQUIRED (legal pages): the person or business operating the site,
   * shown in the privacy policy and terms. Leave empty until decided.
   */
  operatorName: '',

  /**
   * Optional social profiles. Only add accounts that exist and that you
   * control, e.g. { label: 'YouTube', href: 'https://www.youtube.com/@yourchannel' }.
   */
  social: [] as SocialLink[],

  /** Date the legal/starter pages were last revised (YYYY-MM-DD). */
  legalLastUpdated: '2026-10-24',

  /**
   * LAUNCH-REQUIRED: set to true only after you (ideally with legal advice)
   * have reviewed and completed /privacy and /terms. While false, those pages
   * show visible "operator review required" notes.
   */
  legalPagesReviewed: false,
} as const;

export type SiteConfig = typeof siteConfig;
