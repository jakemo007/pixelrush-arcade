import type { ReactNode } from 'react';
import { SYMBOLS } from './symbols';

function polygon(cx: number, cy: number, points: number, outer: number, inner: number | null, rotate = -90): string {
  const out: string[] = [];
  const total = inner === null ? points : points * 2;
  for (let i = 0; i < total; i++) {
    const r = inner === null || i % 2 === 0 ? outer : inner;
    const a = ((rotate + (360 / total) * i) * Math.PI) / 180;
    out.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return out.join(' ');
}

const STAR = polygon(24, 25.5, 5, 21, 8.8);
const HEXAGON = polygon(24, 24, 6, 20.5, null, 0);
const SUN_RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  return `M${(24 + 13.5 * Math.cos(a)).toFixed(2)} ${(24 + 13.5 * Math.sin(a)).toFixed(2)}L${(24 + 20.5 * Math.cos(a)).toFixed(2)} ${(24 + 20.5 * Math.sin(a)).toFixed(2)}`;
}).join('');
const PETALS = Array.from({ length: 5 }, (_, i) => {
  const a = ((-90 + i * 72) * Math.PI) / 180;
  return { cx: 24 + 11 * Math.cos(a), cy: 24 + 11 * Math.sin(a) };
});

function shape(key: string, color: string): ReactNode {
  switch (key) {
    case 'star':
      return <polygon points={STAR} fill={color} strokeLinejoin="round" />;
    case 'heart':
      return <path d="M24 42C12 33 4 25.5 4 16.5 4 10 9 5 15 5c4 0 7.3 2.3 9 6 1.7-3.7 5-6 9-6 6 0 11 5 11 11.5C44 25.5 36 33 24 42Z" fill={color} />;
    case 'moon':
      return <path d="M30 4.5A20 20 0 1 0 44 31 16 16 0 1 1 30 4.5Z" fill={color} />;
    case 'sun':
      return (
        <>
          <circle cx="24" cy="24" r="9.5" fill={color} />
          <path d={SUN_RAYS} stroke={color} strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'diamond':
      return <polygon points="24,3 43,24 24,45 5,24" fill={color} />;
    case 'triangle':
      return <polygon points="24,5 45,42 3,42" fill={color} strokeLinejoin="round" />;
    case 'hexagon':
      return <polygon points={HEXAGON} fill={color} />;
    case 'bolt':
      return <polygon points="28,2 9,27 21,27 16,46 39,18 27,18 33,2" fill={color} />;
    case 'leaf':
      return (
        <>
          <path d="M7 41C5 20 19 6 43 5c1 23-13 37-36 36Z" fill={color} />
          <path d="M10 38 33 15" stroke="#0b1030" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
        </>
      );
    case 'drop':
      return <path d="M24 3c7 11 15 18.5 15 27a15 15 0 0 1-30 0c0-8.5 8-16 15-27Z" fill={color} />;
    case 'flower':
      return (
        <>
          {PETALS.map((p, i) => (
            <circle key={i} cx={p.cx} cy={p.cy} r="8.5" fill={color} />
          ))}
          <circle cx="24" cy="24" r="6" fill="#ffd23f" />
        </>
      );
    case 'crown':
      return (
        <>
          <polygon points="5,36 5,12 15,23 24,7 33,23 43,12 43,36" fill={color} strokeLinejoin="round" />
          <rect x="5" y="38" width="38" height="5" rx="2" fill={color} />
        </>
      );
    case 'cloud':
      return <path d="M13 38a9 9 0 0 1-1.5-17.9A12.5 12.5 0 0 1 35.5 17 10.5 10.5 0 0 1 35 38Z" fill={color} />;
    case 'note':
      return (
        <>
          <ellipse cx="16.5" cy="36" rx="8.5" ry="6.5" transform="rotate(-20 16.5 36)" fill={color} />
          <rect x="21.5" y="7" width="4" height="30" rx="1.5" fill={color} />
          <path d="M25 7c8 1.5 13 6 12.5 14-3-4.5-7-6.5-12.5-6.5Z" fill={color} />
        </>
      );
    case 'key':
      return (
        <>
          <circle cx="14" cy="24" r="8.5" fill="none" stroke={color} strokeWidth="5" />
          <rect x="21" y="21.5" width="24" height="5" rx="1.5" fill={color} />
          <rect x="35" y="25" width="4.5" height="9" rx="1" fill={color} />
          <rect x="41" y="25" width="4" height="6" rx="1" fill={color} />
        </>
      );
    case 'ring':
      return <circle cx="24" cy="24" r="15" fill="none" stroke={color} strokeWidth="8.5" />;
    case 'cross':
      return <path d="M19 4h10v15h15v10H29v15H19V29H4V19h15Z" fill={color} />;
    case 'arrow':
      return <polygon points="24,3 44,23 31.5,23 31.5,45 16.5,45 16.5,23 4,23" fill={color} strokeLinejoin="round" />;
    default:
      return null;
  }
}

export function SymbolArt({ symbol, className }: { symbol: number; className?: string }) {
  const info = SYMBOLS[symbol];
  if (!info) return null;
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {shape(info.key, info.color)}
    </svg>
  );
}
