import type { GameCategory } from '@/config/games';

export function CategoryIcon({ category, size = 24 }: { category: GameCategory | 'all'; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
  };
  switch (category) {
    case 'arcade':
      return (
        <svg {...common}>
          <rect x="2.5" y="7" width="19" height="11" rx="5" />
          <path d="M7.5 10.5v4M5.5 12.5h4" />
          <circle cx="15.5" cy="11.5" r="0.9" fill="currentColor" />
          <circle cx="17.8" cy="13.8" r="0.9" fill="currentColor" />
        </svg>
      );
    case 'puzzle':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2.5" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
      );
    case 'card':
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="10" height="14" rx="1.6" transform="rotate(-10 8.5 12.5)" />
          <rect x="10" y="4" width="10" height="14" rx="1.6" />
          <path d="m15 8.5-2 2.6 2 2.6 2-2.6z" />
        </svg>
      );
    case 'board':
      return (
        <svg {...common}>
          <circle cx="12" cy="5.8" r="2.3" />
          <path d="M9.6 10.2h4.8M10.4 10.2l-1 6.3h5.2l-1-6.3M7 20.5h10l-1-4H8z" />
        </svg>
      );
    case 'word':
      return (
        <svg {...common}>
          <rect x="2.5" y="6" width="9" height="12" rx="1.6" />
          <rect x="12.5" y="6" width="9" height="12" rx="1.6" />
          <path d="m4.7 15.5 2.3-6.5 2.3 6.5M5.6 13.3h2.8M15 9.5h4l-4 6h4" />
        </svg>
      );
    case 'sports':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3v18M5.8 5.6c3.2 3.4 3.2 9.4 0 12.8M18.2 5.6c-3.2 3.4-3.2 9.4 0 12.8" />
        </svg>
      );
    case 'racing':
      return (
        <svg {...common}>
          <path d="M5 21V3.5" />
          <path d="M5 4h13.5l-2.5 4.2 2.5 4.3H5" />
          <path d="M9.5 4v8.5M14 4v8.5M5 8.2h11" />
        </svg>
      );
    case 'all':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.8" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" />
        </svg>
      );
  }
}
