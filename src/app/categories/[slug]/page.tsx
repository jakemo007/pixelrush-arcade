import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categorySummaries } from '@/components/catalogue/catalogue-data';
import { CategoryTiles } from '@/components/catalogue/CategoryTiles';
import { GameCard } from '@/components/games/GameCard';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CATEGORIES, GAMES, categoryPath, gamesInCategory, relatedGames, type GameInfo } from '@/config/games';
import { CATEGORY_CONTENT } from '@/content/categories';
import { pageMetadata } from '@/lib/seo/metadata';
import styles from './category.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

type Params = { params: Promise<{ slug: string }> };

const findCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) return {};
  const content = CATEGORY_CONTENT[category.id];
  return pageMetadata({ title: content.metaTitle, description: content.metaDescription, path: categoryPath(category.id) });
}

function suggestionsFor(games: readonly GameInfo[], limit: number): GameInfo[] {
  if (games.length === 0) return GAMES.slice(0, limit);
  const inCategory = new Set(games.map((g) => g.id));
  return relatedGames(games[0]!.id, GAMES.length)
    .filter((g) => !inCategory.has(g.id))
    .slice(0, limit);
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) notFound();

  const content = CATEGORY_CONTENT[category.id];
  const games = gamesInCategory(category.id);
  const others = categorySummaries().filter((c) => c.id !== category.id);
  const suggestions = games.length < 4 ? suggestionsFor(games, 3) : [];
  const [lead, ...rest] = content.intro;

  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Games', path: '/games/' },
          { name: content.heading, path: categoryPath(category.id) },
        ]}
      />

      <section className={styles.top} aria-labelledby="category-title">
        <header className={styles.header}>
          <p className="eyebrow">Game category</p>
          <h1 id="category-title">{content.heading}</h1>
          {lead && <p className="lead">{lead}</p>}
          {rest.map((p) => (
            <p key={p} className={styles.intro}>
              {p}
            </p>
          ))}
          <p className={styles.count}>
            {games.length === 1 ? '1 game' : `${games.length} games`} · free to play · no sign-up
          </p>
        </header>
        <div className="grid-cards">
          {games.map((game) => (
            <GameCard key={game.id} game={game} headingLevel="h2" />
          ))}
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="section" aria-labelledby="also-title">
          <div className="section-header">
            <div>
              <h2 id="also-title">More games to try</h2>
              <p>From other categories, all free and playable in your browser.</p>
            </div>
            <Link href="/games/" className="btn btn-ghost">
              All games →
            </Link>
          </div>
          <div className="grid-cards">
            {suggestions.map((game) => (
              <GameCard key={game.id} game={game} artId="also" />
            ))}
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="other-categories-title">
        <div className="section-header">
          <div>
            <h2 id="other-categories-title">Other categories</h2>
          </div>
        </div>
        <CategoryTiles categories={others} allGamesCount={GAMES.length} showBlurb wide />
      </section>
    </div>
  );
}
