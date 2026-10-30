import { DOM_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Drop Four: Free Four-in-a-Row Game vs Computer',
  metaDescription:
    'Drop red and yellow discs into a 7 by 6 grid and line up four in a row first. Play the computer on three levels or a friend on one screen, free.',
  intro: [
    'Drop Four is a two-player strategy game on an upright grid of seven columns and six rows. You take turns dropping a disc into a column, and it falls to the lowest free space. The first player to line up four of their own discs in a row wins.',
    'Play the computer on Easy, Medium or Hard, or share one screen with a friend. Games are short, the rules take half a minute to learn, and good play depends on seeing threats a few moves ahead.',
  ],
  objective:
    'Connect four of your discs in a straight line: across, up and down, or diagonally. If the board fills up with no line of four, the game is a draw.',
  rules: [
    'Red always goes first. Players then take turns, dropping one disc per turn.',
    'A disc falls to the lowest empty space in the column you choose. You cannot place a disc in a full column.',
    'Four discs of one colour in a row, in a column or on a diagonal, win at once. Longer runs also win, and every disc in the run is highlighted.',
    'If all 42 spaces are filled and nobody has four in a row, the game is a draw.',
  ],
  howToPlay: [
    'Choose a mode above the board: Easy, Medium or Hard against the computer, or Two players on one screen.',
    'Against the computer you play Red and move first. Click or tap any column, or use the keyboard, to drop your disc.',
    'Watch for your rival’s threes. If they have three in a row with an open space at the end, drop a disc there before they do.',
    'Build two threats at once. If you can make two different lines of four possible with one disc, your rival can only block one of them.',
    'When the game ends, the winning four are highlighted. Press New game to play again.',
  ],
  controls: [
    { action: 'Choose a column', keys: ['←', '→', 'Home', 'End'], touch: 'Tap a column' },
    { action: 'Drop a disc in the chosen column', keys: ['Enter', 'Space', '↓'], touch: 'Tap a column' },
    { action: 'Drop straight into a column', keys: ['1', '2', '3', '4', '5', '6', '7'], touch: 'Tap a column' },
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'Drop Four has no points. A game ends in a win, a loss or a draw.',
    'Against the computer, the page keeps a record of your wins, losses and draws for each level. It is saved in this browser only, and clearing your site data removes it.',
    'In Two players mode nothing is recorded.',
  ],
  difficultyTitle: 'About the computer opponent',
  difficulty: [
    'Easy looks two moves ahead (counting each player’s move) and plays a random column about three turns in ten, so it will sometimes miss a block. It always takes a winning move when one is available.',
    'Medium looks four moves ahead. It blocks obvious threats and sets simple traps.',
    'Hard looks six moves ahead and prefers the centre columns, which take part in the most lines. It never misses a one-move win or block and sees many two-move traps, but it is not perfect, and a patient player can still beat it.',
    'The computer’s choices do not depend on how many games you have played. Take back lets you undo your last move and the computer’s reply if you spot a mistake.',
  ],
  tips: [
    {
      title: 'Start in the middle',
      body: 'The centre column is part of more possible lines than any other column. Taking it early gives you more ways to connect and more ways to block.',
    },
    {
      title: 'Look for two threats at once',
      body: 'A single threat is easy to block. Try to place a disc that creates two different ways to complete four. Your rival can only stop one.',
    },
    {
      title: 'Check the space above a threat',
      body: 'A threat only works if you can fill the space under it. If your rival has to drop a disc into the gap below your winning space, they hand you the win.',
    },
    {
      title: 'Never ignore an open three',
      body: 'Three in a row with both ends open usually cannot be stopped. Block it as soon as it appears, before it turns into three with two empty ends.',
    },
    {
      title: 'Watch diagonals as closely as rows',
      body: 'Most missed wins are diagonal. Before every move, scan both diagonals through the new disc as well as the row and column.',
    },
  ],
  faq: [
    {
      q: 'Who goes first?',
      a: 'Red always goes first. Against the computer you play Red, so you have the first-move advantage.',
    },
    {
      q: 'Can I play against a friend?',
      a: 'Yes. Choose Two players and pass the device after each move. There is no online multiplayer.',
    },
    {
      q: 'Can I undo a move?',
      a: 'Yes. Take back removes your last move and, against the computer, its reply as well. It is not available after the game ends.',
    },
    {
      q: 'Is the computer unbeatable on Hard?',
      a: 'No. It looks six moves ahead, which makes it a strong opponent, but it can still lose to a threat that takes longer than that to develop.',
    },
    {
      q: 'Where is my record saved?',
      a: 'Only in this browser, separately for each difficulty. Nothing is uploaded, and there are no accounts or global leaderboards.',
    },
  ],
};
