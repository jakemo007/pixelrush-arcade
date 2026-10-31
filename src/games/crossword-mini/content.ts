import { DOM_COMMON_CONTROLS, DOM_PAUSE_CONTROL, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Crossword Mini: Quick 5x5 Crosswords to Solve',
  metaDescription:
    'Solve 18 original 5x5 mini crosswords with hand-written clues. Check or reveal letters when stuck, beat your fastest time and track every puzzle you finish.',
  intro: [
    'Crossword Mini is a set of small, friendly crosswords that take a few minutes each. Every grid is 5x5 with a handful of black squares, and every clue was written for this game.',
    'The answers are everyday words, so you do not need to know obscure crossword vocabulary. Work through the puzzles in order, or jump to any one with the arrows above the grid.',
  ],
  objective: 'Fill every white square so that each across and down answer matches its clue.',
  rules: [
    'Each run of white squares across or down is an answer. Its number in the grid matches the number of its clue.',
    'Every white square belongs to one across answer and one down answer, so each letter is checked twice.',
    'The puzzle is complete when every letter is correct. A full grid with a mistake is not accepted, and the game tells you so.',
    'Check marks wrong letters in the selected square, the current word or the whole puzzle. Correct letters it checks are underlined and locked.',
    'Reveal fills in the right letter for a square, a word or the whole puzzle. Revealed letters are locked and shown in blue with a red corner.',
  ],
  howToPlay: [
    'Click or tap a square. The current answer is highlighted and its clue appears above the grid.',
    'Type a letter. The cursor moves to the next square of the answer, and from the last square on to the next clue.',
    'Click the selected square again, or press Space, to switch between across and down.',
    'Press Tab or Enter (or the arrows beside the clue) to go to the next clue, and Shift with Tab or Enter to go back. Click any clue in the lists to jump to it.',
    'Backspace deletes a letter and moves back. Arrow keys move around the grid.',
    'On phones and tablets, use the on-screen keyboard below the grid. Its arrow key switches between across and down.',
    'Use Check or Reveal if you are stuck, then finish the grid to see your time.',
  ],
  controls: [
    { action: 'Type a letter', keys: ['A–Z'], touch: 'On-screen keyboard' },
    { action: 'Delete a letter', keys: ['Backspace', 'Delete'], touch: 'Backspace key on the on-screen keyboard' },
    { action: 'Move around the grid', keys: ['↑', '↓', '←', '→'], touch: 'Tap a square' },
    { action: 'Switch across / down', keys: ['Space'], touch: 'Tap the selected square again, or the arrow key on the keyboard' },
    { action: 'Next / previous clue', keys: ['Tab', 'Enter', 'Shift + Tab'], touch: 'Arrows beside the clue, or tap a clue in the list' },
    { action: 'Check or reveal', keys: [], keysNote: 'Check and Reveal buttons', touch: 'Check and Reveal buttons' },
    { action: 'Previous / next puzzle', keys: [], keysNote: 'Arrows above the grid', touch: 'Arrows above the grid' },
    DOM_PAUSE_CONTROL,
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'Your result is the time from your first letter to the last correct letter. Paused time does not count.',
    'Using Check does not affect your time. If you reveal any letter, the puzzle still counts as completed, but its time is not recorded as a personal best.',
    'Your fastest time across all puzzles is your personal best. Each puzzle you finish is marked as solved, with its time, in this browser.',
  ],
  difficultyTitle: 'About the puzzles',
  difficulty: [
    'There are 18 puzzles, all 5x5, with between two and six black squares placed symmetrically.',
    'Answers are three to five letters long and every one is a common English word.',
    'The game starts with the first puzzle you have not finished yet. When you solve one, Play again moves on to the next unsolved puzzle.',
  ],
  tips: [
    {
      title: 'Start with the easiest clue',
      body: 'Fill-in-the-blank clues such as "Polka ___" are often the quickest wins, and their letters help with the crossing answers.',
    },
    {
      title: 'Use the crossings',
      body: 'Every letter belongs to two answers. If an across clue is tricky, solve the downs that cross it first.',
    },
    {
      title: 'Check a word, not the puzzle',
      body: 'Checking just the current word keeps your progress honest and points straight at the problem square.',
    },
    {
      title: 'Watch the clue tense and number',
      body: 'A clue in the past tense or the plural usually means the answer is too, like "Mailed off" for SENT.',
    },
  ],
  faq: [
    {
      q: 'Are these puzzles from a newspaper?',
      a: 'No. Every grid and clue was made for PixelRush Arcade. The grids were filled from the game’s own word list and the clues were written by hand.',
    },
    {
      q: 'Why did revealing a letter not save my time?',
      a: 'Revealed letters give the answer away, so a puzzle with reveals is marked as completed but its time is not used as a personal best. Check does not have this effect.',
    },
    {
      q: 'Where is my progress saved?',
      a: 'Solved puzzles, their times and your best time are saved only in this browser. There are no accounts or online leaderboards, and clearing your site data resets them.',
    },
    {
      q: 'Can I replay a puzzle I have already solved?',
      a: 'Yes. Use the arrows above the grid to go to any puzzle, solved or not.',
    },
  ],
};
