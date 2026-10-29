import type { GameArtBodyProps } from '@/components/games/GameArt';

const ROWS = [
  { x: 34, keys: 10 },
  { x: 42, keys: 9 },
  { x: 54, keys: 7 },
];

export function Art({ s }: GameArtBodyProps) {
  return (
    <>
      <defs>
        <linearGradient id={`ts-bg-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#081a33" />
          <stop offset="1" stopColor="#060818" />
        </linearGradient>
        <linearGradient id={`ts-key-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#252b62" />
          <stop offset="1" stopColor="#171b45" />
        </linearGradient>
        <linearGradient id={`ts-gauge-${s}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4dffb5" />
          <stop offset="0.6" stopColor="#38e8ff" />
          <stop offset="1" stopColor="#ff4fd8" />
        </linearGradient>
        <radialGradient id={`ts-glow-${s}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#38e8ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#38e8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#ts-bg-${s})`} />

      <rect x="20" y="22" width="196" height="46" rx="10" fill="#0b0f26" stroke="#38e8ff" strokeOpacity="0.45" />
      <g fontFamily="ui-monospace, Menlo, Consolas, monospace" fontSize="15" fontWeight="700">
        <text x="32" y="50" fill="#eef1ff">
          type
        </text>
        <rect x="76" y="36" width="10" height="19" rx="2" fill="#ff4d6d" opacity="0.3" />
        <text x="77" y="50" fill="#ff9fb2">
          f
        </text>
        <text x="86" y="50" fill="#eef1ff">
          ast
        </text>
        <rect x="113" y="35" width="2.5" height="21" rx="1" fill="#38e8ff" />
        <text x="122" y="50" fill="#7880b0">
          and on
        </text>
      </g>

      <circle cx="268" cy="62" r="46" fill={`url(#ts-glow-${s})`} />
      <path d="M234 78a36 36 0 0 1 68 0" fill="none" stroke="#1e2448" strokeWidth="9" strokeLinecap="round" />
      <path d="M234 78a36 36 0 0 1 60 -20" fill="none" stroke={`url(#ts-gauge-${s})`} strokeWidth="9" strokeLinecap="round" />
      <path d="M268 72l20 -24" stroke="#eef1ff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="268" cy="72" r="5" fill="#eef1ff" />
      <text x="268" y="98" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="12" fill="#38e8ff" letterSpacing="1.5">
        WPM
      </text>

      <rect x="22" y="100" width="276" height="88" rx="12" fill="#0b0f26" stroke="#38e8ff" strokeOpacity="0.25" />
      {ROWS.map((row, r) =>
        Array.from({ length: row.keys }, (_, k) => {
          const x = row.x + k * 25.5;
          const y = 110 + r * 20;
          const lit = (r === 1 && k === 3) || (r === 0 && k === 6);
          return <rect key={`${r}-${k}`} x={x} y={y} width="21" height="16" rx="3.5" fill={lit ? '#38e8ff' : `url(#ts-key-${s})`} />;
        }),
      )}
      <rect x="96" y="170" width="128" height="12" rx="3.5" fill={`url(#ts-key-${s})`} />
      <g fill="#38e8ff" opacity="0.6">
        <circle cx="129" cy="104" r="1.5" />
        <circle cx="134" cy="99" r="1.1" />
      </g>
    </>
  );
}
