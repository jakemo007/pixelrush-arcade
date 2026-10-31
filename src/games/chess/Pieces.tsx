export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export const PIECE_NAMES: Record<PieceType, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

function Base() {
  return (
    <>
      <path d="M30 76 H70 L73 82 H27 Z" />
      <rect x="22" y="82" width="56" height="9" rx="3" />
    </>
  );
}

function Shape({ type, detail }: { type: PieceType; detail: string }) {
  switch (type) {
    case 'p':
      return (
        <>
          <circle cx="50" cy="29" r="12" />
          <path d="M39 44 H61 L57 50 H43 Z" />
          <path d="M43 50 C43 60 37 68 34 76 H66 C63 68 57 60 57 50 Z" />
          <Base />
        </>
      );
    case 'r':
      return (
        <>
          <path d="M28 14 H38 V22 H45 V14 H55 V22 H62 V14 H72 V34 H28 Z" />
          <rect x="31" y="34" width="38" height="6" rx="1" />
          <path d="M35 40 H65 L67 76 H33 Z" />
          <path d="M37 50 H63" fill="none" stroke={detail} strokeWidth="2.5" />
          <Base />
        </>
      );
    case 'b':
      return (
        <>
          <circle cx="50" cy="12" r="5" />
          <path d="M50 17 C64 28 66 42 59 52 H41 C34 42 36 28 50 17 Z" />
          <path d="M55 28 L46 40" fill="none" stroke={detail} strokeWidth="3" strokeLinecap="round" />
          <rect x="38" y="52" width="24" height="6" rx="2" />
          <path d="M42 58 H58 C58 66 62 71 66 76 H34 C38 71 42 66 42 58 Z" />
          <Base />
        </>
      );
    case 'n':
      return (
        <>
          <path d="M67 76 H34 C34 64 40 57 49 51 C42 52 35 56 29 53 C23 50 23 44 28 39 L42 26 C45 20 49 16 54 14 L56 7 L61 15 C71 21 75 35 73 49 C71 60 67 67 67 76 Z" />
          <circle cx="47" cy="29" r="2.8" fill={detail} />
          <path d="M60 18 C66 26 68 38 66 50" fill="none" stroke={detail} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M31 46 L35 44" fill="none" stroke={detail} strokeWidth="2.5" strokeLinecap="round" />
          <Base />
        </>
      );
    case 'q':
      return (
        <>
          <circle cx="22" cy="24" r="4.5" />
          <circle cx="36" cy="18" r="4.5" />
          <circle cx="50" cy="14" r="4.5" />
          <circle cx="64" cy="18" r="4.5" />
          <circle cx="78" cy="24" r="4.5" />
          <path d="M22 28 L33 52 L36 22 L45 50 L50 18 L55 50 L64 22 L67 52 L78 28 L70 62 H30 Z" />
          <rect x="30" y="62" width="40" height="5" rx="2" />
          <path d="M33 67 H67 L68 76 H32 Z" />
          <Base />
        </>
      );
    case 'k':
      return (
        <>
          <rect x="46" y="4" width="8" height="22" rx="1.5" />
          <rect x="39" y="10" width="22" height="7" rx="1.5" />
          <path d="M26 40 C24 28 40 24 50 32 C60 24 76 28 74 40 C72 50 66 56 64 62 H36 C34 56 28 50 26 40 Z" />
          <rect x="33" y="62" width="34" height="5" rx="2" />
          <path d="M35 67 H65 L67 76 H33 Z" />
          <path d="M40 46 H60" fill="none" stroke={detail} strokeWidth="2.5" />
          <Base />
        </>
      );
  }
}

export function ChessPiece({ type, color }: { type: PieceType; color: PieceColor }) {
  const white = color === 'w';
  const fill = white ? '#f7f2e8' : '#2a2433';
  const stroke = white ? '#2a2433' : '#0b0910';
  const detail = white ? '#2a2433' : '#d9cfe6';
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round">
        <Shape type={type} detail={detail} />
      </g>
    </svg>
  );
}
