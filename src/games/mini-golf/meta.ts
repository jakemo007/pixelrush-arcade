import type { CanvasGameInfo } from '@/config/games';

export const meta: CanvasGameInfo = {
  id: 'mini-golf',
  name: 'Mini Golf',
  tagline: 'Nine holes of bank shots, ramps, water and a windmill.',
  summary:
    'Pull back to aim and set your power, then putt around angled walls, sand, water, slopes and moving obstacles. Finish all nine holes in as few strokes as you can.',
  genre: 'Mini golf',
  categories: ['sports'],
  tags: ['Physics', 'Nine holes', 'Aim & power'],
  sessionLength: '5 to 10 minutes',
  controls: {
    keyboard: 'Left/Right to aim, Up/Down to set power, Space or Enter to putt',
    touch: 'Drag back from anywhere and release to putt',
  },
  accent: 'green',
  engine: 'canvas',
  canvas: { width: 540, height: 720 },
  best: { label: 'Strokes', format: 'count', unit: 'strokes', direction: 'lower', requiresWin: true },
  added: '2026-10-24',
};
