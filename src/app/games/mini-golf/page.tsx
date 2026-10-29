import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('mini-golf');

export default function Page() {
  return <GamePage gameId="mini-golf" />;
}
