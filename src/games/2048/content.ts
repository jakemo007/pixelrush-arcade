import { DOM_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: '2048 Game: Free Online Number Sliding Puzzle',
  metaDescription:
    'Play 2048 free in your browser. Slide tiles on a 4x4 board, merge equal numbers to double them and see how far past 2048 you can climb. Keyboard or swipe.',
  intro: [
    '2048 is a sliding number puzzle played on a 4 by 4 board. Every move pushes all the tiles as far as they can go in one direction. When two tiles with the same number collide, they merge into a single tile worth their sum: two 2s make a 4, two 4s make an 8, and so on.',
    'After every move a new tile appears, so the board slowly fills up. The challenge is to keep merging faster than the board fills, building one big tile in a corner until you reach 2048, and then keep going for a higher score.',
  ],
  objective:
    'Make a tile with the number 2048 by merging matching tiles. You can keep playing afterwards to build an even bigger tile and push your score higher. The game ends when the board is full and no move can merge anything.',
  rules: [
    'The board is 4 by 4. A new game starts with two tiles, each a 2 or a 4.',
    'A move slides every tile as far as it can go up, down, left or right.',
    'Two tiles with the same number that slide into each other merge into one tile with double the value.',
    'Each tile can merge only once per move. Four 2s in a row slid left become two 4s, not one 8.',
    'Merges happen from the side the tiles are moving toward. With 2, 2 and 4 in a row, sliding left gives 4 and 4: the new 4 does not merge again in the same move.',
    'After every move that changes the board, a new tile appears on a random empty square: a 2 nine times out of ten, otherwise a 4.',
    'A move that changes nothing does not count, and no new tile appears.',
    'Making the 2048 tile wins the game. You can then keep playing. The game is over when the board is full and no two neighbouring tiles match.',
  ],
  howToPlay: [
    'Press an arrow key (or W, A, S, D) to slide all the tiles in that direction. On a touchscreen, swipe on the board; with a mouse, you can also click and drag across the board.',
    'Look for pairs of equal numbers next to each other, in a row or a column, and slide them together to merge them.',
    'Keep your biggest tile in one corner and build a chain of decreasing numbers along the edge next to it.',
    'When you make 2048, choose Keep playing to continue with the same board, or start a new game.',
    'When no move is left, the game ends and your score is compared with your personal best.',
  ],
  controls: [
    { action: 'Slide tiles up', keys: ['↑', 'W'], touch: 'Swipe up on the board' },
    { action: 'Slide tiles down', keys: ['↓', 'S'], touch: 'Swipe down on the board' },
    { action: 'Slide tiles left', keys: ['←', 'A'], touch: 'Swipe left on the board' },
    { action: 'Slide tiles right', keys: ['→', 'D'], touch: 'Swipe right on the board' },
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'Every merge adds the value of the new tile to your score: merging two 8s into a 16 is worth 16 points.',
    'Your score keeps growing after you reach 2048 if you keep playing.',
    'Your best score is saved when you reach 2048 and when the game ends, whether or not you made 2048. It is stored in this browser only.',
  ],
  difficultyTitle: 'How the game gets harder',
  difficulty: [
    'The rules never change, but every move adds a tile, so the board gets more crowded the longer you play.',
    'Big tiles need many small merges: a 2048 tile takes close to a thousand moves, and one careless move can bury a big tile in the middle of the board.',
    'New tiles land on random empty squares, so you have to leave room and adapt rather than follow a fixed pattern.',
  ],
  tips: [
    {
      title: 'Pick a corner and stick to it',
      body: 'Keep your largest tile in one corner, for example the bottom left. Mostly use two directions (down and left) and a third when needed, and avoid the fourth, which pulls the big tile out of its corner.',
    },
    {
      title: 'Build a chain along the edge',
      body: 'Line up tiles in decreasing order next to your corner tile, like 256, 128, 64, 32. Each merge at the end of the chain can then roll all the way into the corner.',
    },
    {
      title: 'Keep the edge row full',
      body: 'A full bottom row cannot shift sideways when you press left or right, so your corner tile stays put.',
    },
    {
      title: 'Merge small tiles early',
      body: 'Stray 2s and 4s scattered across the board block your bigger tiles. Clean them up before they pile up.',
    },
  ],
  faq: [
    {
      q: 'What happens when I reach 2048?',
      a: 'You see a win screen with your score, and your best is saved. Choose Keep playing to continue on the same board, where you can build 4096 and beyond, or start a new game.',
    },
    {
      q: 'Why did no new tile appear after my move?',
      a: 'If a move does not change the board (nothing can slide or merge in that direction), it does not count and no tile is added. Try another direction.',
    },
    {
      q: 'Can I undo a move?',
      a: 'No. There is no undo in this version, so think one move ahead, especially when the board is nearly full.',
    },
    {
      q: 'Where is my best score saved?',
      a: 'Only in your browser’s local storage on this device. There are no accounts or global leaderboards, and private browsing or clearing site data removes it.',
    },
  ],
};
