import type { GameArtBodyProps } from '@/components/games/GameArt';

type Cell = [letter: string, state: 'g' | 'y' | 'x' | 'e'];

const ROWS: Cell[][] = [
  [['s', 'x'], ['t', 'y'], ['o', 'x'], ['r', 'g'], ['e', 'x']],
  [['b', 'x'], ['a', 'g'], ['r', 'g'], ['t', 'y'], ['y', 'x']],
  [['c', 'x'], ['a', 'g'], ['r', 'g'], ['a', 'x'], ['t', 'g']],
  [['', 'e'], ['', 'e'], ['', 'e'], ['', 'e'], ['', 'e']],
];

const FILL = { g: '#1f9d55', y: '#d4a017', x: '#2a2f4a', e: '#0b0f26' } as const;

export function Art({ s }: GameArtBodyProps) {
  const size = 30;
  const gap = 6;
  const left = 70;
  const top = 26;
  return (
    <>
      <defs>
        <linearGradient id={`dw-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141033" />
          <stop offset="1" stopColor="#070a18" />
        </linearGradient>
        <radialGradient id={`dw-sun-${s}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd23f" />
          <stop offset="0.7" stopColor="#ffb02e" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#dw-bg-${s})`} />
      <circle cx="262" cy="52" r="34" fill={`url(#dw-sun-${s})`} />
      <circle cx="262" cy="52" r="15" fill="#ffd23f" />
      <g stroke="#ffd23f" strokeWidth="2.5" strokeLinecap="round" opacity="0.75">
        <line x1="262" y1="22" x2="262" y2="14" />
        <line x1="262" y1="82" x2="262" y2="90" />
        <line x1="232" y1="52" x2="224" y2="52" />
        <line x1="292" y1="52" x2="300" y2="52" />
        <line x1="241" y1="31" x2="235" y2="25" />
        <line x1="283" y1="73" x2="289" y2="79" />
        <line x1="283" y1="31" x2="289" y2="25" />
        <line x1="241" y1="73" x2="235" y2="79" />
      </g>
      {ROWS.map((row, r) =>
        row.map(([letter, state], c) => {
          const x = left + c * (size + gap);
          const y = top + r * (size + gap);
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={x}
                y={y}
                width={size}
                height={size}
                rx="5"
                fill={FILL[state]}
                stroke={state === 'e' ? '#3a4170' : FILL[state]}
                strokeWidth="1.5"
              />
              {letter && (
                <text
                  x={x + size / 2}
                  y={y + 20}
                  textAnchor="middle"
                  fontSize="16"
                  fontWeight="800"
                  fill={state === 'y' ? '#1a1300' : '#eef1ff'}
                  fontFamily="system-ui, sans-serif"
                >
                  {letter.toUpperCase()}
                </text>
              )}
              {state === 'g' && <rect x={x + 9} y={y + 24} width="12" height="2.5" rx="1.2" fill="#eef1ff" />}
              {state === 'y' && <circle cx={x + 15} cy={y + 25.5} r="1.8" fill="#1a1300" />}
            </g>
          );
        }),
      )}
      <rect x={left - 4} y={top + 3 * (size + gap) - 4} width={5 * size + 4 * gap + 8} height={size + 8} rx="8" fill="none" stroke="#ffd23f" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="4 4" />
      <g fill="#8f97c0" opacity="0.6">
        <rect x="24" y="179" width="22" height="13" rx="3" />
        <rect x="50" y="179" width="22" height="13" rx="3" />
        <rect x="76" y="179" width="22" height="13" rx="3" />
        <rect x="222" y="179" width="22" height="13" rx="3" />
        <rect x="248" y="179" width="22" height="13" rx="3" />
        <rect x="274" y="179" width="22" height="13" rx="3" />
      </g>
    </>
  );
}
