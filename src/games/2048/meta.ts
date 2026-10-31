import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: '2048',
  name: '2048',
  tagline: 'Slide, merge and double your way to the 2048 tile.',
  summary:
    'Slide numbered tiles across a 4x4 board. Matching tiles merge into their sum, and every move adds a new tile, so plan ahead to reach 2048 and beyond.',
  genre: 'Sliding number puzzle',
  categories: ['puzzle'],
  tags: ['Numbers', 'Strategy', 'Swipe'],
  sessionLength: '5 to 20 minutes',
  controls: {
    keyboard: 'Arrow keys or WASD to slide the tiles',
    touch: 'Swipe on the board to slide the tiles',
  },
  accent: 'amber',
  engine: 'dom',
  best: { label: 'Score', format: 'points', direction: 'higher' },
  aspectRatio: 1,
  added: '2026-10-24',
  featured: true,
};
