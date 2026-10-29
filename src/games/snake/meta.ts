import type { CanvasGameInfo } from '@/config/games';

export const meta: CanvasGameInfo = {
  id: 'snake',
  name: 'Snake',
  tagline: 'Eat, grow and never bite your own tail.',
  summary:
    'The arcade classic on a neon grid. Steer the snake to the food, grow longer with every bite and avoid the walls and your own tail as the pace picks up.',
  genre: 'Classic arcade',
  categories: ['arcade'],
  tags: ['Classic', 'Reflexes', 'Quick runs'],
  sessionLength: '1 to 5 minutes',
  controls: {
    keyboard: 'Arrow keys or WASD to turn',
    touch: 'Swipe on the game to turn, or tap beside the snake’s head',
  },
  accent: 'green',
  engine: 'canvas',
  canvas: { width: 600, height: 600 },
  best: { label: 'Score', format: 'points', direction: 'higher' },
  added: '2026-10-24',
};
