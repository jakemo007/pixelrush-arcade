import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { LogoWordmark } from './Logo';
import { NavLinks } from './NavLinks';
import styles from './SiteHeader.module.css';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={`${siteConfig.name} home`}>
          <LogoWordmark />
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          <NavLinks />
        </nav>
      </div>
    </header>
  );
}
