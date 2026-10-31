import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'memory-match',
  name: 'Memory Card Match',
  tagline: 'Flip two cards at a time and remember where every pair hides.',
  summary:
    'Turn over two cards per move and find all the matching pairs in as few moves as you can. Choose a small or large board.',
  genre: 'Memory game',
  categories: ['puzzle'],
  tags: ['Memory', 'Pairs', 'Family friendly'],
  sessionLength: '2 to 6 minutes',
  controls: {
    keyboard: 'Arrow keys to move, Enter or Space to flip',
    touch: 'Tap a card to flip it',
  },
  accent: 'violet',
  engine: 'dom',
  best: { label: 'Moves', format: 'count', unit: 'moves', direction: 'lower', requiresWin: true },
  variants: [
    { id: '4x4', label: '4 x 4' },
    { id: '6x6', label: '6 x 6' },
  ],
  variantLabel: 'Board',
  pausable: true,
  aspectRatio: 1,
  added: '2026-10-24',
};
