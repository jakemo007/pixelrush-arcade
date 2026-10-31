import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('checkers');

export default function Page() {
  return <GamePage gameId="checkers" />;
}
