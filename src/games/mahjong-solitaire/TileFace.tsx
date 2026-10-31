import { memo, type ReactElement } from 'react';
import type { TileKind } from './tiles';

const NAVY = '#1d2b6b';
const RED = '#c42b3a';
const GREEN = '#1f7a4a';
const BLUE = '#2459c4';

const DOT_LAYOUTS: Record<number, [number, number][]> = {
  1: [[20, 27]],
  2: [
    [20, 15],
    [20, 39],
  ],
  3: [
    [11, 13],
    [20, 27],
    [29, 41],
  ],
  4: [
    [12, 16],
    [28, 16],
    [12, 38],
    [28, 38],
  ],
  5: [
    [11, 14],
    [29, 14],
    [20, 27],
    [11, 40],
    [29, 40],
  ],
  6: [
    [13, 12],
    [27, 12],
    [13, 27],
    [27, 27],
    [13, 42],
    [27, 42],
  ],
  7: [
    [10, 10],
    [20, 15],
    [30, 20],
    [13, 31],
    [27, 31],
    [13, 43],
    [27, 43],
  ],
  8: [
    [13, 9],
    [27, 9],
    [13, 21],
    [27, 21],
    [13, 33],
    [27, 33],
    [13, 45],
    [27, 45],
  ],
  9: [
    [9, 12],
    [20, 12],
    [31, 12],
    [9, 27],
    [20, 27],
    [31, 27],
    [9, 42],
    [20, 42],
    [31, 42],
  ],
};

function Dots({ n }: { n: number }) {
  const pts = DOT_LAYOUTS[n]!;
  const r = n === 1 ? 12 : n <= 4 ? 7.5 : n <= 6 ? 6.2 : n <= 8 ? 5.2 : 5;
  const colors = [BLUE, GREEN, RED];
  return (
    <>
      {pts.map(([x, y], i) => {
        const c = n === 1 ? RED : colors[(i + n) % 3]!;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill="none" stroke={c} strokeWidth={r * 0.32} />
            <circle cx={x} cy={y} r={r * 0.42} fill={c} />
            {n === 1 && <circle cx={x} cy={y} r={r * 0.7} fill="none" stroke={BLUE} strokeWidth="1.2" />}
          </g>
        );
      })}
    </>
  );
}

function Stick({ x, y, h, red }: { x: number; y: number; h: number; red?: boolean }) {
  const c = red ? RED : GREEN;
  return (
    <g>
      <rect x={x - 2.4} y={y - h / 2} width="4.8" height={h} rx="2.4" fill={c} />
      <line x1={x - 2.4} y1={y} x2={x + 2.4} y2={y} stroke="#f7f1e3" strokeWidth="1" />
      <line x1={x} y1={y - h / 2 + 2} x2={x} y2={y + h / 2 - 2} stroke="#f7f1e3" strokeWidth="0.7" opacity="0.7" />
    </g>
  );
}

const BAMBOO_LAYOUTS: Record<number, [number, number, boolean?][]> = {
  2: [
    [20, 16],
    [20, 38],
  ],
  3: [
    [20, 16],
    [13, 38],
    [27, 38],
  ],
  4: [
    [13, 16],
    [27, 16],
    [13, 38],
    [27, 38],
  ],
  5: [
    [11, 16],
    [29, 16],
    [20, 27, true],
    [11, 38],
    [29, 38],
  ],
  6: [
    [10, 16],
    [20, 16],
    [30, 16],
    [10, 38],
    [20, 38],
    [30, 38],
  ],
  7: [
    [20, 10, true],
    [10, 27],
    [20, 27],
    [30, 27],
    [10, 43],
    [20, 43],
    [30, 43],
  ],
  8: [
    [8, 16],
    [16, 16],
    [24, 16],
    [32, 16],
    [8, 38],
    [16, 38],
    [24, 38],
    [32, 38],
  ],
  9: [
    [10, 11],
    [20, 11, true],
    [30, 11],
    [10, 27],
    [20, 27, true],
    [30, 27],
    [10, 43],
    [20, 43, true],
    [30, 43],
  ],
};

