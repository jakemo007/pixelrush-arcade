import { adsConfig } from '@/config/integrations';

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
