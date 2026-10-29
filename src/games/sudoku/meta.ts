import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'sudoku',
  name: 'Sudoku',
  tagline: 'Fill the grid so every row, column and box holds 1 to 9.',
  summary:
    'Classic 9x9 Sudoku where every puzzle has exactly one solution and is graded by the techniques it needs. Pencil in notes, undo freely and ask for a hint when stuck.',
  genre: 'Logic puzzle',
  categories: ['puzzle'],
  tags: ['Logic', 'Unique solutions', 'Notes'],
  sessionLength: '5 to 30 minutes',
  controls: {
    keyboard: 'Arrow keys to move, 1-9 to enter a number, N to toggle notes, Backspace to erase',
    touch: 'Tap a cell, then tap a number on the pad',
  },
  accent: 'cyan',
  engine: 'dom',
  best: { label: 'Time', format: 'duration', direction: 'lower', requiresWin: true },
  variants: [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
  ],
  variantLabel: 'Difficulty',
  pausable: true,
  aspectRatio: 0.8,
  added: '2026-10-24',
  featured: true,
};
