import { CANVAS_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Bubble Shooter: Aim, Bank and Pop Bubbles Online',
  metaDescription:
    'Aim the cannon, bank shots off the walls and pop groups of three or more matching bubbles. Drop whole branches for bonuses in this free browser bubble shooter.',
  intro: [
    'Bubble Shooter is a level-based take on the classic matching game. A cluster of coloured bubbles hangs from the ceiling and your cannon at the bottom fires one bubble at a time. Land a bubble next to two or more of the same colour and the whole group pops.',
    'Every colour also carries its own symbol (circle, diamond, star, triangle, square or hexagon), so you can read the board without relying on colour. A dotted guide shows where your shot will travel, including one bounce off a side wall.',
  ],
  objective:
    'Clear every bubble from the board to finish a level, and keep the cluster above the red danger line. Each new level adds rows, colours or pressure, and your score carries over until a bubble crosses the line.',
  howToPlay: [
    'Press Start game. The bubble in the cannon is the one you fire; the smaller bubble on the left is next.',
    'Aim with the mouse, your finger or the arrow keys. The dotted line shows the path, including one bank off a side wall.',
    'Shoot by clicking, by lifting your finger, or with Space. A bubble sticks as soon as it touches the ceiling or another bubble.',
    'Connect three or more bubbles of the same colour and symbol to pop them. Any bubbles left hanging from the popped group fall off and score a bonus.',
    'Tap the next bubble (or press Down or X) to swap it with the loaded one when it suits the shot better.',
    'Every few shots without a pop, a new row pushes the whole cluster down. If a bubble crosses the danger line, the game ends.',
  ],
  controls: [
    { action: 'Aim', keys: ['←', '→', 'A', 'D'], touch: 'Drag on the board (or move the mouse over it)' },
    { action: 'Shoot', keys: ['Space', '↑', 'W'], touch: 'Lift your finger, or click' },
    { action: 'Swap loaded and next bubble', keys: ['↓', 'S', 'X'], touch: 'Tap the next bubble at the bottom left' },
    ...CANVAS_COMMON_CONTROLS,
  ],
  scoring: [
    'Popped bubble: 10 points each (a group of three is worth 30).',
    'Dropped bubble (cut loose from the ceiling by a pop): 25 points each.',
    'Clearing the board: 250 points × the level number.',
    'Your best score is saved only in this browser.',
  ],
  difficultyTitle: 'Levels',
  difficulty: [
    'Level 1 starts with 6 rows in 4 colours, and a new row arrives after 7 shots in a row without a pop.',
    'Each level adds a row (up to 10) and shortens the countdown: 6 shots on level 2, 5 on level 3 and 4 from level 4 onwards.',
    'A fifth colour joins on level 3 and a sixth on level 5.',
    'Your next bubbles only use colours that are still on the board, so you are never handed a colour you cannot match.',
  ],
  tips: [
    {
      title: 'Aim for the hanging branches',
      body: 'Popping a small group that holds up a big branch drops everything below it, and dropped bubbles are worth more than popped ones.',
    },
    {
      title: 'Use the walls',
      body: 'The guide shows one bank off a side wall. Banked shots reach gaps that a straight shot cannot, especially near the edges.',
    },
    {
      title: 'Plan with the next bubble',
      body: 'Look at both bubbles before each shot. If the loaded one has nowhere useful to go, swap it and save it for later.',
    },
    {
      title: 'Watch the row countdown',
      body: 'The dots at the bottom right show how close the next row is. When it is one shot away, a pop is worth more than a perfect setup.',
    },
  ],
  faq: [
    {
      q: 'Can I play without telling colours apart?',
      a: 'Yes. Every colour has its own symbol inside the bubble: circle, diamond, star, triangle, square or hexagon.',
    },
    {
      q: 'Does the game ever end if I keep clearing levels?',
      a: 'No. Levels keep coming with more rows and colours; the run ends only when a bubble crosses the danger line.',
    },
    {
      q: 'Where is my high score saved?',
      a: 'Only in this browser’s local storage on this device. There are no accounts or online leaderboards, and clearing site data removes it.',
    },
    {
      q: 'Does it work on phones?',
      a: 'Yes. Touch the board to aim, slide your finger to adjust and lift it to shoot. Drag below the cannon before lifting to cancel a shot.',
    },
  ],
};
