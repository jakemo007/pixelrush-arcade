import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('2048');

export default function Page() {
  return <GamePage gameId="2048" />;
}
