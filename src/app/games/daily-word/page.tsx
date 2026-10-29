import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('daily-word');

export default function Page() {
  return <GamePage gameId="daily-word" />;
}
