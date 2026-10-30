import type { GameArtBodyProps } from '@/components/games/GameArt';

const CELL = 26;
const X0 = 69;
const Y0 = 22;

const DISCS: readonly (readonly [number, number, 1 | 2])[] = [
  [3, 5, 1],
  [2, 5, 2],
  [4, 5, 1],
  [3, 4, 2],
  [5, 5, 2],
  [4, 4, 1],
  [2, 4, 1],
  [3, 3, 1],
  [1, 5, 1],
  [4, 3, 2],
  [2, 3, 2],
  [5, 4, 2],
  [3, 2, 2],
  [6, 5, 1],
  [4, 2, 1],
  [2, 2, 1],
  [5, 3, 1],
];

export function Art({ s }: GameArtBodyProps) {
  const holes: { cx: number; cy: number; key: string }[] = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) holes.push({ cx: X0 + c * CELL + CELL / 2, cy: Y0 + r * CELL + CELL / 2, key: `${r}-${c}` });
  return (
    <>
      <defs>
        <linearGradient id={`df-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101a3d" />
          <stop offset="1" stopColor="#060a1c" />
        </linearGradient>
        <linearGradient id={`df-board-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a52d0" />
          <stop offset="1" stopColor="#16318f" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#df-bg-${s})`} />
      <rect x={X0 - 8} y={Y0 - 8} width={CELL * 7 + 16} height={CELL * 6 + 16} rx="12" fill={`url(#df-board-${s})`} />
      {holes.map((h) => (
        <circle key={h.key} cx={h.cx} cy={h.cy} r="10.5" fill="#060a1c" />
      ))}
      {DISCS.map(([c, r, p]) => {
        const cx = X0 + c * CELL + CELL / 2;
        const cy = Y0 + r * CELL + CELL / 2;
        return (
          <g key={`${c}-${r}`}>
            <circle cx={cx} cy={cy} r="10.5" fill={p === 1 ? '#e63a5c' : '#ffd23f'} stroke={p === 1 ? '#7d1631' : '#8a6a00'} strokeWidth="1.2" />
            <circle cx={cx} cy={cy} r="6.5" fill="none" stroke={p === 1 ? '#ffffff' : '#5a3c00'} strokeOpacity="0.4" strokeWidth="1.2" />
          </g>
        );
      })}
      <path
        d={`M${X0 + 2 * CELL + CELL / 2} ${Y0 + 2 * CELL + CELL / 2} L${X0 + 5 * CELL + CELL / 2} ${Y0 + 5 * CELL + CELL / 2}`}
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.85"
        strokeDasharray="1 6"
      />
      <circle cx={X0 + 5 * CELL + CELL / 2} cy={Y0 - 14} r="9" fill="#e63a5c" stroke="#7d1631" strokeWidth="1.2" />
    </>
  );
}
