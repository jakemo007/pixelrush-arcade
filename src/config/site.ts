export interface SocialLink {
  label: string;
  href: string;
}

const EMAIL_PATTERN = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/;

export function normalizeContactEmail(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  return EMAIL_PATTERN.test(trimmed) ? trimmed : '';
}

export const siteConfig = {
  name: 'PixelRush Arcade',
  shortName: 'PixelRush',
  tagline: 'Original browser games. Instant play, no sign-up.',
  description:
    'Play free, original browser games on PixelRush Arcade: solitaire, sudoku, chess, word puzzles, arcade classics and sports games that start instantly on desktop, tablet and mobile.',
  locale: 'en_US',
  language: 'en',
  themeColor: '#0a0d1a',

  contactEmail: normalizeContactEmail(process.env.NEXT_PUBLIC_CONTACT_EMAIL),

  operatorName: '',

  social: [] as SocialLink[],

  legalLastUpdated: '2026-10-24',

  legalPagesReviewed: false,
} as const;

export type SiteConfig = typeof siteConfig;
