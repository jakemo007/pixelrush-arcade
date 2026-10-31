import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'minesweeper',
  name: 'Minesweeper',
  tagline: 'Read the numbers, flag the mines, clear the field.',
  summary:
    'Uncover every safe square without hitting a mine. Each number tells you how many mines touch that square, and your first click is always safe.',
  genre: 'Logic puzzle',
  categories: ['puzzle'],
  tags: ['Logic', 'Classic', 'Three sizes'],
  sessionLength: '1 to 10 minutes',
  controls: {
    keyboard: 'Arrow keys to move, Space or Enter to reveal, F to flag. Mouse: left-click reveals, right-click flags',
    touch: 'Tap to reveal, long-press or switch to Flag mode to flag',
  },
  accent: 'violet',
  engine: 'dom',
  best: { label: 'Time', format: 'duration', direction: 'lower', requiresWin: true },
  variants: [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'expert', label: 'Expert' },
  ],
  variantLabel: 'Difficulty',
  pausable: true,
  aspectRatio: 1.4,
  added: '2026-10-24',
};
