import type { CanvasGameInfo } from '@/config/games';

export const meta: CanvasGameInfo = {
  id: 'basketball',
  name: 'Basketball Shot Challenge',
  tagline: 'Sixty seconds on the clock. Sink as many shots as you can.',
  summary:
    'Set the angle and power of each shot and watch it arc toward the rim. Swishes add points and time, streaks multiply your score, and the shooting spot moves farther out as you score.',
  genre: 'Sports arcade',
  categories: ['sports', 'arcade'],
  tags: ['Physics', 'Timed', 'Aim & power'],
  sessionLength: 'About 1 minute',
  controls: {
    keyboard: 'Left/Right to aim, Up/Down for power, Space or Enter to shoot',
    touch: 'Drag back from anywhere and release to shoot',
  },
  accent: 'amber',
  engine: 'canvas',
  canvas: { width: 540, height: 720 },
  best: { label: 'Score', format: 'points', direction: 'higher' },
  added: '2026-10-24',
};
