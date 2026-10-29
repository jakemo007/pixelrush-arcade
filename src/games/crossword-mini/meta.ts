import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'crossword-mini',
  name: 'Crossword Mini',
  tagline: 'A small crossword you can finish over a coffee.',
  summary:
    'Eighteen compact, original 5x5 crosswords with hand-written clues. Fill every across and down answer, check your letters and reveal help when you need it.',
  genre: 'Mini crossword',
  categories: ['word', 'puzzle'],
  tags: ['Quick', 'Clues', 'Original puzzles'],
  sessionLength: '2 to 10 minutes',
  controls: {
    keyboard: 'Type letters, arrow keys to move, Space to switch direction, Tab or Enter for the next clue',
    touch: 'Tap a square, then type on the on-screen keyboard',
  },
  accent: 'cyan',
  engine: 'dom',
  best: { label: 'Time', format: 'duration', direction: 'lower', requiresWin: true },
  pausable: true,
  aspectRatio: 0.85,
  added: '2026-10-24',
};
