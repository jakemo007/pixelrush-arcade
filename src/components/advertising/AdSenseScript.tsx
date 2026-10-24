import { adsConfig } from '@/config/integrations';

/**
 * Loads the Google AdSense library, but ONLY when ads are explicitly enabled
 * (NEXT_PUBLIC_ADS_ENABLED=true) with a valid publisher ID. Otherwise this
 * renders nothing and no Google ad code is requested.
 *
 * Before enabling: read docs/MONETIZATION.md (approval, consent management,
 * privacy policy updates, ads.txt, placement review).
 *
 * A plain async <script> is used (React hoists it into <head>); it never
 * blocks rendering, and a slow or blocked ad script cannot affect gameplay.
 */
export function AdSenseScript() {
  if (!adsConfig.enabled || !adsConfig.clientId) return null;
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.clientId}`}
      crossOrigin="anonymous"
    />
  );
}
