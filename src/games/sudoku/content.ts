import { DOM_COMMON_CONTROLS, DOM_PAUSE_CONTROL, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Sudoku: Free Puzzles with Notes and Hints',
  metaDescription:
    'Play free 9x9 Sudoku in Easy, Medium or Hard. Every puzzle has exactly one solution, graded by the logic it needs, with notes, undo, hints and a timer.',
  intro: [
    'Sudoku is a logic puzzle played on a 9x9 grid divided into nine 3x3 boxes. Some cells start with numbers; your job is to fill in the rest so that every row, every column and every box contains each of the digits 1 to 9 exactly once.',
    'Every puzzle here is checked by a solver to have exactly one solution, so it can always be finished by reasoning alone. Difficulty is not guessed from the number of clues: a logical solver works through each puzzle the way a person would and grades it by the hardest technique it needs.',
  ],
  objective: 'Fill every empty cell so that each row, column and 3x3 box contains the digits 1 to 9 exactly once.',
  rules: [
    'Each row must contain the digits 1 to 9 with no repeats.',
    'Each column must contain the digits 1 to 9 with no repeats.',
    'Each of the nine 3x3 boxes must contain the digits 1 to 9 with no repeats.',
    'The starting numbers (shown in bold white) are fixed and cannot be changed.',
    'Every puzzle has exactly one solution. The game is won when every cell matches it.',
  ],
  howToPlay: [
    'Click or tap a cell to select it. Its row, column and box are shaded, and every cell with the same digit is highlighted.',
    'Type a digit from 1 to 9, or tap it on the number pad. Entering the same digit again, or pressing Erase, clears the cell.',
    'Turn on Notes (the Notes button or the N key) to pencil small candidate digits into a cell instead. Shift plus a digit adds or removes a note without switching modes.',
    'Placing a digit automatically removes it from the notes in the same row, column and box.',
    'Digits that clash with another copy in the same row, column or box get a red outline straight away. Turn on "Mark digits that do not match the solution" to also flag wrong digits with a red ×.',
    'Stuck? Hint fills one cell with the correct digit: the selected cell if it is empty or wrong, otherwise the most useful next cell.',
    'The timer starts with your first move and stops when the last digit is correct.',
  ],
  controls: [
    { action: 'Move the selection', keys: ['↑', '↓', '←', '→'], touch: 'Tap a cell' },
    { action: 'Enter a digit', keys: ['1–9'], touch: 'Tap a number on the pad' },
    { action: 'Clear a cell', keys: ['Backspace', 'Delete', '0'], touch: 'Erase button' },
    { action: 'Notes mode on / off', keys: ['N'], touch: 'Notes button' },
    { action: 'Add or remove one note', keys: ['Shift + 1–9'], touch: 'Turn Notes on, then tap a number' },
    { action: 'Undo', keys: ['Ctrl + Z'], touch: 'Undo button' },
    { action: 'Get a hint', keys: [], keysNote: 'Hint button', touch: 'Hint button' },
    { action: 'Change difficulty', keys: [], keysNote: 'Difficulty buttons', touch: 'Difficulty buttons above the board' },
    DOM_PAUSE_CONTROL,
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'Your result is the time taken to solve the puzzle, from your first move to the last correct digit. Paused time does not count.',
    'Your fastest time is kept separately for Easy, Medium and Hard, in this browser only.',
    'Hints are allowed: each one fills a single correct cell, and the result screen says how many you used.',
  ],
  difficultyTitle: 'How puzzles are graded',
  difficulty: [
    'Easy: solvable using only naked singles (a cell with one possible digit) and hidden singles (a digit with one possible cell in a row, column or box). Easy puzzles start with at least 36 numbers.',
    'Medium: needs at least one intermediate step, either a pointing pair or triple, a box/line reduction, a naked pair or a hidden pair, and nothing harder.',
    'Hard: needs at least one advanced technique, either a naked or hidden triple, an X-Wing, an XY-Wing, a Swordfish or a naked or hidden quad, but never guessing.',
    'Every puzzle comes from a bank of 240 original puzzles, 80 per level, made by this game’s own generator and verified by automated tests. Each one is shown with its digits relabelled and its rows and columns reshuffled, so the same puzzle rarely looks the same twice.',
  ],
  tips: [
    {
      title: 'Start with the busiest rows, columns and boxes',
      body: 'The more digits a line already has, the fewer places the missing ones can go. Look for a digit that fits in only one cell.',
    },
    {
      title: 'Use same-digit highlighting',
      body: 'Select a cell holding a 7 and every 7 lights up. Boxes without a 7 that are crossed by those rows and columns often leave just one spot.',
    },
    {
      title: 'Pencil in pairs',
      body: 'When two cells in a box can only be the same two digits, note them. That pair cannot appear anywhere else in that box.',
    },
    {
      title: 'Undo is free',
      body: 'Undo has no penalty, so you can test an idea. A red outline means two equal digits share a row, column or box.',
    },
  ],
  faq: [
    {
      q: 'Does every puzzle have exactly one solution?',
      a: 'Yes. Every puzzle in the bank is proven unique by a solver in the game’s tests, and the game checks the shuffled version again before showing it.',
    },
    {
      q: 'Do hints or mistake marking affect my time?',
      a: 'No time is added. Hints simply fill a correct cell and are counted on the result screen, and marking mistakes is just a display option.',
    },
    {
      q: 'Where are my best times saved?',
      a: 'Only in this browser, one best time per difficulty. There are no accounts or online leaderboards, and clearing your browser’s site data removes them.',
    },
    {
      q: 'Can I pause the game?',
      a: 'Yes. The Pause button hides the board and stops the timer, and the game pauses automatically if you switch to another tab.',
    },
    {
      q: 'Is my game saved if I leave the page?',
      a: 'No. A puzzle in progress is lost if you reload or leave the page. Your mistake-marking setting and best times are kept.',
    },
  ],
};
