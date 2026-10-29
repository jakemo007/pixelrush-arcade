import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('spider-solitaire');

export default function Page() {
  return <GamePage gameId="spider-solitaire" />;
}
