import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('stackfall');

export default function Page() {
  return <GamePage gameId="stackfall" />;
}
