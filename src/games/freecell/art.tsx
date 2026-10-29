import type { GameArtBodyProps } from '@/components/games/GameArt';
import { ArtCard } from '@/games/cards/artCard';

export function Art({ s }: GameArtBodyProps) {
  const columns: [string, 'spades' | 'hearts' | 'diamonds' | 'clubs'][][] = [
    [
      ['9', 'clubs'],
      ['8', 'hearts'],
      ['7', 'spades'],
    ],
    [
      ['K', 'diamonds'],
      ['Q', 'spades'],
      ['J', 'hearts'],
      ['10', 'clubs'],
    ],
    [
      ['5', 'spades'],
      ['4', 'diamonds'],
    ],
    [
      ['J', 'clubs'],
      ['10', 'diamonds'],
      ['9', 'spades'],
    ],
  ];
  return (
    <>
      <defs>
        <radialGradient id={`fc-felt-${s}`} cx="0.5" cy="0.1" r="1">
          <stop offset="0" stopColor="#1a6d8c" />
          <stop offset="0.6" stopColor="#0c3b52" />
          <stop offset="1" stopColor="#061f30" />
        </radialGradient>
        <linearGradient id={`fc-glow-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38e8ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#38e8ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#fc-felt-${s})`} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={22 + i * 36} y={14} width={30} height={42} rx={4} fill={`url(#fc-glow-${s})`} stroke="#8ff3ff" strokeOpacity="0.6" strokeDasharray="4 3" />
      ))}
      <ArtCard x={58} y={14} rank="K" suit="hearts" w={30} />
      <ArtCard x={182} y={14} rank="A" suit="spades" w={30} />
      <ArtCard x={218} y={14} rank="3" suit="hearts" w={30} />
      <ArtCard x={254} y={14} rank="2" suit="clubs" w={30} />
      <rect x={290} y={14} width={24} height={42} rx={4} fill="none" stroke="#8ff3ff" strokeOpacity="0.45" strokeDasharray="4 3" />
      {columns.map((col, ci) =>
        col.map(([rank, suit], i) => <ArtCard key={`${ci}-${i}`} x={30 + ci * 70} y={72 + i * 22} rank={rank} suit={suit} w={44} />),
      )}
    </>
  );
}
