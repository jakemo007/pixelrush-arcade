import type { Player } from './rules';

export const PLAYER_NAME: Readonly<Record<Player, string>> = { 1: 'Red', 2: 'Yellow' };

export function Disc({ player }: { player: Player }) {
  const red = player === 1;
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="18" fill={red ? '#e63a5c' : '#ffd23f'} stroke={red ? '#7d1631' : '#8a6a00'} strokeWidth="2" />
      <circle cx="20" cy="20" r="11.5" fill="none" stroke={red ? 'rgba(255,255,255,0.45)' : 'rgba(90,60,0,0.3)'} strokeWidth="2" />
      {red ? (
        <circle cx="20" cy="20" r="5" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="2.4" />
      ) : (
        <path d="M20 13.5 26.5 20 20 26.5 13.5 20Z" fill="#5a3c00" fillOpacity="0.75" />
      )}
    </svg>
  );
}
