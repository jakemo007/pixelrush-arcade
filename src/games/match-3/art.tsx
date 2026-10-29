import type { GameArtBodyProps } from '@/components/games/GameArt';

const GEMS = [
  { color: '#38e8ff', dark: '#0b7590' },
  { color: '#ff4fd8', dark: '#9c0f79' },
  { color: '#ffd23f', dark: '#a37600' },
  { color: '#4dffb5', dark: '#0b8a57' },
  { color: '#a78bfa', dark: '#5236b8' },
  { color: '#ff8a3d', dark: '#ad4508' },
];

export function Art({ s }: GameArtBodyProps) {
  const layout = ['0125043', '3412251', '2203314', '1450122'];
  const size = 38;
  const ox = 27;
  const oy = 24;
  return (
    <>
      <defs>
        <linearGradient id={`m3-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0e2b" />
          <stop offset="1" stopColor="#05060f" />
        </linearGradient>
        {GEMS.map((g, i) => (
          <linearGradient key={g.color} id={`m3-g${i}-${s}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.4" stopColor={g.color} />
            <stop offset="1" stopColor={g.dark} />
          </linearGradient>
        ))}
      </defs>
      <rect width="320" height="200" fill={`url(#m3-bg-${s})`} />
      <rect x={ox - 7} y={oy - 7} width={size * 7 + 14} height={size * 4 + 14} rx="12" fill="#070a18" stroke="#a78bfa" strokeOpacity="0.55" strokeWidth="1.5" />
      {layout.map((row, r) =>
        [...row].map((ch, c) => {
          const kind = Number(ch);
          const x = ox + c * size + size / 2;
          const y = oy + r * size + size / 2;
          return (
            <g key={`${r}-${c}`}>
              <rect x={x - 17} y={y - 17} width="34" height="34" rx="7" fill={(r + c) % 2 ? '#a78bfa' : '#38e8ff'} opacity="0.06" />
              <Gem kind={kind} x={x} y={y} s={s} />
            </g>
          );
        }),
      )}
      <rect x={ox + 2 * size + 2} y={oy + size + 2} width={size - 4} height={size - 4} rx="8" fill="none" stroke="#38e8ff" strokeWidth="2.5" />
      <path
        d={`M${ox + 2 * size + size / 2} ${oy + size * 2 - 2} v10 m-5 -5 l5 5 l5 -5`}
        stroke="#eef2ff"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x="292" y="190" textAnchor="end" fontSize="13" fontWeight="900" fill="#ff4fd8" fontFamily="system-ui, sans-serif">
        CASCADE x3
      </text>
    </>
  );
}

function Gem({ kind, x, y, s }: { kind: number; x: number; y: number; s: string }) {
  const fill = `url(#m3-g${kind}-${s})`;
  const stroke = 'rgba(255,255,255,0.55)';
  const r = 13;
  switch (kind) {
    case 0:
      return <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} />;
    case 1:
      return <path d={`M${x} ${y - r * 1.1} L${x + r * 0.86} ${y} L${x} ${y + r * 1.1} L${x - r * 0.86} ${y} Z`} fill={fill} stroke={stroke} />;
    case 2: {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 === 0 ? r * 1.1 : r * 0.48;
        return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
      });
      return <polygon points={pts.join(' ')} fill={fill} stroke={stroke} />;
    }
    case 3:
      return <path d={`M${x} ${y - r * 1.05} L${x + r} ${y + r * 0.8} L${x - r} ${y + r * 0.8} Z`} fill={fill} stroke={stroke} />;
    case 4:
      return <rect x={x - r * 0.82} y={y - r * 0.82} width={r * 1.64} height={r * 1.64} rx="3" fill={fill} stroke={stroke} />;
    default: {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3;
        return `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`;
      });
      return <polygon points={pts.join(' ')} fill={fill} stroke={stroke} />;
    }
  }
}
