import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('match-3');

export default function Page() {
  return <GamePage gameId="match-3" />;
}
