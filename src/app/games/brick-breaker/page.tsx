import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('brick-breaker');

export default function Page() {
  return <GamePage gameId="brick-breaker" />;
}
