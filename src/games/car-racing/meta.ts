import type { CanvasGameInfo } from '@/config/games';

export const meta: CanvasGameInfo = {
  id: 'car-racing',
  name: 'Car Racing Time Trial',
  tagline: 'Three laps, one clock. Shave every tenth off your best time.',
  summary:
    'A top-down time trial around a twisting neon circuit. Brake into the corners, stay off the grass and race a ghost of your best lap to set your fastest three-lap time.',
  genre: 'Top-down racing',
  categories: ['racing'],
  tags: ['Time trial', 'Laps', 'Ghost car'],
  sessionLength: '1 to 3 minutes',
  controls: {
    keyboard: 'Up/W to accelerate, Down/S to brake and reverse, Left/Right or A/D to steer',
    touch: 'Hold to drive and steer toward your finger; hold the bottom strip to brake',
  },
  accent: 'amber',
  engine: 'canvas',
  canvas: { width: 540, height: 720 },
  best: { label: 'Time', format: 'racetime', direction: 'lower', requiresWin: true },
  added: '2026-10-24',
};
