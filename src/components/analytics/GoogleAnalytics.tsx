import Script from 'next/script';
import { analyticsConfig } from '@/config/integrations';

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
