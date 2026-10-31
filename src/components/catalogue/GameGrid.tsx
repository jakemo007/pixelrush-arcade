import { GameCard } from '@/components/games/GameCard';
import type { GameInfo } from '@/config/games';
import styles from './Catalogue.module.css';

interface Props {
  games: readonly GameInfo[];
  headingLevel?: 'h2' | 'h3';
  artId: string;
}

export function GameGrid({ games, headingLevel = 'h3', artId }: Props) {
  return (
    <ul className={styles.grid}>
      {games.map((game) => (
        <li key={game.id} className={styles.item}>
          <GameCard game={game} headingLevel={headingLevel} compact artId={artId} />
        </li>
      ))}
    </ul>
  );
}
