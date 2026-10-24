'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { gamePath, getGame } from '@/config/games';
import { formatDateKey, getChallengeForDateKey, msUntilNextChallenge } from '@/lib/daily/challenge';
import { getDailyEntry } from '@/lib/storage/daily-progress';
import { useLocalValue } from '@/lib/storage/use-local-value';
import { GameArt } from '../games/GameArt';
import { useMinuteClock, useUtcDateKey } from './use-utc-clock';
import styles from './DailyChallengeCard.module.css';

function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

interface Props {
  /** "compact" for the homepage teaser, "full" for the challenge page. */
  variant?: 'compact' | 'full';
  headingLevel?: 'h2' | 'h3';
}

export function DailyChallengeCard({ variant = 'full', headingLevel = 'h2' }: Props) {
  const Heading = headingLevel;
  const dateKey = useUtcDateKey();
  const now = useMinuteClock();
  const challenge = useMemo(() => (dateKey ? getChallengeForDateKey(dateKey) : null), [dateKey]);
  const entryJson = useLocalValue(() => (dateKey ? JSON.stringify(getDailyEntry(dateKey)) : 'null'), 'null');
  const entry = useMemo(() => JSON.parse(entryJson) as { best: number; completed: boolean } | null, [entryJson]);

  if (!challenge || now === null) {
    // Same footprint as the loaded card, so nothing jumps when it appears.
    return (
      <div className={`${styles.card} ${styles[variant]} ${styles.skeleton}`} aria-busy="true">
        <p className="muted">Loading today&apos;s challenge…</p>
      </div>
    );
  }

  const game = getGame(challenge.gameId);
  const playHref = `${gamePath(game.id)}?mode=daily`;
  const countdown = formatCountdown(msUntilNextChallenge(new Date(now)));

  return (
    <div className={`${styles.card} ${styles[variant]} ${styles[game.accent]}`}>
      <div className={styles.art}>
        <GameArt gameId={game.id} idSuffix={`daily-${variant}`} />
      </div>
      <div className={styles.body}>
        <p className={styles.date}>
          <time dateTime={challenge.dateKey}>{formatDateKey(challenge.dateKey)}</time> · UTC
        </p>
        <Heading className={styles.title}>
          {challenge.title} <span className={styles.gameName}>in {game.name}</span>
        </Heading>
        <p className={styles.goal}>{challenge.goal.description}</p>
        <p className={styles.modifier}>
          {challenge.modifier ? (
            <>
              <span className="pill pill-accent">{challenge.modifier.name}</span> {challenge.modifier.description}
            </>
          ) : (
            <>
              <span className="pill">Standard rules</span> No modifier today.
            </>
          )}
        </p>
        {variant === 'full' && (
          <p className="muted small">
            Everyone gets the same seeded {game.id === 'brick-breaker' ? 'power-up drops' : game.id === 'neon-dash' ? 'course' : 'enemy waves'} today, and
            every retry replays it.
          </p>
        )}
        <div className={styles.status}>
          {entry?.completed ? (
            <span className="pill pill-success">Completed today ✓</span>
          ) : entry ? (
            <span className="pill">Not completed yet</span>
          ) : null}
          {entry && entry.best > 0 && <span className="pill">Your best today: {entry.best.toLocaleString('en-US')}</span>}
          <span className="pill">New challenge in {countdown}</span>
        </div>
        <div className="btn-row">
          <Link href={playHref} className="btn btn-primary">
            {entry?.completed ? 'Play again' : 'Play the challenge'}
          </Link>
          {variant === 'compact' ? (
            <Link href="/daily-challenge/" className="btn btn-ghost">
              How daily challenges work
            </Link>
          ) : (
            <Link href={`${gamePath(game.id)}#how-to-play`} className="btn btn-ghost">
              How to play {game.name}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** "Coming up" list for the next few days, computed in the browser. */
export function UpcomingChallenges({ days = 3 }: { days?: number }) {
  const dateKey = useUtcDateKey();
  const upcoming = useMemo(() => {
    if (!dateKey) return null;
    const base = Date.parse(`${dateKey}T00:00:00Z`);
    return Array.from({ length: days }, (_, i) => {
      const key = new Date(base + (i + 1) * 86_400_000).toISOString().slice(0, 10);
      return getChallengeForDateKey(key)!;
    });
  }, [dateKey, days]);

  return (
    <ul className={styles.upcoming} aria-busy={upcoming === null}>
      {(upcoming ?? Array.from({ length: days }, () => null)).map((c, i) => (
        <li key={c?.dateKey ?? i} className={styles.upcomingItem}>
          {c ? (
            <>
              <span className="muted small">{formatDateKey(c.dateKey).replace(/, \d{4}$/, '')}</span>
              <Link href={gamePath(c.gameId)}>{getGame(c.gameId).name}</Link>
            </>
          ) : (
            <span className="muted small">…</span>
          )}
        </li>
      ))}
    </ul>
  );
}
