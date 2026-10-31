import type { GameArtBodyProps } from '@/components/games/GameArt';

type Face = 'dot3' | 'dot5' | 'bam2' | 'red' | 'east' | 'plum' | 'blank';

function TileArt({ x, y, face, glow }: { x: number; y: number; face: Face; glow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="4" y="4" width="34" height="44" rx="5" fill="#8f7a4c" />
      <rect x="2" y="2" width="34" height="44" rx="5" fill="#c8b07a" />
      <rect x="0" y="0" width="34" height="44" rx="5" fill="#f7f1e3" stroke={glow ? '#4dffb5' : '#c9bb94'} strokeWidth={glow ? 2.5 : 1} />
      {face === 'dot3' && (
        <g>
          {[
            [9, 10],
            [17, 22],
            [25, 34],
          ].map(([cx, cy]) => (
            <g key={cx}>
              <circle cx={cx} cy={cy} r="5" fill="none" stroke="#2459c4" strokeWidth="1.8" />
              <circle cx={cx} cy={cy} r="2" fill="#c42b3a" />
            </g>
          ))}
        </g>
      )}
      {face === 'dot5' && (
        <g>
          {[
            [9, 10],
            [25, 10],
            [17, 22],
            [9, 34],
            [25, 34],
          ].map(([cx, cy]) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r="4.6" fill="none" stroke="#1f7a4a" strokeWidth="1.6" />
              <circle cx={cx} cy={cy} r="1.8" fill="#1f7a4a" />
            </g>
          ))}
        </g>
      )}
      {face === 'bam2' && (
        <g fill="#1f7a4a">
          <rect x="14.5" y="5" width="5" height="15" rx="2.5" />
          <rect x="14.5" y="24" width="5" height="15" rx="2.5" />
        </g>
      )}
      {face === 'red' && (
        <g>
          <path d="M17 6 C25 14 26 21 23 28 C21 33 19 36 17 38 C15 36 13 33 11 28 C8 21 9 14 17 6 Z" fill="#c42b3a" />
          <path d="M17 18 C21 23 20 28 17 33 C14 28 13 23 17 18 Z" fill="#ffd23f" />
        </g>
      )}
      {face === 'east' && (
        <g>
          <text x="17" y="20" textAnchor="middle" fontSize="15" fontWeight="900" fill="#1d2b6b" fontFamily="system-ui, sans-serif">
            E
          </text>
          <path d="M28 31 L17 27 L20 31 L17 35 Z" fill="#c42b3a" />
        </g>
      )}
      {face === 'plum' && (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="17" cy="16" rx="4" ry="5.5" fill="#ef7fa8" transform={`rotate(${a} 17 22)`} />
          ))}
          <circle cx="17" cy="22" r="2.6" fill="#ffd23f" />
        </g>
      )}
    </g>
  );
}

export function Art({ s }: GameArtBodyProps) {
  return (
    <>
      <defs>
        <radialGradient id={`mj-felt-${s}`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#17604a" />
          <stop offset="0.65" stopColor="#0d3b2e" />
          <stop offset="1" stopColor="#06201a" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#mj-felt-${s})`} />
      {[0, 1, 2, 3, 4, 5].map((c) => (
        <TileArt key={`a${c}`} x={58 + c * 34} y={60} face={(['east', 'blank', 'blank', 'blank', 'blank', 'plum'] as Face[])[c]!} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((c) => (
        <TileArt key={`b${c}`} x={58 + c * 34} y={104} face={(['dot5', 'blank', 'bam2', 'blank', 'east', 'dot3'] as Face[])[c]!} />
      ))}
      {[0, 1, 2, 3].map((c) => (
        <TileArt key={`m${c}`} x={86 + c * 34} y={76} face={(['bam2', 'blank', 'blank', 'dot5'] as Face[])[c]!} />
      ))}
      <TileArt x={115} y={92} face="red" glow />
      <TileArt x={149} y={92} face="blank" />
      <TileArt x={183} y={92} face="red" glow />
      <g transform="rotate(-14 40 50)">
        <TileArt x={20} y={24} face="plum" />
      </g>
      <g transform="rotate(12 280 40)">
        <TileArt x={262} y={18} face="dot3" />
      </g>
    </>
  );
}
