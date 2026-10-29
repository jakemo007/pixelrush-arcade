import Link from 'next/link';
import { DailyChallengeCard, UpcomingChallenges } from '@/components/daily/DailyChallengeCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CHALLENGE_GAME_IDS, gamePath, getGame } from '@/config/games';
import { GUIDES } from '@/content/guides';
import { MODIFIERS } from '@/games/modifiers';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Daily Challenge: A New Arcade Goal Every Day',
  description:
    'Play the PixelRush Arcade Daily Challenge: one game, one goal and the same seeded course for everyone, refreshed every day at 00:00 UTC.',
  path: '/daily-challenge/',
});

const CHALLENGE_GAMES = CHALLENGE_GAME_IDS.map((id) => ({ id, name: getGame(id).name }));

export default function DailyChallengePage() {
  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Daily Challenge', path: '/daily-challenge/' },
        ]}
      />
      <header style={{ paddingBlock: 'var(--space-6) var(--space-5)' }}>
        <p className="eyebrow">New every day at 00:00 UTC</p>
        <h1>Daily Challenge</h1>
        <p className="lead">
          Each day features one of our games with a single goal to beat. Everyone who plays on the same UTC date gets the same
          challenge and the same seeded layout, so it is a fair test of skill.
        </p>
      </header>

      <DailyChallengeCard variant="full" headingLevel="h2" />

      <section className="section" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title">Coming up</h2>
        <p className="muted">The featured game rotates every day. Goals and modifiers are revealed on the day.</p>
        <UpcomingChallenges days={3} />
      </section>

      <div className="prose">
        <h2 id="how-it-works">How the Daily Challenge works</h2>
        <ul>
          <li>
            <strong>One game per day.</strong> The featured game rotates through {CHALLENGE_GAMES.map((g) => g.name).join(', ')} in a fixed
            order.
          </li>
          <li>
            <strong>One goal.</strong> Goals include reaching a score, surviving for a set time, collecting shards, breaking bricks
            or destroying enemies. Complete it in a single run.
          </li>
          <li>
            <strong>Sometimes a modifier.</strong> Some days add a twist, such as a faster ball or lower gravity. The challenge card
            always tells you which one is active.
          </li>
          <li>
            <strong>The same layout for everyone.</strong> The day’s challenge seeds the game, so every player gets the same Neon
            Dash course, the same Space Survival enemy waves or the same Brick Breaker power-up drops, and every retry replays it.
          </li>
          <li>
            <strong>Unlimited attempts.</strong> Retry as often as you like until the day ends.
          </li>
        </ul>

        <h2 id="time-zone">When does it reset?</h2>
        <p>
          The challenge follows Coordinated Universal Time (UTC). A new challenge starts at 00:00 UTC, which is 8:00 PM Eastern
          Time (7:00 PM in winter) and 5:00 PM Pacific Time (4:00 PM in winter) on the previous calendar day in the United States.
          If you are mid-run when the day changes, you keep playing the challenge you started.
        </p>

        <h2 id="progress">Where is my progress saved?</h2>
        <p>
          Your completion status and best challenge score for each day are stored only in this browser. They are not uploaded or
          verified, and there is no shared leaderboard. Challenge scores are kept separate from your normal personal bests, because
          modifiers change the rules.
        </p>

        <h2 id="modifiers">All modifiers</h2>
        {CHALLENGE_GAMES.map((g) => (
          <div key={g.id}>
            <h3>
              <Link href={gamePath(g.id)}>{g.name}</Link>
            </h3>
            <ul>
              {MODIFIERS[g.id].map((m) => (
                <li key={m.id}>
                  <strong>{m.name}:</strong> {m.description}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <h2 id="tips">Tips for daily challenges</h2>
        <ul>
          <li>Read the goal before you start: a survival goal rewards caution, a score goal rewards risk.</li>
          <li>Because the layout repeats, use your first attempts to learn the tricky sections.</li>
          <li>
            Brush up with our guides:{' '}
            {GUIDES.map((guide, i) => (
              <span key={guide.slug}>
                {i > 0 && ', '}
                <Link href={`/guides/${guide.slug}/`}>{guide.shortTitle}</Link>
              </span>
            ))}
            .
          </li>
        </ul>
      </div>
    </div>
  );
}
