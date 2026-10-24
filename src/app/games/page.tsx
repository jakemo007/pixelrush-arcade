import Link from 'next/link';
import { GameCard } from '@/components/games/GameCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { GAMES } from '@/config/games';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'All Games: Free Browser Arcade Games',
  description:
    'Browse every PixelRush Arcade game: Neon Dash, Brick Breaker and Space Survival. Free, original and playable instantly on desktop, tablet and mobile.',
  path: '/games/',
});

export default function GamesPage() {
  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Games', path: '/games/' },
        ]}
      />
      <section className="section" aria-labelledby="games-title" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="section-header">
          <div>
            <h1 id="games-title">All games</h1>
            <p className="lead">
              Every game here is original, free and fully playable in your browser with a keyboard, mouse or touch screen.
            </p>
          </div>
        </div>
        <div className="grid-cards">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} headingLevel="h2" />
          ))}
        </div>
      </section>

      <section className="prose" aria-labelledby="scores-title">
        <h2 id="scores-title">How scores and progress work</h2>
        <p>
          Your personal best for each game is stored in your browser’s local storage on this device. Nothing is uploaded, there
          are no accounts and there is no global leaderboard, so the only score you are competing with is your own. Clearing your
          browser’s site data, or using a private window, starts you fresh.
        </p>
        <p>
          For a shared goal, try the <Link href="/daily-challenge/">Daily Challenge</Link>: one game and one target each day,
          with the same seeded course or waves for every player.
        </p>
      </section>
    </div>
  );
}
