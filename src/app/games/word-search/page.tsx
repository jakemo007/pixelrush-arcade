import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('word-search');

export default function Page() {
  return <GamePage gameId="word-search" />;
}
