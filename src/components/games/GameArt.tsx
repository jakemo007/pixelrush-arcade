import type { GameId } from '@/config/games';

/**
 * Original, hand-written SVG illustrations for each game (no external
 * assets). Rendered on the server, so they cost no JavaScript.
 */

interface ArtProps {
  gameId: GameId;
  /** Makes SVG gradient/clip ids unique when the same art appears twice on a page. */
  idSuffix?: string;
  /** Accessible description; omit when the art is decorative. */
  label?: string;
  className?: string;
}

export function GameArt({ gameId, label, className, idSuffix = 'art' }: ArtProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  return (
    <svg viewBox="0 0 320 200" className={className} preserveAspectRatio="xMidYMid slice" focusable="false" {...a11y}>
      {gameId === 'neon-dash' && <NeonDashArt s={idSuffix} />}
      {gameId === 'brick-breaker' && <BrickBreakerArt s={idSuffix} />}
      {gameId === 'space-survival' && <SpaceSurvivalArt s={idSuffix} />}
    </svg>
  );
}

function NeonDashArt({ s }: { s: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`nd-sky-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05061a" />
          <stop offset="0.6" stopColor="#1a0b3d" />
          <stop offset="1" stopColor="#3a0f4f" />
        </linearGradient>
        <linearGradient id={`nd-sun-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd23f" />
          <stop offset="0.55" stopColor="#ff6fb1" />
          <stop offset="1" stopColor="#a14bff" />
        </linearGradient>
        <clipPath id={`nd-sun-clip-${s}`}>
          <circle cx="218" cy="128" r="46" />
        </clipPath>
      </defs>
      <rect width="320" height="200" fill={`url(#nd-sky-${s})`} />
      <g fill="#eef2ff" opacity="0.7">
        <circle cx="30" cy="24" r="1" />
        <circle cx="80" cy="44" r="1.2" />
        <circle cx="140" cy="18" r="0.9" />
        <circle cx="290" cy="30" r="1.1" />
        <circle cx="260" cy="60" r="0.8" />
        <circle cx="110" cy="70" r="0.8" />
      </g>
      <g clipPath={`url(#nd-sun-clip-${s})`}>
        <rect x="170" y="80" width="96" height="96" fill={`url(#nd-sun-${s})`} />
        <g fill="#1a0b3d">
          <rect x="170" y="132" width="96" height="3" />
          <rect x="170" y="141" width="96" height="4" />
          <rect x="170" y="151" width="96" height="5" />
          <rect x="170" y="162" width="96" height="6" />
        </g>
      </g>
      <g fill="#160b33">
        <rect x="0" y="104" width="34" height="56" />
        <rect x="38" y="88" width="26" height="72" />
        <rect x="68" y="116" width="40" height="44" />
        <rect x="112" y="96" width="22" height="64" />
        <rect x="270" y="100" width="30" height="60" />
        <rect x="302" y="118" width="18" height="42" />
      </g>
      <g fill="#38e8ff" opacity="0.45">
        <rect x="44" y="96" width="4" height="4" />
        <rect x="54" y="110" width="4" height="4" />
        <rect x="118" y="104" width="4" height="4" />
        <rect x="278" y="110" width="4" height="4" />
      </g>
      <rect y="160" width="320" height="40" fill="#14072d" />
      <g stroke="#ff4fd8" strokeOpacity="0.3" strokeWidth="1">
        <line x1="40" y1="160" x2="-20" y2="200" />
        <line x1="120" y1="160" x2="100" y2="200" />
        <line x1="200" y1="160" x2="220" y2="200" />
        <line x1="280" y1="160" x2="340" y2="200" />
        <line x1="0" y1="174" x2="320" y2="174" />
        <line x1="0" y1="188" x2="320" y2="188" />
      </g>
      <line x1="0" y1="160" x2="320" y2="160" stroke="#38e8ff" strokeWidth="2.5" />
      <g fill="#38e8ff">
        <rect x="58" y="112" width="18" height="16" rx="3" opacity="0.15" />
        <rect x="70" y="108" width="18" height="17" rx="3" opacity="0.3" />
        <rect x="82" y="104" width="20" height="20" rx="5" />
      </g>
      <rect x="91" y="109" width="9" height="5" rx="2" fill="#071226" />
      <g fill="#ff4fd8">
        <path d="M150 160 L160 140 L170 160 Z" />
        <path d="M170 160 L180 140 L190 160 Z" />
      </g>
      <path d="M232 112 L238 120 L232 128 L226 120 Z" fill="#ffd23f" />
    </>
  );
}

