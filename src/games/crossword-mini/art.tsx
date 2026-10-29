import type { GameArtBodyProps } from '@/components/games/GameArt';

const GRID = ['#TACO', 'THROB', 'ARGUE', 'PEONY', 'SENT#'];
const FILLED = new Set(['0,1', '0,2', '0,3', '0,4', '1,0', '1,1', '1,2', '2,1', '3,1', '4,1', '2,0', '3,0']);
const NUMBERS: Record<string, number> = { '0,1': 1, '0,2': 2, '0,3': 3, '0,4': 4, '1,0': 5, '2,0': 6, '3,0': 7, '4,0': 8 };

export function Art({ s }: GameArtBodyProps) {
  const size = 30;
  const x0 = 92;
  const y0 = 22;
  return (
    <>
      <defs>
        <linearGradient id={`cw-bg-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0d1638" />
          <stop offset="1" stopColor="#060818" />
        </linearGradient>
        <linearGradient id={`cw-cup-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38e8ff" />
          <stop offset="1" stopColor="#12cdf0" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#cw-bg-${s})`} />
      <rect x={x0 - 4} y={y0 - 4} width={5 * size + 8} height={5 * size + 8} rx="7" fill="#0a0d1a" stroke="#38e8ff" strokeOpacity="0.5" strokeWidth="1.5" />
      {GRID.map((row, r) =>
        [...row].map((ch, c) => {
          const x = x0 + c * size;
          const y = y0 + r * size;
          const key = `${r},${c}`;
          if (ch === '#') return <rect key={key} x={x + 1} y={y + 1} width={size - 2} height={size - 2} rx="2" fill="#0a0d1a" />;
          const inWord = r === 1;
          const cursor = r === 1 && c === 3;
          return (
            <g key={key}>
              <rect x={x + 1} y={y + 1} width={size - 2} height={size - 2} rx="2.5" fill={cursor ? '#ffd23f' : inWord ? '#bfefff' : '#f4f1e8'} />
              {NUMBERS[key] && (
                <text x={x + 4} y={y + 9} fontSize="7" fontWeight="700" fill="#10142b" fontFamily="system-ui, sans-serif">
                  {NUMBERS[key]}
                </text>
              )}
              {FILLED.has(key) && (
                <text x={x + size / 2} y={y + 22} textAnchor="middle" fontSize="16" fontWeight="800" fill="#10142b" fontFamily="system-ui, sans-serif">
                  {ch}
                </text>
              )}
            </g>
          );
        }),
      )}
      <g transform="translate(262 118) rotate(-35)">
        <rect x="-5" y="-46" width="10" height="70" rx="2" fill="#ffd23f" />
        <rect x="-5" y="-54" width="10" height="9" rx="2" fill="#ff6b8a" />
        <path d="M-5 24 L0 36 L5 24 Z" fill="#f4d9a8" />
        <path d="M-1.6 32 L0 36 L1.6 32 Z" fill="#10142b" />
      </g>
      <g transform="translate(18 112)">
        <path d="M0 10 h46 v34 a14 14 0 0 1 -14 14 h-18 a14 14 0 0 1 -14 -14 z" fill={`url(#cw-cup-${s})`} />
        <path d="M46 18 h6 a9 9 0 0 1 0 18 h-6" fill="none" stroke="#38e8ff" strokeWidth="4" />
        <path d="M14 -6 q6 6 0 12 M28 -8 q6 6 0 12" fill="none" stroke="#b0b8dc" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <rect x="-6" y="56" width="58" height="5" rx="2.5" fill="#1e2448" />
      </g>
    </>
  );
}
