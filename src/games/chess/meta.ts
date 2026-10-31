import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'chess',
  name: 'Chess vs Computer',
  tagline: 'A full game of chess against a computer opponent.',
  summary:
    'Play complete chess with every rule enforced, including castling, en passant and promotion, against a home-made computer opponent at three strengths.',
  genre: 'Strategy board game',
  categories: ['board'],
  tags: ['Strategy', 'Vs computer', 'Full rules'],
  sessionLength: '10 to 40 minutes',
  controls: {
    keyboard: 'Arrow keys to choose a square, Enter to pick up a piece and again to move it, Esc to cancel',
    touch: 'Tap a piece, then tap a highlighted square, or drag the piece',
  },
  accent: 'amber',
  engine: 'dom',
  best: null,
  variants: [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
  ],
  variantLabel: 'Difficulty',
  aspectRatio: 1,
  added: '2026-10-24',
  featured: true,
};
