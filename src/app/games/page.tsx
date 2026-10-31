import Link from 'next/link';
import { categorySummaries, listNames, searchIndexFor } from '@/components/catalogue/catalogue-data';
import { CatalogueProvider, CatalogueResults, CatalogueSearch, CategoryChips } from '@/components/catalogue/CatalogueFilter';
import { CategoryTiles } from '@/components/catalogue/CategoryTiles';
import { GameCard } from '@/components/games/GameCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CHALLENGE_GAME_IDS, GAMES, getGame } from '@/config/games';
import { pageMetadata } from '@/lib/seo/metadata';
import styles from './games.module.css';

export const metadata = pageMetadata({
  title: 'All Games: Free Online Browser Games',
  description: `Browse all ${GAMES.length} free PixelRush Arcade games: solitaire, sudoku, chess, word puzzles, arcade classics, sports and racing. Search, filter and play.`,
  path: '/games/',
});

const NO_BEST = GAMES.filter((g) => g.best === null).map((g) => g.name);

export default function GamesPage() {
  const categories = categorySummaries();
  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Games', path: '/games/' },
        ]}
      />
      <CatalogueProvider
        entries={searchIndexFor(GAMES)}
        categories={categories.map((c) => ({ id: c.id, name: c.name, count: c.count }))}
        syncUrl
      >
        <section className={styles.catalogue} aria-labelledby="games-title">
          <header className={styles.header}>
            <h1 id="games-title">All games</h1>
            <p className="lead">
              All {GAMES.length} games are original, free and playable in your browser with a keyboard, mouse or touch screen.
              Search by name or filter by category.
            </p>
          </header>
          <div className={styles.toolbar}>
            <CatalogueSearch label="Search games" placeholder="e.g. sudoku or cards" />
            <CategoryChips />
          </div>
          <CatalogueResults
            items={GAMES.map((game) => ({ id: game.id, card: <GameCard game={game} headingLevel="h2" compact artId="all" /> }))}
          />
        </section>
      </CatalogueProvider>

      <section className="section" aria-labelledby="categories-title">
        <div className="section-header">
          <div>
            <h2 id="categories-title">Browse by category</h2>
            <p>Each category page explains what to expect and lists every game in it.</p>
          </div>
        </div>
        <CategoryTiles categories={categories} showBlurb wide />
      </section>

      <section className="prose" aria-labelledby="scores-title">
        <h2 id="scores-title">How scores and progress work</h2>
        <p>
          Your personal best for each game is stored in your browser’s local storage on this device. Games with difficulty levels
          or modes keep a separate best for each one
          {NO_BEST.length > 0 && `, while ${listNames(NO_BEST)} ${NO_BEST.length === 1 ? 'does' : 'do'} not keep a best score`}. Nothing is
          uploaded, there are no accounts and there is no global leaderboard, so the only score you are competing with is your
          own. Clearing your browser’s site data, or using a private window, starts you fresh.
        </p>
        <p>
          For a shared goal, try the <Link href="/daily-challenge/">Daily Challenge</Link>: one target each day for one of{' '}
          {listNames(CHALLENGE_GAME_IDS.map((id) => getGame(id).name))}, with the same seeded course or waves for every player.
        </p>
      </section>
    </div>
  );
}
