import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'checkers',
  name: 'Checkers',
  tagline: 'Jump, capture and crown your pieces to clear the board.',
  summary:
    'American checkers on an 8x8 board with mandatory captures, multi-jumps and kings. Play a thinking computer opponent or a friend on the same device.',
  genre: 'Strategy board game',
  categories: ['board'],
  tags: ['Strategy', 'Vs computer', 'Two players'],
  sessionLength: '5 to 20 minutes',
  controls: {
    keyboard: 'Arrow keys to choose a square, Enter to select a piece and again to move it, Esc to cancel',
    touch: 'Tap a piece, then tap a marked square (one hop at a time for multi-jumps)',
  },
  accent: 'magenta',
  engine: 'dom',
  best: null,
  variants: [
    { id: 'computer', label: 'Vs computer' },
    { id: 'two-player', label: 'Two players' },
  ],
  variantLabel: 'Mode',
  aspectRatio: 1,
  added: '2026-10-24',
};
