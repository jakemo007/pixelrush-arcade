import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('memory-match');

export default function Page() {
  return <GamePage gameId="memory-match" />;
}
