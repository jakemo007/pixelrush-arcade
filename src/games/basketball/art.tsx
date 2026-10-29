import type { GameArtBodyProps } from '@/components/games/GameArt';

export function Art({ s }: GameArtBodyProps) {
  const arc = [
    [84, 118],
    [104, 92],
    [126, 72],
    [150, 58],
    [176, 51],
    [202, 52],
    [226, 60],
  ];
  return (
    <>
      <defs>
        <linearGradient id={`hp-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0e2b" />
          <stop offset="1" stopColor="#05060f" />
        </linearGradient>
        <linearGradient id={`hp-floor-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1846" />
          <stop offset="1" stopColor="#120a24" />
        </linearGradient>
        <radialGradient id={`hp-ball-${s}`} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffc08a" />
          <stop offset="1" stopColor="#e8641c" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#hp-bg-${s})`} />
      <g opacity="0.5">
        {[0, 1, 2].map((row) =>
          Array.from({ length: 16 }, (_, i) => (
            <circle
              key={`${row}-${i}`}
              cx={8 + i * 20 + (row % 2) * 10}
              cy={92 + row * 14}
              r="4"
              fill={['#a78bfa', '#38e8ff', '#ff4fd8'][(i + row) % 3]}
              opacity="0.3"
            />
          )),
        )}
      </g>
      <line x1="0" y1="134" x2="320" y2="134" stroke="#a78bfa" strokeOpacity="0.45" strokeWidth="1.5" />
      <rect y="168" width="320" height="32" fill={`url(#hp-floor-${s})`} />
      <line x1="0" y1="168" x2="320" y2="168" stroke="#a78bfa" strokeWidth="2.5" />
      <line x1="120" y1="168" x2="120" y2="182" stroke="#38e8ff" strokeWidth="2" />
      <rect x="296" y="40" width="7" height="128" fill="#1b2148" />
      <rect x="276" y="52" width="6" height="56" fill="#c8dcff" fillOpacity="0.2" stroke="#eef2ff" strokeWidth="1.5" />
      <rect x="276" y="76" width="6" height="18" fill="none" stroke="#ff4d6d" strokeWidth="1.5" />
      <g stroke="#eef2ff" strokeOpacity="0.75" strokeWidth="1">
        <path d="M244 100 L250 124 M252 100 L254 124 M260 100 L258 124 M268 100 L262 124 M250 124 L262 124 M246 110 L266 110" />
      </g>
      <line x1="242" y1="100" x2="276" y2="100" stroke="#ff8a3d" strokeWidth="3.5" strokeLinecap="round" />
      <g fill="#ffd23f">
        {arc.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" opacity={0.35 + i * 0.08} />
        ))}
      </g>
      <circle cx="244" cy="74" r="8" fill={`url(#hp-ball-${s})`} />
      <path d="M236 74 H252 M244 66 V82" stroke="#3a1400" strokeOpacity="0.6" strokeWidth="1" />
      <g stroke="#38e8ff" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M66 168 L72 146 L78 168 M72 146 L71 126 M71 130 L80 114" />
      </g>
      <circle cx="70" cy="119" r="5" fill="#38e8ff" />
      <text x="16" y="28" fontSize="22" fontWeight="900" fill="#eef2ff" fontFamily="system-ui, sans-serif">
        0:42
      </text>
      <text x="16" y="46" fontSize="11" fontWeight="800" fill="#ffd23f" fontFamily="system-ui, sans-serif">
        STREAK x2
      </text>
      <text x="236" y="40" fontSize="12" fontWeight="900" fill="#4dffb5" fontFamily="system-ui, sans-serif">
        SWISH +3
      </text>
    </>
  );
}
