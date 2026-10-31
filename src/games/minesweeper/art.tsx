import type { GameArtBodyProps } from '@/components/games/GameArt';

const LAYOUT = ['##F#####', '#21123##', '#1...1F#', '#1.112##', '#11##F##'];
const NUM_COLOR: Record<string, string> = { '1': '#38e8ff', '2': '#4dffb5', '3': '#ff6b8a' };

export function Art({ s }: GameArtBodyProps) {
  const size = 30;
  const step = 33;
  const ox = 28;
  const oy = 19;
  return (
    <>
      <defs>
        <linearGradient id={`ms-bg-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14103a" />
          <stop offset="1" stopColor="#060818" />
        </linearGradient>
        <linearGradient id={`ms-tile-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3c4390" />
          <stop offset="1" stopColor="#262b62" />
        </linearGradient>
        <radialGradient id={`ms-glow-${s}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff4fd8" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ff4fd8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#ms-bg-${s})`} />
      <rect x={ox - 7} y={oy - 7} width={8 * step + 11} height={5 * step + 11} rx="10" fill="#0a0d24" stroke="#a78bfa" strokeOpacity="0.35" />
      {LAYOUT.map((row, r) =>
        [...row].map((ch, c) => {
          const x = ox + c * step;
          const y = oy + r * step;
          const covered = ch === '#' || ch === 'F';
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={size} height={size} rx="5" fill={covered ? `url(#ms-tile-${s})` : '#121634'} />
              {covered && <rect x={x + 2} y={y + 1.5} width={size - 4} height="2" rx="1" fill="#ffffff" opacity="0.14" />}
              {ch === 'F' && (
                <g>
                  <path d={`M${x + 11} ${y + 6}v18`} stroke="#eef1ff" strokeWidth="2.2" strokeLinecap="round" />
                  <path d={`M${x + 12} ${y + 7}l11 4.5l-11 4.5z`} fill="#ff4d6d" />
                  <path d={`M${x + 7.5} ${y + 24}h8`} stroke="#eef1ff" strokeWidth="2.2" strokeLinecap="round" />
                </g>
              )}
              {NUM_COLOR[ch] && (
                <text
                  x={x + size / 2}
                  y={y + size / 2 + 6}
                  textAnchor="middle"
                  fontFamily="system-ui, sans-serif"
                  fontWeight="850"
                  fontSize="17"
                  fill={NUM_COLOR[ch]}
                >
                  {ch}
                </text>
              )}
            </g>
          );
        }),
      )}
      <circle cx="250" cy="150" r="46" fill={`url(#ms-glow-${s})`} />
      <g stroke="#ff9be8" strokeWidth="4" strokeLinecap="round">
        <path d="M250 124v52M224 150h52M231.6 131.6l36.8 36.8M268.4 131.6l-36.8 36.8" />
      </g>
      <circle cx="250" cy="150" r="17" fill="#ff9be8" />
      <circle cx="244" cy="144" r="4.5" fill="#ffffff" opacity="0.85" />
    </>
  );
}
