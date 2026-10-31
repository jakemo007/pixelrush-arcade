import { DOM_COMMON_CONTROLS, DOM_PAUSE_CONTROL, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Minesweeper: Classic Logic Puzzle, Free Online',
  metaDescription:
    'Clear the minefield using number clues. Free Minesweeper in three sizes with a safe first click, flags, chording, a timer and full touch and keyboard support.',
  intro: [
    'Minesweeper is a logic puzzle hidden under a grid of covered squares. Some squares hide mines; every other square, once revealed, shows how many of its eight neighbours contain a mine. From those numbers you work out where the mines must be, and which squares are safe to open.',
    'This version has the three classic sizes, a first click that is always safe, flags, chording for fast play and a timer that records your best time for each difficulty. It works with a mouse, a keyboard or a touchscreen.',
  ],
  objective:
    'Reveal every square that does not hide a mine. You win as soon as the last safe square is open, and the remaining mines are flagged for you. Reveal a mine and the game is over.',
  rules: [
    'Each revealed square shows the number of mines in the up to eight squares touching it (sides and corners). A blank square has no mines around it.',
    'Your first reveal is always safe: the mines are only placed after it, never on that square or the squares around it, so it always opens an area.',
    'Revealing a blank square automatically reveals all its neighbours, spreading until it reaches numbered squares.',
    'You can flag a square you believe hides a mine. Flagged squares cannot be revealed by accident; remove the flag first.',
    'Chording: activating a revealed number that already has that many flags around it reveals all of its other covered neighbours at once. If one of your flags is wrong, this can reveal a mine.',
    'The Mines counter shows the number of mines minus the number of flags you have placed. It can go below zero if you place too many flags.',
    'The timer starts with your first reveal and stops when you win or lose. Pausing hides the board and stops the timer.',
  ],
  howToPlay: [
    'Choose a difficulty: Beginner (9 by 9, 10 mines), Intermediate (16 by 16, 40 mines) or Expert (30 by 16, 99 mines).',
    'Reveal any square to start. With a mouse, left-click; on a touchscreen, tap; with a keyboard, move with the arrow keys and press Space or Enter.',
    'Read the numbers. A 1 with only one covered neighbour means that neighbour is a mine: flag it with a right-click, a long-press (hold for about half a second), the F key, or by switching the Reveal / Flag toggle to Flag and tapping.',
    'When a number has as many flags around it as its value, click, tap or press Enter on the number to reveal the rest of its neighbours (chording).',
    'Keep going until every safe square is open. If you reveal a mine, all the mines are shown and any wrong flags are marked with a cross.',
    'On phones, Expert is shown turned on its side (16 columns, 30 rows) so the squares stay larger. On Intermediate and Expert you can also press Zoom for larger squares and scroll around the board.',
  ],
  controls: [
    { action: 'Reveal a square', keys: ['Space', 'Enter'], touch: 'Tap (in Reveal mode) or left-click' },
    { action: 'Flag or unflag a square', keys: ['F'], touch: 'Long-press, tap in Flag mode, or right-click' },
    { action: 'Move between squares', keys: ['↑', '↓', '←', '→'], touch: 'Tap the square you want' },
    { action: 'Chord (open around a number)', keys: ['Space', 'Enter'], touch: 'Tap or click a revealed number' },
    { action: 'Switch tap action', keys: [], keysNote: 'Reveal / Flag toggle', touch: 'Reveal / Flag toggle above the board' },
    { action: 'Larger squares (Intermediate, Expert)', keys: [], keysNote: 'Zoom button', touch: 'Zoom button, then scroll the board' },
    DOM_PAUSE_CONTROL,
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'Your result is the time from your first reveal to your last safe square, shown as minutes and seconds.',
    'Only won games count. Your best (fastest) time is kept separately for Beginner, Intermediate and Expert, in this browser only.',
    'Time spent paused does not count.',
  ],
  difficultyTitle: 'Difficulty levels',
  difficulty: [
    'Beginner: 9 by 9 squares with 10 mines (about one square in eight is a mine).',
    'Intermediate: 16 by 16 squares with 40 mines (about one in six).',
    'Expert: 30 by 16 squares with 99 mines (about one in five). Denser mines mean fewer free openings and more careful deduction.',
    'Occasionally the numbers do not give enough information and you have to guess. That is part of classic Minesweeper.',
  ],
  tips: [
    {
      title: 'Start in the middle',
      body: 'Because the first reveal always opens an area, a square away from the edges usually opens the biggest region to work from.',
    },
    {
      title: 'Look for 1-2-1 and 1-2-2-1 patterns',
      body: 'Along a straight edge, 1-2-1 means the mines sit under the two 1s; 1-2-2-1 means they sit under the two 2s. Spotting these saves a lot of thinking.',
    },
    {
      title: 'Subtract what you already know',
      body: 'If a 3 already touches two flagged mines, it has exactly one more mine among its other covered neighbours. Working with the "remaining" count makes hard spots easy.',
    },
    {
      title: 'Chord to speed up',
      body: 'Once a number has all its mines flagged, chord it to open its other neighbours in one go instead of revealing them one by one.',
    },
    {
      title: 'Use Flag mode on a phone',
      body: 'If long-presses feel slow, switch the toggle to Flag while you mark a group of mines, then switch back to Reveal.',
    },
  ],
  faq: [
    {
      q: 'Is the first click really always safe?',
      a: 'Yes. Mines are placed only after your first reveal, and never on that square or the eight around it, so your first move always opens an area.',
    },
    {
      q: 'How do I flag a mine on a phone or tablet?',
      a: 'Press and hold a square for about half a second, or tap the Flag side of the Reveal / Flag toggle and then tap squares. Long-pressing never reveals a square.',
    },
    {
      q: 'What is chording?',
      a: 'When a revealed number already has that many flags around it, clicking or tapping the number opens all of its other covered neighbours at once. Make sure your flags are right first.',
    },
    {
      q: 'Why did the timer stop on its own?',
      a: 'The game pauses automatically when you switch tabs or minimize the browser, and the board is hidden while paused, so your time is only counted while you can see the board.',
    },
    {
      q: 'Where are my best times saved?',
      a: 'In your browser’s local storage on this device, one best time per difficulty. There are no accounts or global leaderboards, and clearing site data removes them.',
    },
  ],
};
