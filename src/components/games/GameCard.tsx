import Link from 'next/link';
import { defaultVariant, gamePath, getCategory, type GameInfo } from '@/config/games';
import { GameArt } from './GameArt';
import { PersonalBestBadge } from './PersonalBestBadge';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: GameInfo;
  headingLevel?: 'h2' | 'h3';
  featured?: boolean;
  compact?: boolean;
  artId?: string;
}

export function GameCard({ game, headingLevel = 'h3', featured = false, compact = false, artId }: GameCardProps) {
  const Heading = headingLevel;
  const href = gamePath(game.id);
  const category = getCategory(game.categories[0]!);
  const variantClass = compact ? styles.compact : featured ? styles.featured : '';
  return (
    <article className={`${styles.card} ${styles[game.accent]} ${variantClass}`}>
      <Link href={href} className={styles.artLink} tabIndex={-1} aria-hidden="true">
        <GameArt gameId={game.id} className={styles.art} idSuffix={artId ?? (featured ? 'featured' : compact ? 'compact' : 'card')} />
        {featured && <span className={styles.badge}>Featured</span>}
      </Link>
      <div className={styles.body}>
        <p className={styles.category}>{category.name}</p>
        <Heading className={styles.title}>
          <Link href={href}>{game.name}</Link>
        </Heading>
        <p className={styles.summary}>{featured ? game.summary : game.tagline}</p>
        {!compact && (
          <ul className={`tag-list ${styles.tags}`} aria-label="Game features">
            {game.tags.map((tag) => (
              <li key={tag} className="pill">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div className={styles.footer}>
          <Link href={href} className={`btn btn-primary btn-sm ${styles.play}`} aria-label={`Play ${game.name}`}>
            Play now
          </Link>
          {game.best && (
            <PersonalBestBadge
              gameId={game.id}
              best={game.best}
              variant={defaultVariant(game)}
              variantLabel={game.engine === 'dom' ? game.variants?.[0]?.label : undefined}
            />
          )}
        </div>
      </div>
    </article>
  );
}
