import type { CanvasGameInfo } from '@/config/games';

export const meta: CanvasGameInfo = {
  id: 'match-3',
  name: 'Match-3 Puzzle',
  tagline: 'Swap gems, line up three and set off cascades.',
  summary:
    'Swap neighbouring gems to line up three or more of a kind. Hit each level’s target score within 25 moves, and let falling gems chain into cascades that multiply your points.',
  genre: 'Match-three puzzle',
  categories: ['puzzle', 'arcade'],
  tags: ['Swap', 'Cascades', 'Move limit'],
  sessionLength: '3 to 10 minutes',
  controls: {
    keyboard: 'Arrow keys to move, Space or Enter to select, then an arrow to swap',
    touch: 'Swipe a gem toward a neighbour, or tap two neighbouring gems',
  },
  accent: 'violet',
  engine: 'canvas',
  canvas: { width: 540, height: 720 },
  best: { label: 'Score', format: 'points', direction: 'higher' },
  added: '2026-10-24',
};
