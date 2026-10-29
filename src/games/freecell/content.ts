import { DOM_COMMON_CONTROLS, DOM_PAUSE_CONTROL, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'FreeCell Solitaire: Play Free Online with Numbered Deals',
  metaDescription:
    'Play FreeCell solitaire free online: every card face up, four free cells, smart multi-card moves and numbered deals you can replay, with undo on any device.',
  intro: [
    'FreeCell deals all 52 cards face up into eight columns, so nothing is hidden and almost every deal can be solved. What makes it a puzzle is space: four free cells, each holding one card, and whatever empty columns you can create.',
    'Every game has a deal number from 1 to 32,000 using the classic numbering many FreeCell programs share, so you can replay a deal you lost or try one a friend recommends.',
  ],
  objective: 'Move all 52 cards to the four foundations, building each suit up from Ace to King.',
  rules: [
    'The deal: all 52 cards face up in eight columns of 7, 7, 7, 7, 6, 6, 6 and 6 cards. Four free cells and four foundations start empty.',
    'Tableau columns build down in alternating colours: a red 9 goes on a black 10.',
    'Each free cell holds any one card. Any card, or any valid run, can go into an empty column.',
    'Foundations build up by suit from the Ace; any Ace can start any empty foundation. Cards on the foundations stay there.',
    'Officially only one card moves at a time, but a run can be moved in one go when there is enough free space to do it card by card: up to (1 + empty free cells) × 2 to the power of the number of empty columns. When the destination is itself an empty column, it does not count as free space.',
    'After each of your moves, cards that can no longer be needed on the tableau go to the foundations automatically. Aces and 2s always go up; any other card goes up once both foundations of the opposite colour have reached one rank below it.',
  ],
  howToPlay: [
    'Study the deal before your first move: find the Aces and the cards blocking them.',
    'Click or tap a card to pick it up (a valid run lifts with it), then click a column, a free cell or a foundation. You can also drag cards.',
    'Double-click or double-tap a top card to send it to its foundation, or to an empty free cell if it cannot go up yet.',
    'Keep an eye on the "Move up to" counter above the table: it shows the longest run you can move with your current free space.',
    'Use Undo to take back a move (along with any cards that went up automatically after it). Replay deal restarts the same cards; Play deal starts any numbered deal.',
  ],
  controls: [
    { action: 'Move between piles and cards', keys: ['←', '→', '↑', '↓'], touch: 'Not needed' },
    { action: 'Pick up a card and the run on it', keys: ['Enter', 'Space'], touch: 'Tap the card' },
    { action: 'Place the cards you picked up', keys: ['Enter', 'Space'], touch: 'Tap the destination' },
    { action: 'Drag and drop', keys: [], keysNote: 'Drag with the mouse', touch: 'Drag the card with your finger' },
    { action: 'Send a card to a foundation or free cell', keys: ['F'], touch: 'Double-tap the card (double-click with a mouse)' },
    { action: 'Undo', keys: ['U'], touch: 'Undo button' },
    { action: 'Put the cards back down', keys: ['Esc'], touch: 'Tap the same card again' },
    ...DOM_COMMON_CONTROLS,
    DOM_PAUSE_CONTROL,
  ],
  scoring: [
    'Moves counts the moves you make. A multi-card run move counts as one, and automatic moves to the foundations are free. Undo takes the move off the count again.',
    'The timer starts with your first move and stops while paused; the game pauses itself when you switch tabs.',
    'Your personal best is your fastest winning time on any deal, saved in this browser. Games played and won are counted under the table.',
  ],
  difficultyTitle: 'How hard is a deal?',
  difficulty: [
    'Because every card is visible, FreeCell is a game of planning rather than luck. Nearly all deals can be solved; deal #11982 is the famous exception in the classic set.',
    'Some deals are much harder than others. Losing your free cells early is the usual way to get stuck; the game tells you if no legal move is left.',
    'For a fair comparison with a friend, play the same deal number and compare times.',
  ],
  tips: [
    {
      title: 'Free cells are for emergencies',
      body: 'Every card you park in a free cell halves your room to move runs. Try to keep at least two cells empty for as long as you can.',
    },
    {
      title: 'An empty column is worth two free cells',
      body: 'Each empty column doubles the size of the run you can move. Emptying a short column early often unlocks the whole game.',
    },
    {
      title: 'Dig for the Aces and 2s',
      body: 'Low cards buried deep in a column block everything above them. Plan a route to them in your first few moves.',
    },
    {
      title: 'Build runs before you move them',
      body: 'A long alternating run is easy to shift when you have space and almost impossible when you do not. Watch the "Move up to" counter.',
    },
  ],
  faq: [
    {
      q: 'Is every FreeCell deal solvable?',
      a: 'Almost. Of the 32,000 classic numbered deals, only deal #11982 is known to be impossible. The rest can all be won with the right moves.',
    },
    {
      q: 'Why can I not move my whole run?',
      a: 'A run can only move if it could be moved one card at a time using your empty free cells and columns. The counter above the table shows the current limit.',
    },
    {
      q: 'Why did some cards jump to the foundations by themselves?',
      a: 'After every move, cards that no longer have any use on the table are moved up automatically. A card stays down while a lower card of the other colour might still need to be placed on it.',
    },
    {
      q: 'Where are my times saved?',
      a: 'Only in this browser’s local storage. Nothing is uploaded and there is no global leaderboard.',
    },
  ],
};
