import type { GameArtBodyProps } from '@/components/games/GameArt';

export function Art({ s }: GameArtBodyProps) {
  const star = '24,4.5 29.2,18.4 44,19 32.4,28.2 36.4,42.5 24,34.2 11.6,42.5 15.6,28.2 4,19 18.8,18.4';
  return (
    <>
      <defs>
        <linearGradient id={`mm-bg-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a1245" />
          <stop offset="1" stopColor="#070818" />
        </linearGradient>
        <linearGradient id={`mm-back-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2e2878" />
          <stop offset="1" stopColor="#161a45" />
        </linearGradient>
        <radialGradient id={`mm-front-${s}`} cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#1d2352" />
          <stop offset="1" stopColor="#0e1230" />
        </radialGradient>
        <radialGradient id={`mm-glow-${s}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd23f" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffd23f" stopOpacity="0" />
        </radialGradient>
        <pattern id={`mm-hatch-${s}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="10" fill="#ffffff" opacity="0.05" />
        </pattern>
      </defs>
      <rect width="320" height="200" fill={`url(#mm-bg-${s})`} />

      <g transform="rotate(-10 62 104)">
        <rect x="26" y="58" width="72" height="92" rx="10" fill={`url(#mm-back-${s})`} stroke="#a78bfa" strokeOpacity="0.6" />
        <rect x="26" y="58" width="72" height="92" rx="10" fill={`url(#mm-hatch-${s})`} />
        <rect x="50" y="92" width="24" height="24" rx="3" transform="rotate(45 62 104)" fill="none" stroke="#d6c8ff" strokeOpacity="0.75" strokeWidth="2" />
      </g>

      <circle cx="160" cy="100" r="80" fill={`url(#mm-glow-${s})`} />
      <g transform="rotate(-4 132 100)">
        <rect x="96" y="52" width="72" height="92" rx="10" fill={`url(#mm-front-${s})`} stroke="#4dffb5" strokeWidth="2" />
        <g transform="translate(108 74) scale(1)">
          <polygon points={star} fill="#ffd23f" />
        </g>
        <circle cx="157" cy="63" r="7" fill="#4dffb5" />
        <path d="M153.5 63.5l2.4 2.4 4.6-5.2" fill="none" stroke="#04121c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="rotate(5 192 100)">
        <rect x="156" y="54" width="72" height="92" rx="10" fill={`url(#mm-front-${s})`} stroke="#4dffb5" strokeWidth="2" />
        <g transform="translate(168 76)">
          <polygon points={star} fill="#ffd23f" />
        </g>
        <circle cx="217" cy="65" r="7" fill="#4dffb5" />
        <path d="M213.5 65.5l2.4 2.4 4.6-5.2" fill="none" stroke="#04121c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g transform="translate(262 104) skewY(-8) scale(0.45 1) translate(-36 -46)">
        <rect width="72" height="92" rx="10" fill={`url(#mm-back-${s})`} stroke="#a78bfa" strokeOpacity="0.7" />
        <rect width="72" height="92" rx="10" fill={`url(#mm-hatch-${s})`} />
      </g>
      <path d="M244 64q18 -14 36 0" fill="none" stroke="#a78bfa" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      <path d="M276 58l4 6-7 1" fill="none" stroke="#a78bfa" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}
