import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'spider-solitaire',
  name: 'Spider Solitaire',
  tagline: 'Build eight full runs from King to Ace to clear the table.',
  summary:
    'Two-deck Spider Solitaire with one, two or four suits. Arrange the ten columns into King-to-Ace runs of a single suit and deal new rows when you are stuck.',
  genre: 'Card game',
  categories: ['card'],
  tags: ['Two decks', '1, 2 or 4 suits', 'Undo'],
  sessionLength: '10 to 30 minutes',
  controls: {
    keyboard: 'Arrow keys to choose a card, Enter to pick it up and place it, D to deal, U to undo',
    touch: 'Tap a card, then tap where it should go, or drag it; tap the stock to deal',
  },
  accent: 'violet',
  engine: 'dom',
  best: { label: 'Score', format: 'points', direction: 'higher', requiresWin: true },
  variants: [
    { id: '1-suit', label: '1 suit' },
    { id: '2-suits', label: '2 suits' },
    { id: '4-suits', label: '4 suits' },
  ],
  variantLabel: 'Suits',
  pausable: true,
  aspectRatio: 1.2,
  added: '2026-10-24',
};