function Bamboo({ n }: { n: number }) {
  if (n === 1) {
    return (
      <g>
        <rect x="18" y="20" width="4.5" height="26" rx="2.2" fill={GREEN} />
        <line x1="18" y1="33" x2="22.5" y2="33" stroke="#f7f1e3" strokeWidth="1" />
        <path d="M20 22 C10 18 8 9 12 5 C17 9 20 14 20 22 Z" fill={GREEN} />
        <path d="M21 22 C30 18 33 10 29 6 C24 10 21 15 21 22 Z" fill="#2e9a5f" />
        <path d="M20.5 20 C18 13 19 7 20.5 3 C22 7 23 13 20.5 20 Z" fill={RED} />
      </g>
    );
  }
  const h = n >= 7 ? 13 : 18;
  return (
    <>
      {BAMBOO_LAYOUTS[n]!.map(([x, y, red], i) => (
        <Stick key={i} x={x} y={y} h={h} red={red} />
      ))}
    </>
  );
}

function Characters({ n }: { n: number }) {
  return (
    <g>
      <text x="20" y="25" textAnchor="middle" fontSize="22" fontWeight="900" fill={NAVY} fontFamily="Georgia, 'Times New Roman', serif">
        {n}
      </text>
      <rect x="9" y="30" width="22" height="17" rx="3" fill={RED} />
      <path d="M13 34 h14 M20 34 v10 M14 39 h12 M15 44 l5-4 l5 4" stroke="#f7f1e3" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

const WIND_ROTATION: Record<string, number> = { north: 0, east: 90, south: 180, west: 270 };

function Wind({ dir }: { dir: string }) {
  const letter = dir[0]!.toUpperCase();
  return (
    <g>
      <circle cx="20" cy="34" r="11" fill="none" stroke={NAVY} strokeWidth="1.4" opacity="0.5" />
      <g transform={`rotate(${WIND_ROTATION[dir]} 20 34)`}>
        <path d="M20 22 L24 34 L20 31 L16 34 Z" fill={RED} />
        <path d="M20 46 L24 34 L20 37 L16 34 Z" fill={NAVY} opacity="0.35" />
      </g>
      <text x="20" y="20" textAnchor="middle" fontSize="17" fontWeight="900" fill={NAVY} fontFamily="system-ui, sans-serif">
        {letter}
      </text>
    </g>
  );
}

function Dragon({ color }: { color: string }) {
  if (color === 'red') {
    return (
      <g>
        <path d="M20 8 C30 18 31 26 27 34 C25 40 22 44 20 46 C18 44 15 40 13 34 C9 26 10 18 20 8 Z" fill={RED} />
        <path d="M20 22 C25 28 24 34 20 40 C16 34 15 28 20 22 Z" fill="#ffd23f" />
      </g>
    );
  }
  if (color === 'green') {
    return (
      <g>
        <path d="M20 46 C8 38 7 20 20 8 C33 20 32 38 20 46 Z" fill={GREEN} />
        <path d="M20 44 V12 M20 22 L13 16 M20 28 L27 21 M20 34 L13 28 M20 38 L26 33" stroke="#f7f1e3" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <rect x="9" y="9" width="22" height="36" rx="3" fill="none" stroke={BLUE} strokeWidth="3" />
      <rect x="13.5" y="13.5" width="13" height="27" rx="1.5" fill="none" stroke={BLUE} strokeWidth="1.3" strokeDasharray="3 2" />
    </g>
  );
}

function Flower({ name }: { name: string }) {
  const petals = (n: number, r: number, color: string, len: number) =>
    Array.from({ length: n }, (_, i) => (
      <ellipse key={i} cx="20" cy={27 - len} rx={r} ry={len} fill={color} transform={`rotate(${(360 / n) * i} 20 27)`} />
    ));
  const stem = <path d="M20 31 C20 38 22 42 20 47" stroke={GREEN} strokeWidth="2" fill="none" />;
  switch (name) {
    case 'plum':
      return (
        <g>
          {stem}
          {petals(5, 4.6, '#ef7fa8', 6)}
          <circle cx="20" cy="27" r="3" fill="#ffd23f" />
        </g>
      );
    case 'orchid':
      return (
        <g>
          {stem}
          {petals(3, 4, '#9b6fe0', 8)}
          <circle cx="20" cy="27" r="2.6" fill="#f7d2ff" />
        </g>
      );
    case 'chrysanthemum':
      return (
        <g>
          {stem}
          {petals(12, 1.8, '#e5a500', 8)}
          <circle cx="20" cy="27" r="3.4" fill="#b35b00" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M8 40 Q20 46 32 40" stroke={BLUE} strokeWidth="1.6" fill="none" />
          <path d="M20 14 C25 21 25 30 20 36 C15 30 15 21 20 14 Z" fill="#f290b6" />
          <path d="M20 36 C12 34 9 27 9 22 C14 24 18 29 20 36 Z" fill="#f6a9c6" />
          <path d="M20 36 C28 34 31 27 31 22 C26 24 22 29 20 36 Z" fill="#f6a9c6" />
        </g>
      );
  }
}

function Season({ name }: { name: string }) {
  switch (name) {
    case 'spring':
      return (
        <g>
          <path d="M8 44 h24" stroke="#8a5a2b" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M20 44 V26" stroke={GREEN} strokeWidth="2" />
          <path d="M20 30 C12 30 9 22 10 17 C16 18 20 23 20 30 Z" fill="#3cb36f" />
          <path d="M20 27 C27 26 31 19 30 14 C24 15 20 20 20 27 Z" fill="#5fd18f" />
        </g>
      );
    case 'summer':
      return (
        <g>
          <circle cx="20" cy="28" r="7.5" fill="#f2a400" />
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1="20" y1="15" x2="20" y2="11" stroke="#f2a400" strokeWidth="2.4" strokeLinecap="round" transform={`rotate(${i * 45} 20 28)`} />
          ))}
        </g>
      );
    case 'autumn':
      return (
        <g>
          <path d="M20 9 L23 18 L31 15 L27 23 L34 27 L26 30 L28 38 L20 34 L12 38 L14 30 L6 27 L13 23 L9 15 L17 18 Z" fill="#d9541e" />
          <path d="M20 34 V46" stroke="#8a5a2b" strokeWidth="2" />
        </g>
      );
    default:
      return (
        <g stroke="#3d8fd6" strokeWidth="2" strokeLinecap="round">
          {[0, 60, 120].map((a) => (
            <g key={a} transform={`rotate(${a} 20 28)`}>
              <line x1="20" y1="14" x2="20" y2="42" />
              <path d="M16 18 L20 21 L24 18 M16 38 L20 35 L24 38" fill="none" />
            </g>
          ))}
        </g>
      );
  }
}

