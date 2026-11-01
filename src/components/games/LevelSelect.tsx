import type { LevelsConfig } from '@/config/games';
import { levelLockReason, starsForLevel, totalStars, type GameProgress } from '@/lib/progress/levels';
import styles from './LevelSelect.module.css';

interface LevelSelectProps {
  levels: LevelsConfig;
  progress: GameProgress;
  selected: number;
  onSelect(level: number): void;
}

function starText(stars: number): string {
  return '★'.repeat(stars) + '☆'.repeat(3 - stars);
}

export function LevelSelect({ levels, progress, selected, onSelect }: LevelSelectProps) {
  const earned = totalStars(progress);
  return (
    <div className={styles.levelSelect} role="group" aria-label="Choose a level">
      <p className={styles.heading}>
        Choose a level <span className={styles.total}>{earned} ★ earned</span>
      </p>
      <ol className={styles.grid}>
        {Array.from({ length: levels.count }, (_, i) => {
          const level = i + 1;
          const lock = levelLockReason(progress, level, levels.count, levels.gate);
          const stars = starsForLevel(progress, level);
          const label = lock
            ? `Level ${level}, locked. ${lock}.`
            : `Level ${level}, ${stars === 0 ? 'not cleared yet' : `${stars} of 3 stars`}`;
          return (
            <li key={level}>
              <button
                type="button"
                className={styles.level}
                aria-pressed={level === selected}
                aria-disabled={lock ? true : undefined}
                aria-label={label}
                title={lock ?? undefined}
                data-locked={lock ? 'true' : undefined}
                onClick={() => {
                  if (!lock) onSelect(level);
                }}
              >
                <span className={styles.number}>{lock ? '🔒' : level}</span>
                <span className={styles.stars} aria-hidden="true">
                  {lock ? '' : starText(stars)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className={styles.hint}>
        Stars: 3 for no {levels.valueLabel}, 2 for one, 1 for a clear.
      </p>
    </div>
  );
}
