import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('neon-dash');

export default function Page() {
  return <GamePage gameId="neon-dash" />;
}
