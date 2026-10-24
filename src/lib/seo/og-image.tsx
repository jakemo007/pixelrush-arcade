import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

export const OG_SIZE = { width: 1200, height: 630 };

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38e8ff"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><rect x="2" y="2" width="60" height="60" rx="14" fill="url(#g)"/><path d="M27 18 L47 32 L27 46 Z" fill="#0a0d1a"/><rect x="11" y="22" width="11" height="4.5" rx="2.25" fill="#0a0d1a"/><rect x="8" y="29.75" width="14" height="4.5" rx="2.25" fill="#0a0d1a"/><rect x="11" y="37.5" width="11" height="4.5" rx="2.25" fill="#0a0d1a"/></svg>`;
const LOGO_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString('base64')}`;

const ACCENTS = { cyan: '#38e8ff', violet: '#a78bfa', magenta: '#ff5bdc' } as const;

/** Renders a branded 1200x630 social preview image at build time. */
export function renderOgImage({ title, subtitle, accent = 'cyan' }: { title: string; subtitle: string; accent?: keyof typeof ACCENTS }) {
  const color = ACCENTS[accent];
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #0a0d1a 0%, #141a3a 60%, #1e1048 100%)',
          color: '#eef1ff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={LOGO_DATA_URI} width={84} height={84} />
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 800 }}>
            <span>PixelRush</span>
            <span style={{ color: '#38e8ff', marginLeft: 12 }}>Arcade</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', width: 120, height: 10, borderRadius: 5, background: color }} />
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
          <div style={{ display: 'flex', fontSize: 36, color: '#b0b8dc', maxWidth: 980 }}>{subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, color: '#8f97c0' }}>
          <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 4, background: '#38e8ff' }} />
          <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 4, background: '#a78bfa' }} />
          <div style={{ display: 'flex', width: 18, height: 18, borderRadius: 4, background: '#ff5bdc' }} />
          <span style={{ marginLeft: 8 }}>{siteConfig.tagline}</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
