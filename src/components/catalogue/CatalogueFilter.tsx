'use client';

import {
  createContext,
  use,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import type { GameCategory, GameId } from '@/config/games';
import { describeResults, filterEntries, normalizeText, type CatalogueFilters, type SearchEntry } from './search';
import styles from './Catalogue.module.css';

export interface CategoryOption {
  id: GameCategory;
  name: string;
  count: number;
}

export interface CatalogueItem {
  id: GameId;
  card: ReactNode;
}

interface CatalogueContextValue {
  filters: CatalogueFilters;
  setQuery: (query: string) => void;
  setCategory: (category: GameCategory | null) => void;
  visible: ReadonlySet<GameId>;
  total: number;
  filtering: boolean;
  categories: readonly CategoryOption[];
  inputRef: RefObject<HTMLInputElement | null>;
  statusRef: RefObject<HTMLParagraphElement | null>;
}

const CatalogueContext = createContext<CatalogueContextValue | null>(null);

function useCatalogue(): CatalogueContextValue {
  const value = use(CatalogueContext);
  if (!value) throw new Error('Catalogue components must be rendered inside <CatalogueProvider>.');
  return value;
}

const MAX_QUERY = 80;
const NO_FILTERS: CatalogueFilters = { query: '', category: null };
const NO_CATEGORIES: readonly CategoryOption[] = [];

function subscribeToHistory(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}
const readLocationSearch = () => window.location.search;
const noLocationSearch = () => '';

function filtersFromSearch(search: string, categories: readonly CategoryOption[]): CatalogueFilters {
  if (!search) return NO_FILTERS;
  const params = new URLSearchParams(search);
  const query = (params.get('q') ?? '').slice(0, MAX_QUERY);
  const requested = params.get('category');
  const category = categories.find((c) => c.id === requested)?.id ?? null;
  return { query, category };
}

function writeFiltersToUrl({ query, category }: CatalogueFilters): void {
  const url = new URL(window.location.href);
  const q = query.trim();
  if (q) url.searchParams.set('q', q);
  else url.searchParams.delete('q');
  if (category) url.searchParams.set('category', category);
  else url.searchParams.delete('category');
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

interface ProviderProps {
  entries: readonly SearchEntry[];
  categories?: readonly CategoryOption[];
  syncUrl?: boolean;
  children: ReactNode;
}

export function CatalogueProvider({ entries, categories = NO_CATEGORIES, syncUrl = false, children }: ProviderProps) {
  const locationSearch = useSyncExternalStore(subscribeToHistory, syncUrl ? readLocationSearch : noLocationSearch, noLocationSearch);
  const [edited, setEdited] = useState<CatalogueFilters | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  const fromUrl = useMemo(() => filtersFromSearch(locationSearch, categories), [locationSearch, categories]);
  const filters = edited ?? fromUrl;
  const visible = useMemo(() => new Set(filterEntries(entries, filters)), [entries, filters]);

  const update = (next: CatalogueFilters) => {
    setEdited(next);
    if (syncUrl) writeFiltersToUrl(next);
  };

  const value: CatalogueContextValue = {
    filters,
    setQuery: (query) => update({ ...filters, query: query.slice(0, MAX_QUERY) }),
    setCategory: (category) => update({ ...filters, category }),
    visible,
    total: entries.length,
    filtering: normalizeText(filters.query) !== '' || filters.category !== null,
    categories,
    inputRef,
    statusRef,
  };

  return <CatalogueContext value={value}>{children}</CatalogueContext>;
}

function SearchIcon() {
  return (
    <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

interface SearchProps {
  label: string;
  placeholder?: string;
  size?: 'default' | 'large';
  summary?: boolean;
}

export function CatalogueSearch({ label, placeholder, size = 'default', summary = false }: SearchProps) {
  const { filters, setQuery, visible, total, inputRef, statusRef } = useCatalogue();
  const inputId = useId();
  const hasQuery = normalizeText(filters.query) !== '';

  const showResults = () => {
    const status = statusRef.current;
    if (!status) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    status.focus({ preventScroll: true });
    status.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasQuery) showResults();
  };

  const clear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <form role="search" action="/games/" method="get" className={`${styles.search} ${size === 'large' ? styles.searchLarge : ''}`} onSubmit={onSubmit}>
      <label htmlFor={inputId} className={styles.searchLabel}>
        {label}
      </label>
      <div className={styles.searchBox}>
        <SearchIcon />
        <input
          ref={inputRef}
          id={inputId}
          className={styles.input}
          type="search"
          name="q"
          value={filters.query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          maxLength={MAX_QUERY}
          data-catalogue-search=""
        />
        {filters.query !== '' && (
          <button type="button" className={styles.clearButton} onClick={clear} aria-label="Clear search">
            <ClearIcon />
          </button>
        )}
      </div>
      {summary && hasQuery && (
        <p className={styles.summary}>
          <span>{describeResults({ count: visible.size, total, query: filters.query, categoryName: null })}.</span>
          {visible.size > 0 && (
            <button type="button" className={styles.summaryButton} onClick={showResults}>
              Show results ↓
            </button>
          )}
        </p>
      )}
    </form>
  );
}

export function CategoryChips() {
  const { filters, setCategory, categories, total } = useCatalogue();
  return (
    <div role="group" aria-label="Filter by category" className={styles.chips}>
      <button type="button" className={styles.chip} aria-pressed={filters.category === null} onClick={() => setCategory(null)}>
        All games <span className={styles.chipCount} aria-hidden="true">{total}</span>
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          className={styles.chip}
          aria-pressed={filters.category === c.id}
          onClick={() => setCategory(filters.category === c.id ? null : c.id)}
        >
          {c.name}{' '}
          <span className={styles.chipCount} aria-hidden="true">
            {c.count}
          </span>
          <span className="visually-hidden">, {c.count === 1 ? '1 game' : `${c.count} games`}</span>
        </button>
      ))}
    </div>
  );
}

