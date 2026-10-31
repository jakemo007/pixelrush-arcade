import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'mahjong-solitaire',
  name: 'Mahjong Solitaire',
  tagline: 'Match free tiles in pairs until the stack is gone.',
  summary:
    'Remove matching pairs of free tiles from a layered stack, on three hand-built layouts. Every deal can be cleared, and hints, undo and shuffle help when you get stuck.',
  genre: 'Tile-matching puzzle',
  categories: ['puzzle'],
  tags: ['Matching', 'Relaxing', 'Layered tiles'],
  sessionLength: '5 to 15 minutes',
  controls: {
    keyboard: 'Tab or arrow keys to move between free tiles, Enter or Space to select',
    touch: 'Tap two matching free tiles',
  },
  accent: 'green',
  engine: 'dom',
  best: { label: 'Time', format: 'duration', direction: 'lower', requiresWin: true },
  variants: [
    { id: 'pyramid', label: 'Pyramid (144)' },
    { id: 'garden', label: 'Garden (72)' },
    { id: 'bridge', label: 'Bridge (72)' },
  ],
  variantLabel: 'Layout',
  pausable: true,
  aspectRatio: 1.1,
  added: '2026-10-24',
};
