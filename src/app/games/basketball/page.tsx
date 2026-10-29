import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('basketball');

export default function Page() {
  return <GamePage gameId="basketball" />;
}
