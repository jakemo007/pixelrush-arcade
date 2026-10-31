import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'word-search',
  name: 'Word Search',
  tagline: 'Find every hidden word in the letter grid.',
  summary:
    'Themed word search puzzles generated fresh every game, from 10x10 to 14x14. Drag across letters in a straight line, or tap the first and last letter, to circle each word.',
  genre: 'Word puzzle',
  categories: ['word', 'puzzle'],
  tags: ['Themes', 'Relaxing', 'Drag to select'],
  sessionLength: '3 to 10 minutes',
  controls: {
    keyboard: 'Arrow keys to move, Enter on the first and last letter to select a word',
    touch: 'Drag across a word, or tap its first and last letters',
  },
  accent: 'magenta',
  engine: 'dom',
  best: { label: 'Time', format: 'duration', direction: 'lower', requiresWin: true },
  variants: [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
  ],
  variantLabel: 'Difficulty',
  pausable: true,
  aspectRatio: 0.85,
  added: '2026-10-24',
};