interface ResultsProps {
  items: readonly CatalogueItem[];
}

export function CatalogueResults({ items }: ResultsProps) {
  const { filters, setQuery, setCategory, visible, total, categories, inputRef, statusRef } = useCatalogue();
  const count = items.filter((item) => visible.has(item.id)).length;
  const categoryName = categories.find((c) => c.id === filters.category)?.name ?? null;
  const status = describeResults({ count, total, query: filters.query, categoryName });
  const hasQuery = normalizeText(filters.query) !== '';

  return (
    <>
      <p ref={statusRef} className={styles.status} role="status" aria-live="polite" tabIndex={-1} data-catalogue-status="">
        {status}
      </p>
      <ul className={styles.grid} data-catalogue-grid="">
        {items.map((item) => (
          <li key={item.id} className={styles.item} hidden={!visible.has(item.id)} data-game-id={item.id}>
            {item.card}
          </li>
        ))}
      </ul>
      {count === 0 && (
        <div className={styles.empty} data-catalogue-empty="">
          <p className={styles.emptyTitle}>No games found</p>
          <p className={styles.emptyText}>
            Check the spelling, or try a kind of game such as <strong>cards</strong>, <strong>words</strong>,{' '}
            <strong>puzzle</strong> or <strong>racing</strong>.
          </p>
          <div className={`btn-row ${styles.emptyActions}`}>
            {hasQuery && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
              >
                Clear search
              </button>
            )}
            {filters.category !== null && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setCategory(null);
                  inputRef.current?.focus();
                }}
              >
                Search all categories
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function HideWhileSearching({ children, narrowOnly = false }: { children: ReactNode; narrowOnly?: boolean }) {
  const { filtering } = useCatalogue();
  if (narrowOnly) {
    return (
      <div className={styles.hideNarrow} data-filtering={filtering ? '' : undefined}>
        {children}
      </div>
    );
  }
  return <div hidden={filtering}>{children}</div>;
}
