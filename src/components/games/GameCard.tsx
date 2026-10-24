import Link from 'next/link';
import { gamePath, type GameInfo } from '@/config/games';
import { GameArt } from './GameArt';
import { PersonalBestBadge } from './PersonalBestBadge';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: GameInfo;
  /** Heading level for the card title, to keep page outlines correct. */
  headingLevel?: 'h2' | 'h3';
  featured?: boolean;
}

export function GameCard({ game, headingLevel = 'h3', featured = false }: GameCardProps) {
  const Heading = headingLevel;
  const href = gamePath(game.id);
  return (
    <article className={`${styles.card} ${styles[game.accent]} ${featured ? styles.featured : ''}`}>
      <Link href={href} className={styles.artLink} tabIndex={-1} aria-hidden="true">
        <GameArt gameId={game.id} className={styles.art} idSuffix={featured ? "featured" : "card"} />
        {featured && <span className={styles.badge}>Featured</span>}
      </Link>
      <div className={styles.body}>
        <p className={styles.genre}>{game.genre}</p>
        <Heading className={styles.title}>
          <Link href={href}>{game.name}</Link>
        </Heading>
        <p className={styles.summary}>{featured ? game.summary : game.tagline}</p>
        <ul className={`tag-list ${styles.tags}`} aria-label="Game features">
          {game.tags.map((tag) => (
            <li key={tag} className="pill">
              {tag}
            </li>
          ))}
        </ul>
        <div className={styles.footer}>
          <Link href={href} className="btn btn-primary btn-sm" aria-label={`Play ${game.name}`}>
            Play now
          </Link>
          <PersonalBestBadge gameId={game.id} />
        </div>
      </div>
    </article>
  );
}
