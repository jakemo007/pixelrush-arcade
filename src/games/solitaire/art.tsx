import type { GameArtBodyProps } from '@/components/games/GameArt';
import { ArtCard } from '@/games/cards/artCard';

export function Art({ s }: GameArtBodyProps) {
  return (
    <>
      <defs>
        <radialGradient id={`sol-felt-${s}`} cx="0.5" cy="0.15" r="0.9">
          <stop offset="0" stopColor="#1f7a51" />
          <stop offset="0.6" stopColor="#0f4631" />
          <stop offset="1" stopColor="#082519" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#sol-felt-${s})`} />
      <g opacity="0.25" stroke="#bfffe0" fill="none">
        <rect x="14" y="14" width="40" height="56" rx="4" strokeDasharray="4 3" />
        <rect x="266" y="14" width="40" height="56" rx="4" strokeDasharray="4 3" />
      </g>
      <ArtCard x={36} y={26} back backColor="#3e2f96" w={42} />
      <ArtCard x={36} y={38} back backColor="#3e2f96" w={42} />
      <ArtCard x={36} y={50} rank="K" suit="spades" w={42} />
      <ArtCard x={36} y={72} rank="Q" suit="hearts" w={42} />
      <ArtCard x={36} y={94} rank="J" suit="clubs" w={42} />
      <ArtCard x={36} y={116} rank="10" suit="diamonds" w={42} />
      <ArtCard x={170} y={72} rank="A" suit="clubs" rotate={-24} w={50} />
      <ArtCard x={190} y={62} rank="A" suit="diamonds" rotate={-8} w={50} />
      <ArtCard x={210} y={62} rank="A" suit="hearts" rotate={8} w={50} />
      <ArtCard x={230} y={72} rank="A" suit="spades" rotate={24} w={50} />
      <ArtCard x={112} y={24} back backColor="#3e2f96" w={38} />
      <ArtCard x={115} y={21} back backColor="#4a3aa8" w={38} />
      <g fill="#ffd23f">
        <path d="M150 158 l3 7 7 1 -5 5 1 7 -6 -4 -6 4 1 -7 -5 -5 7 -1z" />
        <path d="M280 150 l2 5 5 .7 -3.6 3.5 .8 5 -4.2 -2.4 -4.2 2.4 .8 -5 -3.6 -3.5 5 -.7z" opacity="0.8" />
      </g>
    </>
  );
}