function BrickBreakerArt({ s }: { s: string }) {
  const rows = [
    { y: 28, color: '#ff4fd8' },
    { y: 44, color: '#a78bfa' },
    { y: 60, color: '#a78bfa' },
    { y: 76, color: '#38e8ff' },
  ];
  const cols = Array.from({ length: 10 }, (_, i) => 14 + i * 30);
  const gaps = new Set(['76:134', '76:164', '60:164', '44:254']);
  return (
    <>
      <defs>
        <linearGradient id={`bb-bg-${s}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0e2b" />
          <stop offset="1" stopColor="#05060f" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#bb-bg-${s})`} />
      <g stroke="#a78bfa" strokeOpacity="0.08">
        {[40, 80, 120, 160, 200, 240, 280].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="200" />
        ))}
      </g>
      {rows.map((row) =>
        cols.map((x) =>
          gaps.has(`${row.y}:${x}`) ? null : (
            <rect key={`${row.y}-${x}`} x={x} y={row.y} width="26" height="12" rx="3" fill={row.color} opacity="0.92" />
          ),
        ),
      )}
      <g fill="#eef2ff">
        <circle cx="150" cy="128" r="3" opacity="0.15" />
        <circle cx="158" cy="118" r="3.5" opacity="0.3" />
        <circle cx="166" cy="108" r="6" />
      </g>
      <rect x="118" y="172" width="70" height="9" rx="4.5" fill="#ff4fd8" />
      <rect x="114" y="168" width="78" height="17" rx="8.5" fill="#ff4fd8" opacity="0.2" />
      <rect x="230" y="134" width="26" height="11" rx="5.5" fill="#05060f" stroke="#38e8ff" strokeWidth="1.5" />
      <text x="243" y="142.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#38e8ff" fontFamily="system-ui, sans-serif">
        W
      </text>
    </>
  );
}

function SpaceSurvivalArt({ s }: { s: string }) {
  const stars = [
    [20, 30, 1],
    [60, 90, 1.4],
    [100, 20, 0.9],
    [150, 60, 1.2],
    [210, 26, 1],
    [270, 80, 1.3],
    [300, 140, 0.9],
    [40, 160, 1.1],
    [240, 170, 1],
    [180, 120, 0.8],
  ];
  return (
    <>
      <defs>
        <radialGradient id={`ss-neb-${s}`} cx="0.25" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#a14bff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#070a18" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#070a18" />
      <rect width="320" height="200" fill={`url(#ss-neb-${s})`} />
      <g fill="#eef2ff">
        {stars.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity="0.75" />
        ))}
      </g>
      <path d="M70 40 L82 52 L70 64 L58 52 Z" fill="#3a0b33" stroke="#ff4fd8" strokeWidth="2" />
      <path d="M250 50 l12 7 v14 l-12 7 l-12 -7 v-14 Z" fill="#24124f" stroke="#a78bfa" strokeWidth="2" />
      <path d="M190 34 L202 54 L178 54 Z" fill="#3a1a08" stroke="#ff8a3d" strokeWidth="2" transform="rotate(180 190 46)" />
      <line x1="190" y1="58" x2="165" y2="140" stroke="#ff8a3d" strokeWidth="1.5" strokeDasharray="4 5" opacity="0.6" />
      <g fill="#38e8ff">
        <rect x="158" y="96" width="3" height="12" rx="1.5" />
        <rect x="158" y="72" width="3" height="12" rx="1.5" />
        <rect x="158" y="120" width="3" height="12" rx="1.5" />
      </g>
      <circle cx="232" cy="120" r="5" fill="#ff4fd8" />
      <circle cx="232" cy="120" r="2" fill="#fff" />
      <path d="M159.5 140 L176 170 L166 166 L159.5 176 L153 166 L143 170 Z" fill="#38e8ff" />
      <path d="M155 176 L159.5 188 L164 176 Z" fill="#ff8a3d" opacity="0.85" />
      <circle cx="96" cy="150" r="8" fill="#4dffb5" />
      <text x="96" y="153.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#071226" fontFamily="system-ui, sans-serif">
        +
      </text>
    </>
  );
}
