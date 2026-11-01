import Script from 'next/script';
import { adsConfig } from '@/config/integrations';

export function AdSenseScript() {
  if (!adsConfig.publisherId) return null;
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.publisherId}`}
      strategy="beforeInteractive"
      crossOrigin="anonymous"
    />
  );
}
