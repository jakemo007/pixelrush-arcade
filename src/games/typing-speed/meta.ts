import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'typing-speed',
  name: 'Typing Speed Challenge',
  tagline: 'How many words per minute can you type, accurately?',
  summary:
    'A timed typing test with original passages, in 60- or 30-second rounds. See your words per minute and accuracy live, and beat your personal best.',
  genre: 'Typing test',
  categories: ['word'],
  tags: ['WPM', 'Accuracy', 'Practice'],
  sessionLength: '30 seconds or 1 minute',
  controls: {
    keyboard: 'Type the highlighted text; Backspace fixes mistakes',
    touch: 'Tap the text to open your keyboard, then type',
  },
  accent: 'cyan',
  engine: 'dom',
  best: { label: 'Speed', format: 'count', unit: 'WPM', direction: 'higher', requiresWin: true },
  variants: [
    { id: '60s', label: '60 seconds' },
    { id: '30s', label: '30 seconds' },
  ],
  variantLabel: 'Duration',
  aspectRatio: 2.5,
  added: '2026-10-24',
};
