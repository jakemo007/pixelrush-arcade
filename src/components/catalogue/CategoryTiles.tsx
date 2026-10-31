import Link from 'next/link';
import type { GameCategory } from '@/config/games';
import type { CategorySummary } from './catalogue-data';
import { CategoryIcon } from './CategoryIcon';
import styles from './Catalogue.module.css';

interface Props {
  categories: readonly CategorySummary[];
  allGamesCount?: number;
  showBlurb?: boolean;
  wide?: boolean;
  current?: GameCategory;
}

const gamesLabel = (n: number) => (n === 1 ? '1 game' : `${n} games`);

export function CategoryTiles({ categories, allGamesCount, showBlurb = false, wide = false, current }: Props) {
  const tileClass = `${styles.tile} ${showBlurb ? styles.tileWithBlurb : ''}`;
  return (
    <ul className={`${styles.tiles} ${wide ? styles.tilesWide : ''}`}>
      {allGamesCount !== undefined && (
        <li>
          <Link href="/games/" className={tileClass}>
            <span className={styles.tileIcon}>
              <CategoryIcon category="all" size={22} />
            </span>
            <span className={styles.tileText}>
              <span className={styles.tileName}>All games</span>
              <span className={styles.tileMeta}>{gamesLabel(allGamesCount)}</span>
              {showBlurb && <span className={styles.tileBlurb}>The full catalogue, with search and filters.</span>}
            </span>
          </Link>
        </li>
      )}
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={c.href} className={tileClass} aria-current={c.id === current ? 'page' : undefined}>
            <span className={styles.tileIcon}>
              <CategoryIcon category={c.id} size={22} />
            </span>
            <span className={styles.tileText}>
              <span className={styles.tileName}>{c.heading}</span>
              <span className={styles.tileMeta}>{gamesLabel(c.count)}</span>
              {showBlurb && <span className={styles.tileBlurb}>{c.blurb}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
