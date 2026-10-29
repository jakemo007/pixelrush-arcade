import { SUIT_SYMBOL, isRedSuit, type Suit } from './model';

export interface ArtCardProps {
  x: number;
  y: number;
  rank?: string;
  suit?: Suit;
  rotate?: number;
  back?: boolean;
  backColor?: string;
  w?: number;
}

export function ArtCard({ x, y, rank = 'A', suit = 'spades', rotate = 0, back = false, backColor = '#3b2f8f', w = 46 }: ArtCardProps) {
  const h = w * 1.4;
  const ink = isRedSuit(suit) ? '#c41d3a' : '#161a2e';
  const symbol = SUIT_SYMBOL[suit];
  return (
    <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x + 1.5} y={y + 2.5} width={w} height={h} rx={w * 0.09} fill="rgba(0,0,0,0.35)" />
      {back ? (
        <>
          <rect x={x} y={y} width={w} height={h} rx={w * 0.09} fill={backColor} stroke="rgba(255,255,255,0.35)" />
          <rect x={x + w * 0.1} y={y + w * 0.1} width={w * 0.8} height={h - w * 0.2} rx={w * 0.06} fill="none" stroke="rgba(255,255,255,0.4)" />
          <circle cx={x + w / 2} cy={y + h / 2} r={w * 0.14} fill="rgba(255,255,255,0.25)" />
        </>
      ) : (
        <>
          <rect x={x} y={y} width={w} height={h} rx={w * 0.09} fill="#fdfaf3" stroke="rgba(16,20,40,0.45)" />
          <text x={x + w * 0.08} y={y + w * 0.32} fontSize={w * 0.3} fontWeight="800" fill={ink} fontFamily="system-ui, sans-serif">
            {rank}
          </text>
          <text x={x + w * 0.92} y={y + w * 0.32} fontSize={w * 0.26} textAnchor="end" fill={ink} fontFamily="system-ui, sans-serif">
            {symbol}
          </text>
          <text x={x + w / 2} y={y + h * 0.72} fontSize={w * 0.58} textAnchor="middle" fill={ink} fontFamily="system-ui, sans-serif">
            {symbol}
          </text>
        </>
      )}
    </g>
  );
}
