import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('typing-speed');

export default function Page() {
  return <GamePage gameId="typing-speed" />;
}
