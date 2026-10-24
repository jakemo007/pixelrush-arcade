import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { gamePath, getGame } from '@/config/games';
import { GUIDES } from '@/content/guides';
import { pageMetadata } from '@/lib/seo/metadata';
import styles from './guides.module.css';

export const metadata = pageMetadata({
  title: 'Arcade Game Guides and Tips',
  description:
    'Practical guides for PixelRush Arcade games: endless runner tips, how to get better at Brick Breaker and Space Survival strategies.',
  path: '/guides/',
});

export default function GuidesPage() {
  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides/' },
        ]}
      />
      <header style={{ paddingBlock: 'var(--space-6) var(--space-5)' }}>
        <h1>Guides</h1>
        <p className="lead">
          Advice written around how each of our games actually works: the timing windows, the scoring rules and the enemy
          patterns.
        </p>
      </header>
      <ul className={styles.list}>
        {GUIDES.map((guide) => {
          const game = getGame(guide.gameId);
          return (
            <li key={guide.slug} className={styles.item}>
              <p className={styles.game}>{game.name}</p>
              <h2 className={styles.title}>
                <Link href={`/guides/${guide.slug}/`}>{guide.title}</Link>
              </h2>
              <p className="muted">{guide.description}</p>
              <p className="small muted">
                {guide.readingMinutes} min read · <Link href={gamePath(game.id)}>Play {game.name}</Link>
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
