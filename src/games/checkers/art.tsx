import type { GameArtBodyProps } from '@/components/games/GameArt';

export function Art({ s }: GameArtBodyProps) {
  const squares: { x: number; y: number }[] = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) squares.push({ x: c * 24, y: r * 24 });
  const piece = (cx: number, cy: number, red: boolean, king = false, key?: string) => (
    <g key={key}>
      <ellipse cx={cx} cy={cy + 3} rx="10" ry="9.5" fill="rgba(0,0,0,0.4)" />
      <circle cx={cx} cy={cy} r="10" fill={red ? '#d8355a' : '#f2ece0'} stroke={red ? '#7d1631' : '#9b917f'} strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="6" fill="none" stroke={red ? 'rgba(255,255,255,0.35)' : 'rgba(60,50,40,0.25)'} strokeWidth="1.2" />
      {king && <path d={`M${cx - 5} ${cy + 3} l-1 -7 4 3 2 -5 2 5 4 -3 -1 7z`} fill="#ffd23f" stroke="#5a0f22" strokeWidth="0.8" />}
    </g>
  );
  return (
    <>
      <defs>
        <linearGradient id={`ck-bg-${s}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a1036" />
          <stop offset="1" stopColor="#0d0718" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#ck-bg-${s})`} />
      <g transform="translate(160 104) rotate(-12) scale(1 0.78) translate(-96 -96)">
        <rect x="-8" y="-8" width="208" height="208" rx="10" fill="#2a1830" />
        <rect width="192" height="192" fill="#dccab2" />
        {squares.map((q) => (
          <rect key={`${q.x}-${q.y}`} x={q.x} y={q.y} width="24" height="24" fill="#452a52" />
        ))}
        {piece(36, 12, false, false, 'w1')}
        {piece(84, 12, false, false, 'w2')}
        {piece(132, 36, false, false, 'w3')}
        {piece(60, 84, false, false, 'w4')}
        {piece(108, 108, true, true, 'rk')}
        {piece(12, 156, true, false, 'r1')}
        {piece(60, 156, true, false, 'r2')}
        {piece(156, 132, true, false, 'r3')}
        {piece(180, 60, false, true, 'wk')}
        <path d="M108 108 Q96 84 84 84 Q72 72 60 60" fill="none" stroke="#ffd23f" strokeWidth="2.5" strokeDasharray="5 4" strokeLinecap="round" />
      </g>
      <circle cx="286" cy="34" r="16" fill="#ff5bdc" opacity="0.18" />
      <circle cx="34" cy="172" r="22" fill="#ff5bdc" opacity="0.12" />
    </>
  );
}
