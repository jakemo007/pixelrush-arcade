import type { CanvasGameInfo } from '@/config/games';

export const meta: CanvasGameInfo = {
  id: 'stackfall',
  name: 'Stackfall',
  tagline: 'Fit the falling blocks together and clear the rows.',
  summary:
    'A falling-block puzzle on a 10 by 20 board. Slide, turn and drop seven shapes into complete rows, hold one piece back for later and keep the stack below the top as the pace climbs.',
  genre: 'Falling-block puzzle',
  categories: ['puzzle', 'arcade'],
  tags: ['Puzzle', 'Reflexes', 'Endless'],
  sessionLength: '3 to 15 minutes',
  controls: {
    keyboard: 'Arrows or WASD to move and turn, Space to drop, C to hold',
    touch: 'Drag to move, tap to turn, flick down to drop, tap the Hold box to hold',
  },
  accent: 'cyan',
  engine: 'canvas',
  canvas: { width: 480, height: 600 },
  best: { label: 'Score', format: 'points', direction: 'higher' },
  added: '2026-10-29',
};
