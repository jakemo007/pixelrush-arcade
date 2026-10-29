import { SUIT_SYMBOL, rankLabel, type Card } from './model';
import styles from './CardTable.module.css';

export function CardFace({ card }: { card: Pick<Card, 'suit' | 'rank'> }) {
  const symbol = SUIT_SYMBOL[card.suit];
  const label = rankLabel(card.rank);
  return (
    <span className={styles.face} aria-hidden="true">
      <span className={styles.corner}>
        <span className={styles.rank} data-wide={label.length > 1 || undefined}>
          {label}
        </span>
        <span className={styles.cornerSuit}>{symbol}</span>
      </span>
      {card.rank > 10 ? (
        <span className={styles.court}>
          <span className={styles.courtLetter}>{label}</span>
          <span className={styles.courtSuit}>{symbol}</span>
        </span>
      ) : (
        <span className={card.rank === 1 ? `${styles.pip} ${styles.acePip}` : styles.pip}>{symbol}</span>
      )}
      <span className={styles.cornerBottom}>
        {label}
        {symbol}
      </span>
    </span>
  );
}

export function CardBack() {
  return <span className={styles.backPattern} aria-hidden="true" />;
}
