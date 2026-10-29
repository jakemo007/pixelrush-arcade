'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { NAV_LINKS, currentFor, useCurrentPath } from './NavLinks';
import styles from './SiteHeader.module.css';

export interface MenuCategory {
  href: string;
  label: string;
  count: number;
}

const WIDE_QUERY = '(min-width: 761px)';

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" focusable="false">
      {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

export function MobileMenu({ categories, totalGames }: { categories: readonly MenuCategory[]; totalGames: number }) {
  const path = useCurrentPath();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const categoriesLabelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenOn(null);
      buttonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && (panelRef.current?.contains(target) || buttonRef.current?.contains(target))) return;
      setOpenOn(null);
    };
    const wide = window.matchMedia(WIDE_QUERY);
    const onWide = () => {
      if (wide.matches) setOpenOn(null);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      wide.removeEventListener('change', onWide);
    };
  }, [open]);

  const close = () => setOpenOn(null);
  const [gamesLink, ...otherLinks] = NAV_LINKS;

  return (
    <div className={styles.mobile}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.menuButton}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpenOn(open ? null : path)}
      >
        <MenuIcon open={open} />
        <span>Menu</span>
      </button>
      <div ref={panelRef} id={panelId} className={styles.panel} hidden={!open}>
        <nav aria-label="Main">
          <ul className={styles.panelList}>
            <li>
              <Link href={gamesLink.href} className={styles.panelLink} aria-current={currentFor(path, gamesLink.href)} onClick={close}>
                All games <span className={styles.panelCount}>{totalGames}</span>
              </Link>
            </li>
          </ul>
          <p id={categoriesLabelId} className={styles.panelHeading}>
            Categories
          </p>
          <ul className={styles.panelCategories} aria-labelledby={categoriesLabelId}>
            {categories.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className={styles.panelLink} aria-current={currentFor(path, c.href)} onClick={close}>
                  {c.label} <span className={styles.panelCount}>{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className={styles.panelList}>
            {otherLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.panelLink} aria-current={currentFor(path, link.href)} onClick={close}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
