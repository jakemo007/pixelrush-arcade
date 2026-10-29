export function CheckerPiece({ side, king }: { side: 'dark' | 'light'; king: boolean }) {
  const red = side === 'dark';
  const base = red ? '#d8355a' : '#f2ece0';
  const rim = red ? '#7d1631' : '#9b917f';
  const ridge = red ? 'rgba(255,255,255,0.28)' : 'rgba(60,50,40,0.22)';
  const top = red ? '#e85a79' : '#fffaf0';
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <ellipse cx="50" cy="57" rx="40" ry="38" fill="rgba(0,0,0,0.35)" />
      <circle cx="50" cy="52" r="40" fill={rim} />
      <circle cx="50" cy="48" r="39" fill={base} stroke={rim} strokeWidth="2" />
      <circle cx="50" cy="48" r="31" fill="none" stroke={ridge} strokeWidth="3" />
      <circle cx="50" cy="48" r="23" fill={top} stroke={ridge} strokeWidth="2" />
      {king && (
        <g>
          <path
            d="M31 58 L28 36 L40 46 L50 30 L60 46 L72 36 L69 58 Z"
            fill="#ffd23f"
            stroke={red ? '#5a0f22' : '#6b5a2a'}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="31" y="58" width="38" height="7" rx="2" fill="#ffd23f" stroke={red ? '#5a0f22' : '#6b5a2a'} strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}
