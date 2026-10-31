import type { GameArtBodyProps } from '@/components/games/GameArt';

const CELL = 18;
const X0 = 106;
const Y0 = 14;

const STACK: readonly (readonly [number, number, string])[] = [
  [0, 9, '#ff4d6d'], [1, 9, '#ff4d6d'], [2, 9, '#38e8ff'], [3, 9, '#38e8ff'], [4, 9, '#38e8ff'], [5, 9, '#38e8ff'], [6, 9, '#ffd23f'], [7, 9, '#ffd23f'],
  [0, 8, '#4dffb5'], [1, 8, '#ff4d6d'], [2, 8, '#ff4d6d'], [3, 8, '#ff8a3d'], [4, 8, '#a78bfa'], [5, 8, '#a78bfa'], [6, 8, '#ffd23f'], [7, 8, '#ffd23f'], [8, 8, '#5b8cff'],
  [0, 7, '#4dffb5'], [1, 7, '#4dffb5'], [2, 7, '#ff8a3d'], [3, 7, '#ff8a3d'], [4, 7, '#a78bfa'], [8, 7, '#5b8cff'], [7, 7, '#5b8cff'], [5, 7, '#a78bfa'], [6, 7, '#ffd23f'],
  [2, 6, '#4dffb5'], [3, 6, '#ff8a3d'],
];

const FALLING: readonly (readonly [number, number])[] = [
  [5, 1],
  [4, 2],
  [5, 2],
  [6, 2],
];

export function Art({ s }: GameArtBodyProps) {
  return (
    <>
      <defs>
        <linearGradient id={`sf-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1430" />
          <stop offset="1" stopColor="#040713" />
        </linearGradient>
        <linearGradient id={`sf-shine-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <pattern id={`sf-grid-${s}`} width={CELL} height={CELL} patternUnits="userSpaceOnUse" x={X0} y={Y0}>
          <path d={`M${CELL} 0H0V${CELL}`} fill="none" stroke="#38e8ff" strokeOpacity="0.1" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="320" height="200" fill={`url(#sf-bg-${s})`} />
      <rect x={X0} y={Y0} width={CELL * 9} height={CELL * 10} fill="#050816" fillOpacity="0.8" />
      <rect x={X0} y={Y0} width={CELL * 9} height={CELL * 10} fill={`url(#sf-grid-${s})`} />
      <rect x={X0 - 1} y={Y0 - 1} width={CELL * 9 + 2} height={CELL * 10 + 2} fill="none" stroke="#38e8ff" strokeOpacity="0.6" strokeWidth="2" />

      {STACK.map(([cx, cy, fill]) => (
        <g key={`${cx}-${cy}`}>
          <rect x={X0 + cx * CELL + 1} y={Y0 + cy * CELL + 1} width={CELL - 2} height={CELL - 2} rx="3" fill={fill} />
          <rect x={X0 + cx * CELL + 1} y={Y0 + cy * CELL + 1} width={CELL - 2} height={(CELL - 2) / 2} rx="3" fill={`url(#sf-shine-${s})`} />
        </g>
      ))}

      {FALLING.map(([cx, cy]) => (
        <g key={`f-${cx}-${cy}`}>
          <rect x={X0 + cx * CELL + 1} y={Y0 + cy * CELL + 1} width={CELL - 2} height={CELL - 2} rx="3" fill="#a78bfa" />
          <rect x={X0 + cx * CELL + 1} y={Y0 + cy * CELL + 1} width={CELL - 2} height={(CELL - 2) / 2} rx="3" fill={`url(#sf-shine-${s})`} />
        </g>
      ))}
      <path
        d={`M${X0 + 4 * CELL + 3} ${Y0 + 6 * CELL + 3}h${CELL - 6}v${CELL - 6}h-${CELL - 6}z M${X0 + 5 * CELL + 3} ${Y0 + 6 * CELL + 3}h${CELL - 6}v${CELL - 6}h-${CELL - 6}z M${X0 + 6 * CELL + 3} ${Y0 + 6 * CELL + 3}h${CELL - 6}v${CELL - 6}h-${CELL - 6}z M${X0 + 5 * CELL + 3} ${Y0 + 5 * CELL + 3}h${CELL - 6}v${CELL - 6}h-${CELL - 6}z`}
        fill="none"
        stroke="#a78bfa"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />

      <rect x="24" y="22" width="60" height="50" rx="8" fill="none" stroke="#a78bfa" strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="44" y="40" width="20" height="14" rx="3" fill="#38e8ff" />
      <rect x="276" y="22" width="30" height="62" rx="8" fill="none" stroke="#a78bfa" strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="284" y="32" width="14" height="14" rx="3" fill="#ffd23f" />
      <rect x="284" y="54" width="14" height="14" rx="3" fill="#ff8a3d" />
    </>
  );
}
