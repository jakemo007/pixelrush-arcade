import type { GameArtBodyProps } from '@/components/games/GameArt';

export function Art({ s }: GameArtBodyProps) {
  const road = 'M-20 168 C 70 168, 130 160, 180 120 S 250 40, 340 36';
  return (
    <>
      <defs>
        <linearGradient id={`cr-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070a18" />
          <stop offset="1" stopColor="#05070f" />
        </linearGradient>
        <linearGradient id={`cr-car-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#cr-bg-${s})`} />
      <g stroke="#a78bfa" strokeOpacity="0.08">
        {[40, 100, 160, 220, 280].map((x) => (
          <line key={x} x1={x} y1="0" x2={x - 30} y2="200" />
        ))}
      </g>
      <path d={road} fill="none" stroke="#a78bfa" strokeWidth="98" strokeLinecap="round" />
      <path d={road} fill="none" stroke="#0b2a22" strokeWidth="94" strokeLinecap="round" />
      <path d={road} fill="none" stroke="#eef2ff" strokeWidth="56" />
      <path d={road} fill="none" stroke="#ff4d6d" strokeWidth="56" strokeDasharray="10 10" />
      <path d={road} fill="none" stroke="#1c2035" strokeWidth="48" />
      <path d={road} fill="none" stroke="#eef2ff" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="12 16" />
      <g transform="translate(62 167)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <rect x="0" y={-24 + i * 8} width="4" height="4" fill={i % 2 ? '#0b0e20' : '#eef2ff'} />
            <rect x="0" y={-20 + i * 8} width="4" height="4" fill={i % 2 ? '#eef2ff' : '#0b0e20'} />
            <rect x="4" y={-24 + i * 8} width="4" height="4" fill={i % 2 ? '#eef2ff' : '#0b0e20'} />
            <rect x="4" y={-20 + i * 8} width="4" height="4" fill={i % 2 ? '#0b0e20' : '#eef2ff'} />
          </g>
        ))}
      </g>
      <g transform="translate(206 92) rotate(-38)" opacity="0.4">
        <rect x="-15" y="-8" width="30" height="16" rx="5" fill="#c9d4ff" />
        <rect x="-4" y="-5" width="11" height="10" rx="3" fill="#070a18" />
      </g>
      <g transform="translate(150 140) rotate(-30)">
        <rect x="-17" y="-9" width="34" height="18" rx="6" fill={`url(#cr-car-${s})`} />
        <rect x="-5" y="-6" width="12" height="12" rx="3" fill="#070a18" opacity="0.85" />
        <rect x="5" y="-5" width="3" height="10" rx="1.5" fill="#38e8ff" opacity="0.8" />
        <rect x="14" y="-7" width="2" height="4" fill="#ffffff" />
        <rect x="14" y="3" width="2" height="4" fill="#ffffff" />
        <rect x="-17" y="-7" width="2" height="4" fill="#ff4d6d" />
        <rect x="-17" y="3" width="2" height="4" fill="#ff4d6d" />
      </g>
      <g fill="#000" opacity="0.35">
        <rect x="118" y="153" width="4" height="4" />
        <rect x="110" y="157" width="4" height="4" />
        <rect x="124" y="164" width="4" height="4" />
        <rect x="116" y="168" width="4" height="4" />
      </g>
      <rect x="236" y="138" width="74" height="48" rx="8" fill="#070a18" fillOpacity="0.85" stroke="#a78bfa" strokeOpacity="0.6" />
      <path
        d="M248 176 C 252 160, 262 150, 270 152 S 284 166, 292 158 S 300 144, 296 148"
        fill="none"
        stroke="#eef2ff"
        strokeOpacity="0.6"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="270" cy="152" r="3" fill="#ffd23f" />
      <text x="16" y="24" fontSize="13" fontWeight="800" fill="#ffd23f" fontFamily="system-ui, sans-serif">
        LAP 2/3
      </text>
      <text x="16" y="44" fontSize="17" fontWeight="800" fill="#eef2ff" fontFamily="system-ui, sans-serif">
        0:31.42
      </text>
    </>
  );
}
