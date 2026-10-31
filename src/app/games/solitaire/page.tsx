import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('solitaire');

export default function Page() {
  return <GamePage gameId="solitaire" />;
}
