import type { GameArtBodyProps } from '@/components/games/GameArt';
import { ChessPiece } from './Pieces';

export function Art({ s }: GameArtBodyProps) {
  const squares: { x: number; y: number; dark: boolean }[] = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) squares.push({ x: c * 36, y: r * 36, dark: (r + c) % 2 === 1 });
  return (
    <>
      <defs>
        <linearGradient id={`ch-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1430" />
          <stop offset="1" stopColor="#090614" />
        </linearGradient>
        <radialGradient id={`ch-glow-${s}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd23f" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffd23f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#ch-bg-${s})`} />
      <g transform="translate(-8 92) skewX(-18) scale(1 0.5)">
        {squares.map((q) => (
          <rect key={`${q.x}-${q.y}`} x={q.x} y={q.y} width="36" height="36" fill={q.dark ? '#b07f56' : '#ecdcc0'} />
        ))}
      </g>
      <ellipse cx="168" cy="126" rx="90" ry="34" fill={`url(#ch-glow-${s})`} />
      <svg x="62" y="58" width="80" height="80" viewBox="0 0 100 100">
        <ChessPiece type="n" color="b" />
      </svg>
      <svg x="122" y="22" width="104" height="104" viewBox="0 0 100 100">
        <ChessPiece type="k" color="w" />
      </svg>
      <svg x="206" y="50" width="86" height="86" viewBox="0 0 100 100">
        <ChessPiece type="q" color="b" />
      </svg>
      <svg x="20" y="112" width="48" height="48" viewBox="0 0 100 100">
        <ChessPiece type="p" color="w" />
      </svg>
      <svg x="270" y="120" width="44" height="44" viewBox="0 0 100 100">
        <ChessPiece type="p" color="b" />
      </svg>
    </>
  );
}
