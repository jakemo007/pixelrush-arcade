import type { GameArtBodyProps } from '@/components/games/GameArt';
import { ArtCard } from '@/games/cards/artCard';

export function Art({ s }: GameArtBodyProps) {
  const ranks = ['K', 'Q', 'J', '10', '9', '8'];
  return (
    <>
      <defs>
        <radialGradient id={`spi-felt-${s}`} cx="0.6" cy="0.1" r="1">
          <stop offset="0" stopColor="#4a3392" />
          <stop offset="0.6" stopColor="#261a54" />
          <stop offset="1" stopColor="#120b2c" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#spi-felt-${s})`} />
      <g stroke="#cdbdff" strokeWidth="1" fill="none" opacity="0.45">
        <path d="M0 0 L120 70 M0 0 L90 110 M0 0 L40 130 M0 0 L130 25" />
        <path d="M30 18 Q36 26 26 32 Q20 24 14 26" />
        <path d="M60 35 Q66 52 50 62 Q36 52 27 55 Q30 42 26 32" />
        <path d="M90 52 Q94 76 72 92 Q52 80 38 86 Q42 68 27 55" />
        <path d="M60 35 Q80 22 86 12 M90 52 Q112 40 118 22" />
      </g>
      <g stroke="#e6dcff" strokeWidth="1.2">
        <line x1="96" y1="0" x2="96" y2="40" />
      </g>
      <g fill="#1a1230" stroke="#e6dcff" strokeWidth="1.2">
        <ellipse cx="96" cy="46" rx="7" ry="8" />
        <circle cx="96" cy="36" r="4.5" />
        <path d="M90 42 l-9 -5 M90 46 l-10 0 M90 50 l-9 5 M102 42 l9 -5 M102 46 l10 0 M102 50 l9 5" fill="none" />
      </g>
      <ArtCard x={150} y={18} back backColor="#137a86" w={40} />
      <ArtCard x={150} y={28} back backColor="#137a86" w={40} />
      <ArtCard x={150} y={38} rank="7" suit="hearts" w={40} />
      <ArtCard x={150} y={58} rank="6" suit="spades" w={40} />
      {ranks.map((r, i) => (
        <ArtCard key={r} x={205} y={14 + i * 20} rank={r} suit="spades" w={40} />
      ))}
      <ArtCard x={262} y={120} rank="K" suit="spades" rotate={6} w={40} />
      <ArtCard x={266} y={116} rank="K" suit="hearts" rotate={-4} w={40} />
    </>
  );
}
