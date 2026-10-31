import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'drop-four',
  name: 'Drop Four',
  tagline: 'Drop discs, line up four and block your rival.',
  summary:
    'The four-in-a-row classic on a 7 by 6 grid. Drop red and yellow discs into columns, build a line of four before your rival does, and play a computer opponent on three levels or a friend on one screen.',
  genre: 'Strategy board game',
  categories: ['board', 'puzzle'],
  tags: ['Strategy', 'Vs computer', 'Two players'],
  sessionLength: '2 to 10 minutes',
  controls: {
    keyboard: 'Left and right arrows to choose a column, Enter or Down arrow to drop, or press 1 to 7',
    touch: 'Tap a column to drop a disc',
  },
  accent: 'amber',
  engine: 'dom',
  best: null,
  variants: [
    { id: 'medium', label: 'Medium' },
    { id: 'easy', label: 'Easy' },
    { id: 'hard', label: 'Hard' },
    { id: 'two-player', label: 'Two players' },
  ],
  variantLabel: 'Mode',
  aspectRatio: 1.17,
  added: '2026-10-29',
};
