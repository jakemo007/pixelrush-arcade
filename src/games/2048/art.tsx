import type { GameArtBodyProps } from '@/components/games/GameArt';

const BOARD: (number | null)[][] = [
  [2, null, 4, null],
  [8, 4, null, 2],
  [32, 16, 8, null],
  [256, 128, 64, 4],
];

const TILE: Record<number, [string, string]> = {
  2: ['#222a58', '#e9ecff'],
  4: ['#313a7a', '#f2f4ff'],
  8: ['#0e6b88', '#ffffff'],
  16: ['#0b86a8', '#ffffff'],
  32: ['#6a4bd6', '#ffffff'],
  64: ['#9b3bcc', '#ffffff'],
  128: ['#c8389f', '#ffffff'],
  256: ['#d93d63', '#ffffff'],
};

export function Art({ s }: GameArtBodyProps) {
  const cell = 32;
  const gap = 4;
  const ox = 26;
  const oy = 26;
  return (
    <>
      <defs>
        <linearGradient id={`g2048-bg-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#120f33" />
          <stop offset="1" stopColor="#060818" />
        </linearGradient>
        <radialGradient id={`g2048-glow-${s}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd23f" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd23f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`g2048-gold-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe48a" />
          <stop offset="1" stopColor="#ffc21f" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#g2048-bg-${s})`} />

      <rect x={ox - 6} y={oy - 6} width={4 * cell + 3 * gap + 12} height={4 * cell + 3 * gap + 12} rx="12" fill="#0b1030" stroke="#ffd23f" strokeOpacity="0.3" />
      {BOARD.map((row, r) =>
        row.map((v, c) => {
          const x = ox + c * (cell + gap);
          const y = oy + r * (cell + gap);
          const style = v ? TILE[v] : undefined;
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={cell} height={cell} rx="6" fill={style ? style[0] : 'rgba(148,163,255,0.08)'} />
              {v && style && (
                <text
                  x={x + cell / 2}
                  y={y + cell / 2 + 4.5}
                  textAnchor="middle"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="800"
                  fontSize={v >= 100 ? 11 : 14}
                  fill={style[1]}
                >
                  {v}
                </text>
              )}
            </g>
          );
        }),
      )}

      <circle cx="244" cy="100" r="74" fill={`url(#g2048-glow-${s})`} />
      <g stroke="#ffd23f" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round">
        <path d="M186 64 l-14 -10" />
        <path d="M180 100 h-16" />
        <path d="M186 136 l-14 10" />
        <path d="M302 64 l12 -10" />
        <path d="M302 136 l12 10" />
      </g>
      <rect x="196" y="52" width="96" height="96" rx="14" fill={`url(#g2048-gold-${s})`} />
      <rect x="200" y="56" width="88" height="88" rx="11" fill="none" stroke="#fff6cc" strokeOpacity="0.8" strokeWidth="2" />
      <text x="244" y="111" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="30" fill="#1a1300">
        2048
      </text>
      <g fill="#fff1b3">
        <circle cx="300" cy="40" r="2" />
        <circle cx="186" cy="170" r="1.6" />
        <circle cx="306" cy="160" r="1.4" />
      </g>
    </>
  );
}
