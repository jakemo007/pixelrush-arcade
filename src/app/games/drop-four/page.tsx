import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('drop-four');

export default function Page() {
  return <GamePage gameId="drop-four" />;
}
