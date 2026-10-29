import type { GameArtBodyProps } from '@/components/games/GameArt';

export function Art({ s }: GameArtBodyProps) {
  const outline = 'M30 30 H250 L290 70 V176 H30 Z';
  return (
    <>
      <defs>
        <linearGradient id={`mg-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0e2b" />
          <stop offset="1" stopColor="#05060f" />
        </linearGradient>
        <linearGradient id={`mg-green-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#11493a" />
          <stop offset="1" stopColor="#0b3027" />
        </linearGradient>
        <radialGradient id={`mg-ball-${s}`} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#cfd8ff" />
        </radialGradient>
        <clipPath id={`mg-clip-${s}`}>
          <path d={outline} />
        </clipPath>
      </defs>
      <rect width="320" height="200" fill={`url(#mg-bg-${s})`} />
      <path d={outline} fill={`url(#mg-green-${s})`} />
      <g clipPath={`url(#mg-clip-${s})`} fill="#4dffb5" opacity="0.05">
        {[30, 70, 110, 150].map((y) => (
          <rect key={y} x="0" y={y} width="320" height="20" />
        ))}
      </g>
      <rect x="150" y="118" width="70" height="40" rx="4" fill="#1c5bb0" />
      <path d="M156 132 q8 -5 16 0 t16 0 t16 0 t12 0 M156 146 q8 -5 16 0 t16 0 t16 0 t12 0" stroke="#a0dcff" strokeOpacity="0.45" fill="none" strokeWidth="1.5" />
      <path d={outline} fill="none" stroke="#38e8ff" strokeWidth="4" strokeLinejoin="round" />
      <path d={outline} fill="none" stroke="#38e8ff" strokeOpacity="0.25" strokeWidth="10" strokeLinejoin="round" />
      <g transform="rotate(25 120 86)">
        <rect x="80" y="83" width="80" height="6" rx="3" fill="#ffd23f" />
        <rect x="117" y="46" width="6" height="80" rx="3" fill="#ffd23f" />
      </g>
      <circle cx="120" cy="86" r="8" fill="#1b2148" stroke="#8c96c8" strokeWidth="2" />
      <circle cx="255" cy="140" r="11" fill="#3a0b33" stroke="#ff4fd8" strokeWidth="2.5" />
      <circle cx="255" cy="140" r="4.5" fill="none" stroke="#ff4fd8" strokeWidth="2" />
      <circle cx="232" cy="64" r="8" fill="#04110c" stroke="#eef2ff" strokeOpacity="0.7" strokeWidth="1.5" />
      <line x1="232" y1="64" x2="232" y2="34" stroke="#eef2ff" strokeWidth="2" />
      <path d="M232 34 L250 39 L232 44 Z" fill="#ffd23f" />
      <g fill="#ffd23f">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <circle key={i} cx={74 + i * 11} cy={150 - i * 6} r="2" opacity={1 - i * 0.1} />
        ))}
      </g>
      <circle cx="62" cy="157" r="11" fill="none" stroke="#ffd23f" strokeWidth="3" strokeDasharray="44 100" />
      <circle cx="62" cy="157" r="5.5" fill={`url(#mg-ball-${s})`} />
    </>
  );
}
