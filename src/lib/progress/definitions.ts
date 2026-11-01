import type { AchievementDef } from './achievements';

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'bb-first-clear', name: 'First wall', description: 'Clear a Brick Breaker level.', counter: 'brick-breaker:levels-cleared', target: 1 },
  { id: 'bb-ten-clears', name: 'Wall breaker', description: 'Clear 10 Brick Breaker levels.', counter: 'brick-breaker:levels-cleared', target: 10 },
  { id: 'bb-thirty-clears', name: 'Demolition crew', description: 'Clear 30 Brick Breaker levels in total.', counter: 'brick-breaker:levels-cleared', target: 30 },
  { id: 'bb-flawless-five', name: 'Steady hands', description: 'Clear 5 Brick Breaker levels without losing a ball.', counter: 'brick-breaker:flawless-levels', target: 5 },
  { id: 'bb-combo-eight', name: 'Combo master', description: 'Break 8 bricks before the ball touches your paddle.', counter: 'brick-breaker:best-combo', target: 8 },
  { id: 'bb-level-twenty', name: 'Climber', description: 'Clear Brick Breaker level 20.', counter: 'brick-breaker:highest-level', target: 20 },
];
