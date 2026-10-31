import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { absoluteUrl } from './site-url';

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  type?: 'website' | 'article';
  image?: { path: string; alt: string };
}

export const DEFAULT_OG_IMAGE = { path: '/og/site.png', alt: `${siteConfig.name}: free original browser arcade games` };

export function pageMetadata({ title, description, path, absoluteTitle, type = 'website', image = DEFAULT_OG_IMAGE }: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [{ url: image.path, width: 1200, height: 630, alt: image.alt, type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [{ url: image.path, alt: image.alt }],
    },
  };
}
