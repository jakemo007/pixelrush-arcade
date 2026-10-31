import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'solitaire',
  name: 'Classic Solitaire',
  tagline: 'The classic patience game. Build every suit from Ace to King.',
  summary:
    'Klondike solitaire with draw-one or draw-three dealing. Build the tableau down in alternating colors, uncover hidden cards and move all four suits to the foundations.',
  genre: 'Card game (Klondike)',
  categories: ['card'],
  tags: ['Klondike', 'Draw 1 or 3', 'Undo'],
  sessionLength: '5 to 15 minutes',
  controls: {
    keyboard: 'Arrow keys to choose a card, Enter to pick it up and place it, D to draw, U to undo',
    touch: 'Tap a card, then tap where it should go, or drag it; double-tap sends it to a foundation',
  },
  accent: 'green',
  engine: 'dom',
  best: { label: 'Time', format: 'duration', direction: 'lower', requiresWin: true },
  variants: [
    { id: 'draw-1', label: 'Draw 1' },
    { id: 'draw-3', label: 'Draw 3' },
  ],
  variantLabel: 'Draw',
  pausable: true,
  aspectRatio: 1.25,
  added: '2026-10-24',
  featured: true,
};
