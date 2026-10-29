import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('car-racing');

export default function Page() {
  return <GamePage gameId="car-racing" />;
}
