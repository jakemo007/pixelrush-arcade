import { siteConfig } from '@/config/site';

/** Brand mark: a play arrow with speed lines. Matches src/app/icon.svg. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38e8ff" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#logo-gradient)" />
      <path d="M27 18 L47 32 L27 46 Z" fill="#0a0d1a" />
      <rect x="11" y="22" width="11" height="4.5" rx="2.25" fill="#0a0d1a" />
      <rect x="8" y="29.75" width="14" height="4.5" rx="2.25" fill="#0a0d1a" />
      <rect x="11" y="37.5" width="11" height="4.5" rx="2.25" fill="#0a0d1a" />
    </svg>
  );
}

export function LogoWordmark() {
  const [first, ...rest] = siteConfig.name.split(' ');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      <LogoMark />
      <span style={{ fontWeight: 850, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
        {first}
        {rest.length > 0 && <span style={{ color: 'var(--color-cyan)' }}> {rest.join(' ')}</span>}
      </span>
    </span>
  );
}
