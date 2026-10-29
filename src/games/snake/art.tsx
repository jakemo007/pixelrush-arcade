import type { GameArtBodyProps } from '@/components/games/GameArt';

export function Art({ s }: GameArtBodyProps) {
  const body = 'M30 150 H110 V70 H190 V110 H246';
  return (
    <>
      <defs>
        <linearGradient id={`sn-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1430" />
          <stop offset="1" stopColor="#040713" />
        </linearGradient>
        <linearGradient id={`sn-body-${s}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1aa9c9" />
          <stop offset="1" stopColor="#4dffb5" />
        </linearGradient>
        <radialGradient id={`sn-fruit-${s}`} cx="0.38" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#ff9be8" />
          <stop offset="1" stopColor="#ff4fd8" />
        </radialGradient>
        <radialGradient id={`sn-halo-${s}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff4fd8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff4fd8" stopOpacity="0" />
        </radialGradient>
        <pattern id={`sn-grid-${s}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#4dffb5" strokeOpacity="0.09" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="320" height="200" fill={`url(#sn-bg-${s})`} />
      <rect width="320" height="200" fill={`url(#sn-grid-${s})`} />
      <rect x="4" y="4" width="312" height="192" rx="6" fill="none" stroke="#4dffb5" strokeOpacity="0.35" strokeWidth="2" />

      <circle cx="280" cy="110" r="30" fill={`url(#sn-halo-${s})`} />
      <circle cx="280" cy="110" r="10" fill={`url(#sn-fruit-${s})`} />
      <ellipse cx="285" cy="98" rx="6" ry="3" transform="rotate(-28 285 98)" fill="#4dffb5" />

      <path d={body} fill="none" stroke="#4dffb5" strokeOpacity="0.18" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round" />
      <path d={body} fill="none" stroke={`url(#sn-body-${s})`} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={body}
        fill="none"
        stroke="#04121c"
        strokeOpacity="0.35"
        strokeWidth="16"
        strokeDasharray="2 18"
        strokeDashoffset="-9"
      />

      <rect x="236" y="100" width="22" height="20" rx="7" fill="#c9fff0" />
      <circle cx="251" cy="105" r="2.6" fill="#04121c" />
      <circle cx="251" cy="115" r="2.6" fill="#04121c" />

      <g fill="#ff9be8">
        <circle cx="262" cy="132" r="1.6" />
        <circle cx="300" cy="88" r="1.3" />
        <circle cx="304" cy="128" r="1.1" />
      </g>
    </>
  );
}
