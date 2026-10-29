import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('crossword-mini');

export default function Page() {
  return <GamePage gameId="crossword-mini" />;
}
