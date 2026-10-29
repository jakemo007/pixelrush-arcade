import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('snake');

export default function Page() {
  return <GamePage gameId="snake" />;
}
