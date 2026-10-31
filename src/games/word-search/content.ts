import { DOM_COMMON_CONTROLS, DOM_PAUSE_CONTROL, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Word Search: Themed Puzzles in Three Grid Sizes',
  metaDescription:
    'Hunt for hidden words in a fresh themed grid every game. Drag or tap to circle words, from a gentle 10x10 to a 14x14 grid with backwards words.',
  intro: [
    'Word Search hides a list of themed words in a grid of letters. Each word runs in a straight line, and your job is to find and circle every one of them as quickly as you can.',
    'A new puzzle is generated every game from 15 themes, such as Ocean Life, Outer Space and Bakery Window, so you never play the same grid twice. Each word appears exactly once in the grid, so there is never any doubt about where it is.',
  ],
  objective: 'Find every word in the list as fast as you can.',
  rules: [
    'Every word in the list is hidden exactly once, in a straight line of neighbouring letters.',
    'Easy words run left to right or top to bottom. Medium adds diagonals running left to right. Hard words can run in any of the eight directions, including backwards.',
    'Words may cross and share letters.',
    'A selection counts when it covers exactly one listed word, from its first letter to its last (you can select it in either direction).',
  ],
  howToPlay: [
    'Read the theme and the word list beside (or below) the grid.',
    'Drag across a word from its first letter to its last. The highlight snaps to straight lines, so you do not have to be precise.',
    'Or tap the first letter, then tap the last letter.',
    'With a keyboard, move with the arrow keys, press Enter on the first letter, move to the last letter and press Enter again. Escape cancels.',
    'Found words stay circled in their own colour and are ticked and struck through in the list.',
    'The timer starts with your first selection. Find every word to finish.',
  ],
  controls: [
    { action: 'Select a word', keys: [], keysNote: 'Drag with the mouse', touch: 'Drag across the letters' },
    { action: 'Select by first and last letter', keys: ['Enter', 'Space'], touch: 'Tap the first letter, then the last' },
    { action: 'Move around the grid', keys: ['↑', '↓', '←', '→'], touch: '–' },
    { action: 'Cancel a selection', keys: ['Esc'], touch: 'Tap the first letter again' },
    { action: 'Change difficulty', keys: [], keysNote: 'Difficulty buttons', touch: 'Difficulty buttons above the grid' },
    DOM_PAUSE_CONTROL,
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'Your result is the time taken to find every word. The clock starts with your first selection and stops while the game is paused.',
    'Your fastest time is saved separately for Easy, Medium and Hard, in this browser only.',
    'Wrong selections cost nothing except a moment of your time.',
  ],
  difficultyTitle: 'Difficulty levels',
  difficulty: [
    'Easy: a 10x10 grid with 8 words, all reading left to right or top to bottom.',
    'Medium: a 12x12 grid with 10 words, adding diagonals that read left to right (downwards or upwards).',
    'Hard: a 14x14 grid with 12 words that can run in all eight directions, including right to left and bottom to top.',
    'The filler letters follow everyday English letter frequencies, so the hidden words blend in rather than standing out.',
  ],
  tips: [
    {
      title: 'Hunt for rare letters',
      body: 'Words with a J, K, Q, X, Y or Z are easy to spot because those letters are scarce in the filler. Start there.',
    },
    {
      title: 'Scan for the first two letters',
      body: 'Pick a word, find every copy of its first letter, then check the eight neighbours of each for the second letter.',
    },
    {
      title: 'Find long words first',
      body: 'Long words cross many rows or columns and are easier to spot. They also share letters with shorter words nearby.',
    },
    {
      title: 'On Hard, read backwards too',
      body: 'Half of the directions read backwards. Searching for the last letter of a word works just as well as the first.',
    },
  ],
  faq: [
    {
      q: 'Can a word appear twice?',
      a: 'No. The generator checks every grid and re-rolls the filler letters if a listed word would appear more than once, in any direction.',
    },
    {
      q: 'Do I have to drag in the direction the word reads?',
      a: 'No. Selecting a word from its last letter to its first works too.',
    },
    {
      q: 'Where are my best times saved?',
      a: 'In this browser only, one per difficulty. There are no accounts or global leaderboards, and clearing your site data removes them.',
    },
    {
      q: 'Is it suitable for children?',
      a: 'Yes. Every theme and word is family friendly, and Easy only uses words that read left to right or top to bottom.',
    },
  ],
};
