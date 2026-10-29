import { CANVAS_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Snake: Play the Classic Arcade Game Free Online',
  metaDescription:
    'Guide a neon snake around a 20 by 20 grid, eat to grow longer and dodge the walls and your own tail as the speed climbs. Free, with keyboard or swipe controls.',
  intro: [
    'Snake is the arcade classic where the player is also the obstacle. Your snake glides around a 20 by 20 neon grid on its own; you choose when it turns. Every piece of food makes it one segment longer, so the space you have to move in shrinks as your score grows.',
    'The game starts gently and gets faster as you eat. Turns are buffered, so a quick double tap of two keys (or two swipes) is never lost, and the snake can never reverse straight back into itself.',
  ],
  objective:
    'Eat as much food as you can without steering into a wall or into your own body. The run ends on the first crash. If you ever fill every square of the board, you win.',
  howToPlay: [
    'Press Start game, Space, Enter or the Up Arrow to begin. The snake sets off to the right, three segments long.',
    'Turn with the arrow keys or WASD. On a touchscreen, swipe on the game in the direction you want to go, or tap beside the snake’s head: when it is moving sideways, tap above or below the head; when it is moving up or down, tap to its left or right.',
    'Steer into the pink fruit to eat it. The snake grows by one segment and a new fruit appears on a free square.',
    'You can press two turns in quick succession (for example Up then Left) to make a tight U-turn: the game remembers up to two turns and applies one per move.',
    'Avoid the four walls and your own body. The square the tail is leaving is safe to move into, because the tail moves on at the same moment.',
    'After a crash, press Enter, R or Play again to start a new run.',
  ],
  controls: [
    { action: 'Turn up / down', keys: ['↑', '↓', 'W', 'S'], touch: 'Swipe up or down, or tap above or below the head while moving sideways' },
    { action: 'Turn left / right', keys: ['←', '→', 'A', 'D'], touch: 'Swipe left or right, or tap left or right of the head while moving up or down' },
    { action: 'Start a run', keys: ['Space', 'Enter', '↑'], touch: 'Start game button' },
    ...CANVAS_COMMON_CONTROLS,
  ],
  scoring: [
    'Each fruit is worth 10 points multiplied by the current speed level: 10 points at speed 1, 20 at speed 2, up to 80 at speed 8.',
    'The HUD shows your score, your best, the snake’s length and the current speed level.',
    'Your best score is saved in this browser only. Clearing your browser’s site data removes it.',
  ],
  difficulty: [
    'The snake starts at speed level 1, moving one square every 150 milliseconds (just under 7 squares a second).',
    'Every 4 fruits raise the speed level by one, and each level is 12 milliseconds per move faster than the last.',
    'Speed level 8 is the top speed, one square every 66 milliseconds (about 15 squares a second). You reach it after 28 fruits.',
    'As the snake grows, there is less free space, so planning your route matters more than reflexes in the late game.',
  ],
  tips: [
    {
      title: 'Hug the walls early',
      body: 'Circling around the outside of the board keeps the middle open, so you always have room to turn back toward the fruit.',
    },
    {
      title: 'Use the turn buffer for U-turns',
      body: 'To double back along a row, press both turns quickly (for example Up then Left). The second turn waits for the next move, so you can tap them in one motion.',
    },
    {
      title: 'Do not chase every fruit directly',
      body: 'A long snake that cuts straight across the board can split the free space in two and trap itself. Take the long way round when the direct route would box you in.',
    },
    {
      title: 'Follow your tail',
      body: 'The square your tail is about to leave is always safe. When space runs out, trailing your own tail buys time until a clear path to the fruit opens up.',
    },
  ],
  faq: [
    {
      q: 'Can the snake go through the walls?',
      a: 'No. The edges of the board are solid walls, and touching one ends the run. Turning back on yourself is also blocked: pressing the opposite direction is simply ignored.',
    },
    {
      q: 'How do I play Snake on a phone?',
      a: 'Swipe on the game in the direction you want to turn. You can also tap on either side of the snake’s head to turn toward that side. The page does not scroll while you play, so swipes never move the screen.',
    },
    {
      q: 'Why did the game pause by itself?',
      a: 'Snake pauses automatically when you switch tabs, minimize the browser or move keyboard focus away from the game, so you never crash while you are not looking.',
    },
    {
      q: 'Where is my high score saved?',
      a: 'Only in your browser’s local storage on this device. There is no account and no global leaderboard. Private browsing or clearing site data removes it.',
    },
  ],
};