function cornerIndex(kind: TileKind): { text: string; color: string } {
  const [a, b] = kind.split('-') as [string, string];
  switch (a) {
    case 'dots':
      return { text: b, color: BLUE };
    case 'bamboo':
      return { text: b, color: GREEN };
    case 'characters':
      return { text: b, color: RED };
    case 'wind':
      return { text: b[0]!.toUpperCase(), color: NAVY };
    case 'dragon':
      return { text: b[0]!.toUpperCase(), color: b === 'red' ? RED : b === 'green' ? GREEN : BLUE };
    case 'flower':
      return { text: 'F', color: '#b04a7a' };
    default:
      return { text: 'S', color: '#b36b00' };
  }
}

function faceBody(kind: TileKind): ReactElement {
  const [a, b] = kind.split('-') as [string, string];
  switch (a) {
    case 'dots':
      return <Dots n={Number(b)} />;
    case 'bamboo':
      return <Bamboo n={Number(b)} />;
    case 'characters':
      return <Characters n={Number(b)} />;
    case 'wind':
      return <Wind dir={b} />;
    case 'dragon':
      return <Dragon color={b} />;
    case 'flower':
      return <Flower name={b} />;
    default:
      return <Season name={b} />;
  }
}

export const TileFace = memo(function TileFace({ kind }: { kind: TileKind }) {
  const idx = cornerIndex(kind);
  const showIndex = !kind.startsWith('characters') && !kind.startsWith('wind');
  return (
    <svg viewBox="0 0 40 52" width="100%" height="100%" aria-hidden="true" focusable="false">
      {kind.startsWith('flower') && <rect x="2" y="2" width="36" height="48" rx="5" fill="#fbe4ef" />}
      {kind.startsWith('season') && <rect x="2" y="2" width="36" height="48" rx="5" fill="#fff1d6" />}
      {faceBody(kind)}
      {showIndex && (
        <text x="35.5" y="9" textAnchor="end" fontSize="7.5" fontWeight="800" fill={idx.color} fontFamily="system-ui, sans-serif">
          {idx.text}
        </text>
      )}
    </svg>
  );
});
