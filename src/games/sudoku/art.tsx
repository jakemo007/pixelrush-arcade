import type { GameArtBodyProps } from '@/components/games/GameArt';

const CELLS: [number, number, string, 'g' | 'e' | 'n'][] = [
  [0, 0, '5', 'g'],
  [0, 2, '8', 'g'],
  [0, 4, '1', 'e'],
  [1, 1, '3', 'g'],
  [1, 3, '9', 'g'],
  [1, 5, '2', 'e'],
  [2, 0, '7', 'e'],
  [2, 4, '4', 'g'],
  [3, 2, '6', 'g'],
  [3, 5, '5', 'g'],
  [4, 0, '1', 'g'],
  [4, 3, '7', 'e'],
  [5, 1, '9', 'e'],
  [5, 4, '3', 'g'],
  [2, 2, '1 9', 'n'],
  [4, 5, '4 8', 'n'],
];

export function Art({ s }: GameArtBodyProps) {
  const size = 26;
  const x0 = 82;
  const y0 = 22;
  return (
    <>
      <defs>
        <linearGradient id={`sd-bg-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b1033" />
          <stop offset="1" stopColor="#060818" />
        </linearGradient>
        <radialGradient id={`sd-glow-${s}`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#38e8ff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#38e8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#sd-bg-${s})`} />
      <circle cx="160" cy="100" r="120" fill={`url(#sd-glow-${s})`} />
      <rect x={x0} y={y0 + 2 * size} width={size * 6} height={size} fill="#38e8ff" opacity="0.08" />
      <rect x={x0 + 3 * size} y={y0} width={size} height={size * 6} fill="#38e8ff" opacity="0.08" />
      <rect x={x0 + 3 * size} y={y0 + 2 * size} width={size} height={size} fill="#38e8ff" opacity="0.32" />
      <g stroke="#94a3ff" strokeOpacity="0.28" strokeWidth="1">
        {[1, 2, 4, 5].map((i) => (
          <line key={`v${i}`} x1={x0 + i * size} y1={y0} x2={x0 + i * size} y2={y0 + 6 * size} />
        ))}
        {[1, 2, 4, 5].map((i) => (
          <line key={`h${i}`} x1={x0} y1={y0 + i * size} x2={x0 + 6 * size} y2={y0 + i * size} />
        ))}
      </g>
      <g stroke="#7f8bd6" strokeWidth="2.5">
        <line x1={x0 + 3 * size} y1={y0} x2={x0 + 3 * size} y2={y0 + 6 * size} />
        <line x1={x0} y1={y0 + 3 * size} x2={x0 + 6 * size} y2={y0 + 3 * size} />
      </g>
      <rect x={x0} y={y0} width={size * 6} height={size * 6} rx="6" fill="none" stroke="#7f8bd6" strokeWidth="3" />
      <rect x={x0 + 3 * size + 1.5} y={y0 + 2 * size + 1.5} width={size - 3} height={size - 3} rx="3" fill="none" stroke="#38e8ff" strokeWidth="2" />
      {CELLS.map(([r, c, d, kind]) => (
        <text
          key={`${r}-${c}`}
          x={x0 + c * size + size / 2}
          y={y0 + r * size + (kind === 'n' ? size / 2 + 3 : size / 2 + 6.5)}
          textAnchor="middle"
          fontSize={kind === 'n' ? 8 : 17}
          fontWeight={kind === 'g' ? 800 : 600}
          fill={kind === 'g' ? '#eef1ff' : kind === 'e' ? '#7fe9ff' : '#8f97c0'}
          fontFamily="system-ui, sans-serif"
        >
          {d}
        </text>
      ))}
      <g fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="15" textAnchor="middle">
        {['1', '2', '3'].map((d, i) => (
          <g key={d}>
            <rect x={262} y={44 + i * 40} width="32" height="32" rx="7" fill="#161b38" stroke="#94a3ff" strokeOpacity="0.35" />
            <text x={278} y={65 + i * 40} fill="#eef1ff">
              {d}
            </text>
          </g>
        ))}
        {['7', '8', '9'].map((d, i) => (
          <g key={d}>
            <rect x={26} y={44 + i * 40} width="32" height="32" rx="7" fill="#161b38" stroke="#94a3ff" strokeOpacity="0.35" />
            <text x={42} y={65 + i * 40} fill="#eef1ff">
              {d}
            </text>
          </g>
        ))}
      </g>
    </>
  );
}
