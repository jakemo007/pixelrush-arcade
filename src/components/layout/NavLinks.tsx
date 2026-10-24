'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SiteHeader.module.css';

const LINKS = [
  { href: '/games/', label: 'Games' },
  { href: '/daily-challenge/', label: 'Daily Challenge' },
  { href: '/guides/', label: 'Guides' },
  { href: '/about/', label: 'About' },
];

/** Primary navigation; marks the current section with aria-current. */
export function NavLinks() {
  const pathname = usePathname() ?? '/';
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return (
    <ul className={styles.navList}>
      {LINKS.map((link) => {
        const exact = normalized === link.href;
        const inSection = normalized.startsWith(link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              className={styles.navLink}
              aria-current={exact ? 'page' : inSection ? 'true' : undefined}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
