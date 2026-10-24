import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { GAMES, gamePath } from '@/config/games';
import { adsConfig, analyticsConfig } from '@/config/integrations';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'About',
  description: `About ${siteConfig.name}: a small, independent site of original browser arcade games that are free to play, with no accounts required.`,
  path: '/about/',
});

export default function AboutPage() {
  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about/' },
        ]}
      />
      <div className="prose" style={{ paddingTop: 'var(--space-6)' }}>
        <h1>About {siteConfig.name}</h1>
        <p className="lead">
          {siteConfig.name} is a small, independent website of original arcade games that you can play instantly in a web browser.
        </p>

        <h2>What you’ll find here</h2>
        <p>The site currently has three games, each designed and built from scratch for this site:</p>
        <ul>
          {GAMES.map((g) => (
            <li key={g.id}>
              <Link href={gamePath(g.id)}>{g.name}</Link>: {g.summary}
            </li>
          ))}
        </ul>
        <p>
          There is also a <Link href="/daily-challenge/">Daily Challenge</Link> that features one game each day, and a set of{' '}
          <Link href="/guides/">guides</Link> that explain how the games work and how to improve.
        </p>

        <h2>How the site works</h2>
        <ul>
          <li>
            <strong>Free to play, no account.</strong> You do not need to sign up or give any personal information to play.
          </li>
          <li>
            <strong>Scores stay on your device.</strong> Personal bests and daily challenge progress are stored in your browser’s
            local storage. We do not run leaderboards and we do not receive your scores.
          </li>
          <li>
            <strong>Original content.</strong> Every game, graphic and sound effect was created for this site. The artwork is drawn
            with code and the sound effects are synthesized in your browser.
          </li>
          <li>
            <strong>Built for any device.</strong> Every game supports keyboard, mouse and touch controls.
          </li>
          <li>
            <strong>{adsConfig.enabled ? 'Advertising.' : 'No ads right now.'}</strong>{' '}
            {adsConfig.enabled
              ? 'The site shows a small number of clearly labelled ads on content pages, kept away from the games, to help cover running costs.'
              : 'The site does not currently show advertising. If that changes, ads will be clearly labelled, kept away from gameplay and described in our privacy policy.'}
          </li>
          <li>
            <strong>{analyticsConfig.enabled ? 'Analytics.' : 'No analytics right now.'}</strong>{' '}
            {analyticsConfig.enabled
              ? 'We use Google Analytics to understand which pages and games are used, as described in our privacy policy.'
              : 'The site does not currently use analytics or tracking scripts.'}
          </li>
        </ul>

        <h2>Get in touch</h2>
        <p>
          Found a bug, have an idea for a game, or want to say hello? See the <Link href="/contact/">contact page</Link>. You can
          also read our <Link href="/privacy/">privacy policy</Link> and <Link href="/terms/">terms of use</Link>.
        </p>
      </div>
    </div>
  );
}
