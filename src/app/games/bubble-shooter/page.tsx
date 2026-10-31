import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('bubble-shooter');

export default function Page() {
  return <GamePage gameId="bubble-shooter" />;
}
