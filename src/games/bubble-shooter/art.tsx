import type { GameArtBodyProps } from '@/components/games/GameArt';

const COLORS = ['#38e8ff', '#ff4fd8', '#ffd23f', '#4dffb5'];

export function Art({ s }: GameArtBodyProps) {
  const r = 11;
  const rows = [
    '0112233001',
    '012230011',
    '3301122300',
    '30-1-22',
  ];
  const bubbles: { x: number; y: number; c: number }[] = [];
  rows.forEach((row, ri) => {
    [...row].forEach((ch, ci) => {
      if (ch === '-') return;
      bubbles.push({ x: 50 + ci * 22 + (ri % 2 ? 11 : 0), y: 18 + ri * 19, c: Number(ch) });
    });
  });
  return (
    <>
      <defs>
        <linearGradient id={`bs-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0e2b" />
          <stop offset="1" stopColor="#05060f" />
        </linearGradient>
        {COLORS.map((color, i) => (
          <radialGradient key={color} id={`bs-b${i}-${s}`} cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="0.35" stopColor={color} />
            <stop offset="1" stopColor={color} stopOpacity="0.55" />
          </radialGradient>
        ))}
      </defs>
      <rect width="320" height="200" fill={`url(#bs-bg-${s})`} />
      <g stroke="#a78bfa" strokeOpacity="0.08">
        {[40, 80, 120, 160, 200, 240, 280].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="200" />
        ))}
      </g>
      <line x1="38" y1="6" x2="282" y2="6" stroke="#a78bfa" strokeWidth="2" />
      <line x1="38" y1="6" x2="38" y2="200" stroke="#a78bfa" strokeOpacity="0.5" strokeWidth="1.5" />
      <line x1="282" y1="6" x2="282" y2="200" stroke="#a78bfa" strokeOpacity="0.5" strokeWidth="1.5" />
      {bubbles.map((b) => (
        <g key={`${b.x}-${b.y}`}>
          <circle cx={b.x} cy={b.y} r={r} fill={`url(#bs-b${b.c}-${s})`} />
          <Symbol c={b.c} x={b.x} y={b.y} />
        </g>
      ))}
      <line x1="38" y1="150" x2="282" y2="150" stroke="#ff4d6d" strokeOpacity="0.55" strokeDasharray="6 5" />
      <g fill="#ff4fd8">
        {[
          [152, 160],
          [134, 146],
          [116, 132],
          [98, 118],
          [80, 104],
          [62, 90],
          [48, 79],
          [62, 66],
          [76, 54],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.2" opacity={0.95 - i * 0.07} />
        ))}
      </g>
      <g transform="rotate(-38 160 178)">
        <rect x="160" y="171" width="30" height="14" fill="#1b2148" stroke="#38e8ff" strokeWidth="1.5" />
      </g>
      <circle cx="160" cy="178" r="17" fill="#121638" stroke="#38e8ff" strokeWidth="2" />
      <circle cx="160" cy="178" r={r} fill={`url(#bs-b1-${s})`} />
      <Symbol c={1} x={160} y={178} />
      <circle cx="96" cy="182" r="8" fill={`url(#bs-b2-${s})`} />
      <circle cx="240" cy="40" r="4" fill="#ff4fd8" opacity="0.8" />
      <circle cx="252" cy="58" r="3" fill="#38e8ff" opacity="0.7" />
      <circle cx="232" cy="64" r="2.5" fill="#ffd23f" opacity="0.7" />
    </>
  );
}

function Symbol({ c, x, y }: { c: number; x: number; y: number }) {
  const fill = 'rgba(7, 10, 24, 0.7)';
  switch (c) {
    case 0:
      return <circle cx={x} cy={y} r="3.6" fill={fill} />;
    case 1:
      return <path d={`M${x} ${y - 4.6} L${x + 3.6} ${y} L${x} ${y + 4.6} L${x - 3.6} ${y} Z`} fill={fill} />;
    case 2:
      return (
        <path
          d={`M${x} ${y - 4.8} L${x + 1.3} ${y - 1.4} L${x + 4.6} ${y - 1.4} L${x + 2} ${y + 0.8} L${x + 3} ${y + 4.4} L${x} ${y + 2.3} L${x - 3} ${y + 4.4} L${x - 2} ${y + 0.8} L${x - 4.6} ${y - 1.4} L${x - 1.3} ${y - 1.4} Z`}
          fill={fill}
        />
      );
    default:
      return <path d={`M${x} ${y - 4.4} L${x + 4.2} ${y + 3.4} L${x - 4.2} ${y + 3.4} Z`} fill={fill} />;
  }
}
