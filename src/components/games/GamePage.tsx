import Link from 'next/link';
import type { Metadata } from 'next';
import { categoryPath, gamePath, getCategory, getGame, isChallengeGameId, relatedGames, type GameId } from '@/config/games';
import { GAME_CONTENT } from '@/content/games';
import { getGuide } from '@/content/guides';
import { pageMetadata } from '@/lib/seo/metadata';
import { AdSlot } from '../advertising/AdSlot';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { DomGameShell } from './DomGameShell';
import { GameCard } from './GameCard';
import { GameShell } from './GameShell';
import styles from './GamePage.module.css';

export function gameMetadata(id: GameId): Metadata {
  const content = GAME_CONTENT[id];
  const game = getGame(id);
  return pageMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: gamePath(id),
    image: { path: `/og/${id}.png`, alt: `${game.name}: ${game.tagline}` },
  });
}

export function GamePage({ gameId }: { gameId: GameId }) {
  const game = getGame(gameId);
  const content = GAME_CONTENT[gameId];
  const guide = game.guideSlug ? getGuide(game.guideSlug) : undefined;
  const primaryCategory = getCategory(game.categories[0]!);

  return (
    <>
      <div className="container">
        <Breadcrumbs
          items={[
            { name: 'Home', path: '/' },
            { name: 'Games', path: '/games/' },
            { name: game.name, path: gamePath(gameId) },
          ]}
        />
      </div>

      <section className={`container ${styles.play}`} aria-labelledby="game-title">
        <header className={styles.header}>
          <div>
            <p className="eyebrow">{game.genre}</p>
            <h1 id="game-title" className={styles.title}>
              {game.name}
            </h1>
          </div>
          <p className={styles.tagline}>{game.tagline}</p>
        </header>
        {game.engine === 'canvas' ? <GameShell gameId={gameId} /> : <DomGameShell gameId={gameId} />}
      </section>

      <div className={`container ${styles.content}`}>
        <article className={`prose ${styles.article}`}>
          <h2 id="about">About {game.name}</h2>
          {content.intro.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <h3 id="objective">Objective</h3>
          <p>{content.objective}</p>
          {content.rules && content.rules.length > 0 && (
            <>
              <h3 id="rules">Rules</h3>
              <ul>
                {content.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </>
          )}

          <h2 id="how-to-play">How to play</h2>
          <ol>
            {content.howToPlay.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <h2 id="controls">Controls</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Keyboard</th>
                  <th scope="col">Touch / mouse</th>
                </tr>
              </thead>
              <tbody>
                {content.controls.map((row) => (
                  <tr key={row.action}>
                    <th scope="row">{row.action}</th>
                    <td>
                      {row.keys.length === 0 ? (
                        <span className="muted">{row.keysNote ?? '–'}</span>
                      ) : (
                        row.keys.map((k, i) => (
                          <span key={k}>
                            {i > 0 && ' '}
                            {k.length <= 6 ? <kbd>{k}</kbd> : k}
                          </span>
                        ))
                      )}
                    </td>
                    <td>{row.touch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 id="scoring">Scoring</h2>
          <ul>
            {content.scoring.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <h2 id="difficulty">{content.difficultyTitle ?? 'How the difficulty increases'}</h2>
          <ul>
            {content.difficulty.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>

          <h2 id="tips">Beginner tips</h2>
          <ul>
            {content.tips.map((tip) => (
              <li key={tip.title}>
                <strong>{tip.title}.</strong> {tip.body}
              </li>
            ))}
          </ul>
          {guide && (
            <p>
              Want more? Read the full guide: <Link href={`/guides/${guide.slug}/`}>{guide.title}</Link>.
            </p>
          )}

          <h2 id="faq">Frequently asked questions</h2>
          <div className="faq">
            {content.faq.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <div>
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </article>

        <aside className={styles.sidebar} aria-label={`${game.name} at a glance`}>
          <div className="card">
            <h2 className={styles.sideTitle}>At a glance</h2>
            <dl className={styles.facts}>
              <div>
                <dt>Genre</dt>
                <dd>{game.genre}</dd>
              </div>
              <div>
                <dt>Typical run</dt>
                <dd>{game.sessionLength}</dd>
              </div>
              <div>
                <dt>Keyboard</dt>
                <dd>{game.controls.keyboard}</dd>
              </div>
              <div>
                <dt>Touch</dt>
                <dd>{game.controls.touch}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>Free, no account needed</dd>
              </div>
              <div>
                <dt>{game.best ? 'Personal bests' : 'Progress'}</dt>
                <dd>Saved in this browser only</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>
                  {game.categories.map((c, i) => (
                    <span key={c}>
                      {i > 0 && ', '}
                      <Link href={categoryPath(c)}>{getCategory(c).name}</Link>
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
          {isChallengeGameId(gameId) && (
            <div className="card">
              <h2 className={styles.sideTitle}>Daily Challenge</h2>
              <p className="muted small">
                A new goal every day at 00:00 UTC, rotating between Neon Dash, Brick Breaker and Space Survival.
              </p>
              <Link href="/daily-challenge/" className="btn btn-secondary btn-sm">
                See today&apos;s challenge
              </Link>
            </div>
          )}
        </aside>
      </div>

      <div className="container">
        <AdSlot placement="game-page" />
        <section className="section" aria-labelledby="more-games">
          <div className="section-header">
            <div>
              <h2 id="more-games">You might also like</h2>
              <p>All free, all original, all playable in your browser.</p>
            </div>
            <div className="btn-row">
              <Link href={categoryPath(primaryCategory.id)} className="btn btn-ghost">
                More {primaryCategory.name.toLowerCase().replace(/ games$/, '')} games →
              </Link>
              <Link href="/games/" className="btn btn-ghost">
                All games →
              </Link>
            </div>
          </div>
          <div className="grid-cards">
            {relatedGames(gameId, 6).map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
