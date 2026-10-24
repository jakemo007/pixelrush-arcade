import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('space-survival');

export default function Page() {
  return <GamePage gameId="space-survival" />;
}
