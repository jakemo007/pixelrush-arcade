import type { DomGameInfo } from '@/config/games';

export const meta: DomGameInfo = {
  id: 'freecell',
  name: 'FreeCell',
  tagline: 'Every card face up. Four free cells. Almost every deal is winnable.',
  summary:
    'All 52 cards are dealt face up, so FreeCell rewards planning over luck. Use the four free cells to park cards and build each suit from Ace to King.',
  genre: 'Card game',
  categories: ['card'],
  tags: ['Skill', 'Numbered deals', 'Undo'],
  sessionLength: '5 to 15 minutes',
  controls: {
    keyboard: 'Arrow keys to choose a card, Enter to pick it up and place it, F to send it up, U to undo',
    touch: 'Tap a card, then tap where it should go, or drag it; double-tap sends it to a foundation or free cell',
  },
  accent: 'cyan',
  engine: 'dom',
  best: { label: 'Time', format: 'duration', direction: 'lower', requiresWin: true },
  pausable: true,
  aspectRatio: 1.2,
  added: '2026-10-24',
};
