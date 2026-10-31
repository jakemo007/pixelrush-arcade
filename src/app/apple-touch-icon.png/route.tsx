import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #38e8ff, #a78bfa)',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path d="M27 18 L47 32 L27 46 Z" fill="#0a0d1a" />
          <rect x="11" y="22" width="11" height="4.5" rx="2.25" fill="#0a0d1a" />
          <rect x="8" y="29.75" width="14" height="4.5" rx="2.25" fill="#0a0d1a" />
          <rect x="11" y="37.5" width="11" height="4.5" rx="2.25" fill="#0a0d1a" />
        </svg>
      </div>
    ),
    { width: 180, height: 180 },
  );
}
