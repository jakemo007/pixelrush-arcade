import Link from 'next/link';
import type { Metadata } from 'next';
import { GAMES, gamePath } from '@/config/games';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="container prose" style={{ paddingBlock: 'var(--space-8)' }}>
      <p className="eyebrow">Error 404</p>
      <h1>This level doesn’t exist</h1>
      <p className="lead">The page you were looking for could not be found. It may have moved, or the link may be mistyped.</p>
      <div className="btn-row" style={{ marginBlock: 'var(--space-5)' }}>
        <Link href="/" className="btn btn-primary">
          Go to the homepage
        </Link>
        <Link href="/games/" className="btn btn-secondary">
          Browse games
        </Link>
      </div>
      <h2>Or jump straight into a game</h2>
      <ul>
        {GAMES.map((g) => (
          <li key={g.id}>
            <Link href={gamePath(g.id)}>{g.name}</Link>: {g.tagline}
          </li>
        ))}
      </ul>
    </div>
  );
}
