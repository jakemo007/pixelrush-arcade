import Link from 'next/link';
import { absoluteUrl } from '@/lib/seo/site-url';
import { JsonLd } from './JsonLd';
import styles from './Breadcrumbs.module.css';

export interface Crumb {
  name: string;
  path: string;
}

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className={styles.nav}>
        <ol className={styles.list}>
          {items.map((item, i) => (
            <li key={item.path} className={styles.item}>
              {i < items.length - 1 ? (
                <Link href={item.path}>{item.name}</Link>
              ) : (
                <span aria-current="page">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: absoluteUrl(item.path),
          })),
        }}
      />
    </>
  );
}
