import Link from 'next/link';
import { DailyChallengeCard } from '@/components/daily/DailyChallengeCard';
import { GameArt } from '@/components/games/GameArt';
import { GameCard } from '@/components/games/GameCard';
import { JsonLd } from '@/components/ui/JsonLd';
import { GAMES, gamePath, getGame } from '@/config/games';
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

const FEATURED = getGame('neon-dash');

const FEATURES = [
  {
    title: 'Instant play',
    body: 'Games load in a moment and start with one click or tap. Nothing to download, install or sign up for.',
    icon: 'bolt',
  },
  {
    title: 'Made for every screen',
    body: 'Keyboard, mouse and touch controls on every game, with layouts that fit phones, tablets and desktops.',
    icon: 'devices',
  },
  {
    title: 'Your best, remembered',
    body: 'Personal bests are saved in your own browser, so you can come back and try to beat yourself. No account needed.',
    icon: 'trophy',
  },
  {
    title: 'A new challenge daily',
    body: 'Every day at 00:00 UTC a new goal appears for one of the games, with the same course or waves for everyone.',
    icon: 'calendar',
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
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
  }
}

export default function HomePage() {
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

      <section className={`container ${styles.hero}`} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className="eyebrow">Free browser arcade</p>
          <h1 id="hero-title" className={styles.heroTitle}>
            Original arcade games that start in a <span className={styles.highlight}>second</span>.
          </h1>
          <p className="lead">
            Three hand-built games: an endless runner, a brick breaker and a space survival shooter. No downloads, no accounts, and
            they play just as well on your phone.
          </p>
          <div className="btn-row">
            <Link href={gamePath(FEATURED.id)} className="btn btn-primary">
              Play {FEATURED.name}
            </Link>
            <Link href="/games/" className="btn btn-secondary">
              Browse all games
            </Link>
          </div>
          <ul className={styles.heroPoints}>
            <li>No sign-up</li>
            <li>Keyboard, mouse &amp; touch</li>
            <li>Personal bests saved in your browser</li>
          </ul>
        </div>

        <Link href={gamePath(FEATURED.id)} className={styles.spotlight} aria-label={`Featured game: play ${FEATURED.name}`}>
          <GameArt gameId={FEATURED.id} idSuffix="hero" className={styles.spotlightArt} />
          <span className={styles.spotlightCaption}>
            <span className={styles.spotlightBadge}>Featured</span>
            <span className={styles.spotlightName}>{FEATURED.name}</span>
            <span className={styles.spotlightTag}>{FEATURED.tagline}</span>
          </span>
        </Link>
      </section>

      <section className={`container section ${styles.dailySection}`} aria-labelledby="daily-title">
        <div className="section-header">
          <div>
            <p className="eyebrow">Daily Challenge</p>
            <h2 id="daily-title">Today&apos;s challenge</h2>
            <p>One goal, one game, the same for everyone. Resets every day at 00:00 UTC.</p>
          </div>
        </div>
        <DailyChallengeCard variant="compact" headingLevel="h3" />
      </section>

      <section className="container section" aria-labelledby="games-title">
        <div className="section-header">
          <div>
            <p className="eyebrow">Game catalogue</p>
            <h2 id="games-title">Pick a game and play</h2>
            <p>Every game is fully playable right now, free, in your browser.</p>
          </div>
          <Link href="/games/" className="btn btn-ghost">
            All games →
          </Link>
        </div>
        <div className="grid-cards">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

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
