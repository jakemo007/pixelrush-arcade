import { GamePage, gameMetadata } from '@/components/games/GamePage';

export const metadata = gameMetadata('freecell');

export default function Page() {
  return <GamePage gameId="freecell" />;
}
