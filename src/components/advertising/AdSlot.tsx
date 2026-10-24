'use client';

import { useEffect, useRef } from 'react';
import { adsConfig, type AdPlacement } from '@/config/integrations';

/**
 * A single, clearly labelled display-ad unit.
 *
 * Renders NOTHING unless ads are enabled and this placement has an approved
 * ad unit (slot) ID, so the default site has no empty ad boxes.
 *
 * Placement rules (see docs/MONETIZATION.md):
 *  - only placed in page content, separated from the game area and its
 *    controls, never over or beside the canvas;
 *  - never inside gameplay, overlays or menus;
 *  - never styled to look like site content or game buttons.
 */
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
      // An ad failing to load must never affect the page or the games.
    }
  }, [slot]);

  if (!adsConfig.enabled || !adsConfig.clientId || !slot) return null;

  return (
    // AdSense policy allows only "Advertisements" or "Sponsored Links" as labels.
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
