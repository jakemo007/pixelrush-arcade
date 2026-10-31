import type { GameArtBodyProps } from '@/components/games/GameArt';

const ROWS = ['QCOMETXR', 'PLANETUO', 'BRSTARFC', 'GALAXYKK', 'MOONDWEE', 'ORBITZLT', 'HSUNPIOW'];

const FOUND: [r0: number, c0: number, r1: number, c1: number, color: string][] = [
  [1, 0, 1, 5, '#ff5bdc'],
  [3, 0, 3, 5, '#38e8ff'],
  [0, 7, 5, 7, '#ffd23f'],
];

const LIST: [word: string, found: boolean][] = [
  ['PLANET', true],
  ['GALAXY', true],
  ['ROCKET', true],
  ['COMET', false],
  ['ORBIT', false],
];

export function Art({ s }: GameArtBodyProps) {
  const cell = 23;
  const x0 = 34;
  const y0 = 20;
  const at = (r: number, c: number) => ({ x: x0 + c * cell + cell / 2, y: y0 + r * cell + cell / 2 });
  return (
    <>
      <defs>
        <linearGradient id={`ws-bg-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a0b33" />
          <stop offset="1" stopColor="#070a18" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#ws-bg-${s})`} />
      <rect x={x0 - 8} y={y0 - 8} width={8 * cell + 16} height={7 * cell + 16} rx="12" fill="#0b0f2b" stroke="#ff5bdc" strokeOpacity="0.45" strokeWidth="1.5" />
      {FOUND.map(([r0, c0, r1, c1, color]) => {
        const a = at(r0, c0);
        const b = at(r1, c1);
        return <line key={color} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeOpacity="0.45" strokeWidth="18" strokeLinecap="round" />;
      })}
      {ROWS.map((row, r) =>
        [...row].map((ch, c) => {
          const p = at(r, c);
          return (
            <text key={`${r}-${c}`} x={p.x} y={p.y + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#eef1ff" fontFamily="system-ui, sans-serif">
              {ch}
            </text>
          );
        }),
      )}
      <g fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="800">
        {LIST.map(([word, found], i) => (
          <g key={word}>
            <circle cx="236" cy={44 + i * 26} r="6" fill={found ? '#ff5bdc' : 'none'} stroke={found ? '#ff5bdc' : '#8f97c0'} strokeWidth="1.5" />
            <text x="248" y={48 + i * 26} fill={found ? '#8f97c0' : '#eef1ff'}>
              {word}
            </text>
            {found && <line x1="247" y1={44 + i * 26} x2={250 + word.length * 7.6} y2={44 + i * 26} stroke="#ff5bdc" strokeWidth="1.6" />}
          </g>
        ))}
      </g>
    </>
  );
}
