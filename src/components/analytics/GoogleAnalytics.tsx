import Script from 'next/script';
import { analyticsConfig } from '@/config/integrations';

/**
 * Optional Google Analytics 4. Renders nothing unless NEXT_PUBLIC_GA_ID is a
 * valid measurement ID.
 *
 * Google consent mode defaults are set BEFORE the tag loads. The default is
 * "denied" for all storage types (configurable via
 * NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT). With "denied", no analytics or ad
 * cookies are set until a consent management platform (CMP) updates consent
 * with gtag('consent', 'update', ...). No CMP is bundled: see
 * docs/MONETIZATION.md before enabling analytics for visitors in regions that
 * require prior consent.
 *
 * The measurement ID and consent value are validated by regex in
 * src/config/integrations.ts, so interpolating them below is safe.
 */
export function GoogleAnalytics() {
  if (!analyticsConfig.enabled || !analyticsConfig.measurementId) return null;
  const id = analyticsConfig.measurementId;
  const consent = analyticsConfig.consentDefault;
  const init = [
    'window.dataLayer=window.dataLayer||[];',
    'function gtag(){dataLayer.push(arguments);}',
    `gtag('consent','default',{ad_storage:'${consent}',ad_user_data:'${consent}',ad_personalization:'${consent}',analytics_storage:'${consent}'});`,
    "gtag('js',new Date());",
    `gtag('config','${id}');`,
  ].join('');

  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {init}
      </Script>
      <Script id="ga-tag" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
    </>
  );
}
