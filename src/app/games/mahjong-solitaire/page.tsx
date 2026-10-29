import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('mahjong-solitaire');

export default function Page() {
  return <GamePage gameId="mahjong-solitaire" />;
}
