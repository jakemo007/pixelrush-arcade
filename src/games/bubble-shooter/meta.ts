import type { CanvasGameInfo } from '@/config/games';

export const meta: CanvasGameInfo = {
  id: 'bubble-shooter',
  name: 'Bubble Shooter',
  tagline: 'Aim, bank off the walls and pop groups of three.',
  summary:
    'Fire bubbles into the cluster above and connect three or more of a colour to pop them. Cut away whole branches for bonus points before the cluster reaches the line.',
  genre: 'Bubble matching',
  categories: ['arcade', 'puzzle'],
  tags: ['Aim & bank', 'Matching', 'Levels'],
  sessionLength: '3 to 10 minutes',
  controls: {
    keyboard: 'Left/Right or A/D to aim, Space or Up to shoot, Down or X to swap',
    touch: 'Drag to aim and release to shoot; tap the next bubble to swap',
  },
  accent: 'magenta',
  engine: 'canvas',
  canvas: { width: 480, height: 720 },
  best: { label: 'Score', format: 'points', direction: 'higher' },
  added: '2026-10-24',
};
