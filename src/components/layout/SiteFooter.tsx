import Link from 'next/link';
import { GAMES, gamePath } from '@/config/games';
import { siteConfig } from '@/config/site';
import { GUIDES } from '@/content/guides';
import { LogoMark } from './Logo';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.about}>
          <p className={styles.brand}>
            <LogoMark size={28} /> {siteConfig.name}
          </p>
          <p className="muted small">{siteConfig.tagline}</p>
          <p className="muted small">
            Personal bests and daily progress are stored only in your browser. There are no accounts and no global leaderboards.
          </p>
        </div>
        <nav aria-label="Games" className={styles.column}>
          <p className={styles.heading}>Games</p>
          <ul>
            {GAMES.map((g) => (
              <li key={g.id}>
                <Link href={gamePath(g.id)}>{g.name}</Link>
              </li>
            ))}
            <li>
              <Link href="/daily-challenge/">Daily Challenge</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Guides" className={styles.column}>
          <p className={styles.heading}>Guides</p>
          <ul>
            {GUIDES.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}/`}>{g.shortTitle}</Link>
              </li>
            ))}
            <li>
              <Link href="/guides/">All guides</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Site" className={styles.column}>
          <p className={styles.heading}>Site</p>
          <ul>
            <li>
              <Link href="/about/">About</Link>
            </li>
            <li>
              <Link href="/contact/">Contact</Link>
            </li>
            <li>
              <Link href="/privacy/">Privacy</Link>
            </li>
            <li>
              <Link href="/terms/">Terms</Link>
            </li>
          </ul>
          {siteConfig.social.length > 0 && (
            <ul className={styles.social}>
              {siteConfig.social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} rel="noopener noreferrer me">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </div>
      <div className={`container ${styles.bottom}`}>
        <p className="small muted">
          © {year} {siteConfig.name}. All games, artwork and sounds are original.
        </p>
      </div>
    </footer>
  );
}
