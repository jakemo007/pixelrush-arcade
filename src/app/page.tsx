import Link from 'next/link';
import { categorySummaries, listNames, searchIndexFor } from '@/components/catalogue/catalogue-data';
import { CatalogueProvider, CatalogueResults, CatalogueSearch, HideWhileSearching } from '@/components/catalogue/CatalogueFilter';
import { CategoryTiles } from '@/components/catalogue/CategoryTiles';
import { GameGrid } from '@/components/catalogue/GameGrid';
import { sortByRecentlyAdded } from '@/components/catalogue/search';
import { DailyChallengeCard } from '@/components/daily/DailyChallengeCard';
import { GameCard } from '@/components/games/GameCard';
import { JsonLd } from '@/components/ui/JsonLd';
import { CATEGORIES, CHALLENGE_GAME_IDS, GAMES, getGame } from '@/config/games';
import { siteConfig } from '@/config/site';
import { GUIDES } from '@/content/guides';
import { pageMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/site-url';
import styles from './page.module.css';

export const metadata = pageMetadata({
  title: `${siteConfig.name}: Free Original Browser Arcade Games`,
  description: siteConfig.description,
  path: '/',
  absoluteTitle: true,
});

const FEATURED = GAMES.filter((g) => g.featured);
const RECENT = sortByRecentlyAdded(GAMES).slice(0, 4);
const CHALLENGE_NAMES = listNames(CHALLENGE_GAME_IDS.map((id) => getGame(id).name));

const FEATURES = [
  {
    title: 'Instant play',
    body: 'Games load in a moment and start with one click or tap. Nothing to download, install or sign up for.',
    icon: 'bolt',
  },
  {
    title: 'Something for every mood',
    body: `${GAMES.length} games in ${CATEGORIES.length} categories, from two-minute arcade runs to a slow game of chess or a quiet round of solitaire.`,
    icon: 'grid',
  },
  {
    title: 'Made for every screen',
    body: 'Keyboard, mouse and touch controls on every game, with layouts that fit phones, tablets and desktops.',
    icon: 'devices',
  },
  {
    title: 'Your best, remembered',
    body: 'Best scores and times are saved in your own browser, for each game and difficulty, so you can come back and beat yourself. No account needed.',
    icon: 'trophy',
  },
] as const;

function FeatureIcon({ name }: { name: (typeof FEATURES)[number]['icon'] }) {
  const common = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  switch (name) {
    case 'bolt':
      return (
        <svg {...common}>
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.8" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" />
        </svg>
      );
    case 'devices':
      return (
        <svg {...common}>
          <rect x="2" y="4" width="14" height="10" rx="1.5" />
          <path d="M6 18h6" />
          <rect x="17" y="8" width="5" height="12" rx="1.2" />
        </svg>
      );
    case 'trophy':
      return (
        <svg {...common}>
          <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
          <path d="M16 6h3a3 3 0 0 1-3 4M8 6H5a3 3 0 0 0 3 4M12 13v4M8 21h8M9 17h6" />
        </svg>
      );
  }
}

export default function HomePage() {
  const categories = categorySummaries();
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: siteConfig.name,
          url: absoluteUrl('/'),
          description: siteConfig.description,
        }}
      />

      <CatalogueProvider entries={searchIndexFor(GAMES)}>
        <section className={`container ${styles.hero}`} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className="eyebrow">{siteConfig.name}</p>
            <h1 id="hero-title" className={styles.heroTitle}>
              Original browser games that start in a <span className={styles.highlight}>second</span>.
            </h1>
            <p className="lead">
              {GAMES.length} free games made for this site: arcade action, card and board games, logic and word puzzles, sports and
              racing. No downloads, no accounts, and they play just as well on your phone.
            </p>
            <div className={styles.heroSearch}>
              <CatalogueSearch label="Find a game" placeholder="Try “solitaire” or “cards”" size="large" summary />
            </div>
            <ul className={styles.heroPoints}>
              <li>No sign-up</li>
              <li>Keyboard, mouse &amp; touch</li>
              <li>Personal bests saved in your browser</li>
            </ul>
          </div>

          <HideWhileSearching narrowOnly>
            <section className={styles.categoryPanel} aria-labelledby="categories-title">
              <h2 id="categories-title" className={styles.panelTitle}>
                Browse by category
              </h2>
              <CategoryTiles categories={categories} allGamesCount={GAMES.length} />
            </section>
          </HideWhileSearching>
        </section>

        <HideWhileSearching>
          <section className={`container section ${styles.firstSection}`} aria-labelledby="featured-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">Featured</p>
                <h2 id="featured-title">Good places to start</h2>
                <p>A few favourites from across the catalogue.</p>
              </div>
            </div>
            <ul className={`grid-cards ${styles.featuredList}`}>
              {FEATURED.map((game) => (
                <li key={game.id}>
                  <GameCard game={game} artId="feat" />
                </li>
              ))}
            </ul>
          </section>

          <section className="container section" aria-labelledby="recent-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">New</p>
                <h2 id="recent-title">Recently added</h2>
                <p>The newest games on {siteConfig.shortName}.</p>
              </div>
              <Link href="/games/" className="btn btn-ghost">
                All games →
              </Link>
            </div>
            <GameGrid games={RECENT} artId="new" />
          </section>

          <section className={`container section ${styles.dailySection}`} aria-labelledby="daily-title">
            <div className="section-header">
              <div>
                <p className="eyebrow">Daily Challenge</p>
                <h2 id="daily-title">Today&apos;s challenge</h2>
                <p>
                  One goal a day for one of the original arcade games ({CHALLENGE_NAMES}), the same for everyone. Resets every
                  day at 00:00 UTC.
                </p>
              </div>
            </div>
            <DailyChallengeCard variant="compact" headingLevel="h3" />
          </section>
        </HideWhileSearching>

        <section className={`container section ${styles.catalogue}`} aria-labelledby="games-title">
          <div className="section-header">
            <div>
              <p className="eyebrow">Game catalogue</p>
              <h2 id="games-title">All games</h2>
              <p>Every game is free to play in your browser, with no sign-up.</p>
            </div>
            <Link href="/games/" className="btn btn-ghost">
              Filter by category →
            </Link>
          </div>
          <CatalogueResults items={GAMES.map((game) => ({ id: game.id, card: <GameCard game={game} compact artId="all" /> }))} />
        </section>
      </CatalogueProvider>

      <section className="container section" aria-labelledby="why-title">
        <div className="section-header">
          <div>
            <p className="eyebrow">Why {siteConfig.shortName}</p>
            <h2 id="why-title">Quick to start, worth coming back to</h2>
          </div>
        </div>
        <ul className={styles.features}>
          {FEATURES.map((f) => (
            <li key={f.title} className={styles.feature}>
              <span className={styles.featureIcon}>
                <FeatureIcon name={f.icon} />
              </span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className="muted">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container section" aria-labelledby="guides-title">
        <div className="section-header">
          <div>
            <p className="eyebrow">Guides</p>
            <h2 id="guides-title">Play better with our guides</h2>
            <p>Practical, game-specific advice written around how each game actually works.</p>
          </div>
          <Link href="/guides/" className="btn btn-ghost">
            All guides →
          </Link>
        </div>
        <ul className={styles.guides}>
          {GUIDES.map((guide) => (
            <li key={guide.slug} className={styles.guide}>
              <p className={styles.guideGame}>{getGame(guide.gameId).name}</p>
              <h3 className={styles.guideTitle}>
                <Link href={`/guides/${guide.slug}/`}>{guide.title}</Link>
              </h3>
              <p className="muted small">{guide.description}</p>
              <p className="small muted">{guide.readingMinutes} min read</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
