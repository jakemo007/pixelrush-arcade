import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'daily-word',
  name: 'Daily Word Puzzle',
  tagline: 'One hidden five-letter word a day. Six guesses to find it.',
  summary:
    'Guess the hidden five-letter word in six tries. After each guess the tiles show which letters are in the word and in the right spot, and everyone gets the same word each day.',
  genre: 'Word puzzle',
  categories: ['word', 'puzzle'],
  tags: ['Daily', 'Five letters', 'Six guesses'],
  sessionLength: '2 to 5 minutes',
  controls: {
    keyboard: 'Type letters, Enter to guess, Backspace to delete',
    touch: 'Tap the on-screen keyboard',
  },
  accent: 'amber',
  engine: 'dom',
  best: null,
  variants: [
    { id: 'daily', label: 'Daily' },
    { id: 'practice', label: 'Practice' },
  ],
  variantLabel: 'Mode',
  aspectRatio: 0.8,
  added: '2026-10-24',
  featured: true,
};
