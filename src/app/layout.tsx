import type { Metadata, Viewport } from 'next';
import { AdSenseScript } from '@/components/advertising/AdSenseScript';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { siteConfig } from '@/config/site';
import { DEFAULT_OG_IMAGE } from '@/lib/seo/metadata';
import { siteUrl } from '@/lib/seo/site-url';
import './globals.css';

if (process.env.NODE_ENV === 'production' && siteUrl.source === 'fallback') {
  // Printed during `next build`: canonical URLs would point at localhost.
  console.warn(
    '\n[pixelrush] NEXT_PUBLIC_SITE_URL is not set, so canonical URLs and the sitemap use http://localhost:3000.\n' +
      '            Set it to your real domain before deploying (see docs/DEPLOYMENT.md).\n',
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl.origin),
  title: {
    default: `${siteConfig.name}: Free Original Browser Arcade Games`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    images: [{ url: DEFAULT_OG_IMAGE.path, width: 1200, height: 630, alt: DEFAULT_OG_IMAGE.alt, type: 'image/png' }],
  },
  twitter: { card: 'summary_large_image', images: [{ url: DEFAULT_OG_IMAGE.path, alt: DEFAULT_OG_IMAGE.alt }] },
  icons: { apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }] },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: siteConfig.themeColor,
  colorScheme: 'dark',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={siteConfig.language}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <GoogleAnalytics />
        <AdSenseScript />
      </body>
    </html>
  );
}
