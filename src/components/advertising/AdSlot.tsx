'use client';

import { useEffect, useRef } from 'react';
import { adsConfig, type AdPlacement } from '@/config/integrations';

export function AdSlot({ placement }: { placement: AdPlacement }) {
  const slot = adsConfig.slots[placement];
  const requested = useRef(false);

  useEffect(() => {
    if (!adsConfig.enabled || !slot || requested.current) return;
    requested.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
    }
  }, [slot]);

  if (!adsConfig.enabled || !adsConfig.clientId || !slot) return null;

  return (
    <aside className="ad-slot" aria-label="Advertisements">
      <p className="ad-label">Advertisements</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsConfig.clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
