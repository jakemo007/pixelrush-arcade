import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdSlot } from '@/components/advertising/AdSlot';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { gamePath, getGame } from '@/config/games';
import { GUIDES, getGuide } from '@/content/guides';
import { GUIDE_BODIES } from '@/content/guides/bodies';
import { pageMetadata } from '@/lib/seo/metadata';
import styles from '../guides.module.css';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return pageMetadata({ title: guide.title, description: guide.description, path: `/guides/${guide.slug}/`, type: 'article' });
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

export default async function GuidePage({ params }: Params) {
  const { slug } = await params;
  const guide = getGuide(slug);
  const Body = GUIDE_BODIES[slug];
  if (!guide || !Body) notFound();

  const game = getGame(guide.gameId);
  const others = GUIDES.filter((g) => g.slug !== guide.slug);

  return (
    <div className="container">
      <Breadcrumbs
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides/' },
          { name: guide.title, path: `/guides/${guide.slug}/` },
        ]}
      />
      <article>
        <header className={styles.articleHeader}>
          <p className="eyebrow">{game.name} guide</p>
          <h1>{guide.title}</h1>
          <p className="lead">{guide.question}</p>
          <p className={styles.meta}>
            <span>
              Updated <time dateTime={guide.updated}>{formatDate(guide.updated)}</time>
            </span>
            <span>{guide.readingMinutes} min read</span>
          </p>
        </header>
        <div className="prose">
          <Body />
        </div>
      </article>

      <div className={`card ${styles.cta}`}>
        <p>
          <strong>Ready to try it?</strong> <span className="muted">{game.tagline}</span>
        </p>
        <Link href={gamePath(game.id)} className="btn btn-primary">
          Play {game.name}
        </Link>
      </div>

      <AdSlot placement="content-page" />

      <section className={`section ${styles.related}`} aria-labelledby="related-title">
        <h2 id="related-title">More guides</h2>
        <ul className={styles.list}>
          {others.map((g) => (
            <li key={g.slug} className={styles.item}>
              <p className={styles.game}>{getGame(g.gameId).name}</p>
              <h3 className={styles.title}>
                <Link href={`/guides/${g.slug}/`}>{g.title}</Link>
              </h3>
              <p className="muted small">{g.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
