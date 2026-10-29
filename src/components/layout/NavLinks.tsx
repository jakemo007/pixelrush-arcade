'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SiteHeader.module.css';

export const NAV_LINKS = [
  { href: '/games/', label: 'Games' },
  { href: '/daily-challenge/', label: 'Daily Challenge' },
  { href: '/guides/', label: 'Guides' },
  { href: '/about/', label: 'About' },
] as const;

export function useCurrentPath(): string {
  const pathname = usePathname() ?? '/';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

export function currentFor(path: string, href: string): 'page' | 'true' | undefined {
  if (path === href) return 'page';
  if (href !== '/' && path.startsWith(href)) return 'true';
  return undefined;
}

export function NavLinks() {
  const path = useCurrentPath();
  return (
    <ul className={styles.navList}>
      {NAV_LINKS.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={styles.navLink} aria-current={currentFor(path, link.href)}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
