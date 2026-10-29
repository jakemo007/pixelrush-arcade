import Link from 'next/link';
import { CATEGORIES, GAMES, categoryPath, gamesInCategory } from '@/config/games';
import { siteConfig } from '@/config/site';
import { CATEGORY_CONTENT } from '@/content/categories';
import { LogoWordmark } from './Logo';
import { MobileMenu } from './MobileMenu';
import { NavLinks } from './NavLinks';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  const categories = CATEGORIES.map((c) => ({
    href: categoryPath(c.id),
    label: CATEGORY_CONTENT[c.id].heading,
    count: gamesInCategory(c.id).length,
  }));
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={`${siteConfig.name} home`}>
          <LogoWordmark />
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          <NavLinks />
        </nav>
        <MobileMenu categories={categories} totalGames={GAMES.length} />
      </div>
    </header>
  );
}
