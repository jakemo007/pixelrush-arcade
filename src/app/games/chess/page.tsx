import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('chess');

export default function Page() {
  return <GamePage gameId="chess" />;
}
