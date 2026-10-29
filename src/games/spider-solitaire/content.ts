import { DOM_COMMON_CONTROLS, DOM_PAUSE_CONTROL, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Spider Solitaire: 1, 2 or 4 Suits, Free to Play',
  metaDescription:
    'Free two-deck Spider Solitaire for your browser with one, two or four suits. Build King-to-Ace runs, deal fresh rows, undo mistakes and chase a high score.',
  intro: [
    'Spider Solitaire is played with two full decks across ten columns. You can stack any card on one rank higher, but only runs of a single suit move together, so the game is all about untangling mixed columns into clean King-to-Ace sequences.',
    'Start with one suit to learn how the columns flow, then try two or four suits, where the same moves get much harder to plan.',
  ],
  objective:
    'Build eight complete runs from King down to Ace, each in a single suit. Every finished run is removed from the table automatically; clear all eight to win.',
  rules: [
    'The deal: 104 cards. Ten columns get 6, 6, 6, 6, 5, 5, 5, 5, 5 and 5 cards with only the top card face up. The other 50 cards wait in the stock.',
    'Any card may be placed on a card exactly one rank higher, whatever its suit: a 7 of hearts can go on an 8 of spades.',
    'A group of cards can only be moved together if it is a descending run of one suit. Mixed-suit stacks have to be taken apart one run at a time.',
    'Any card or valid run may be moved into an empty column.',
    'When a face-down card is left on top of a column it is turned over automatically.',
    'Clicking the stock deals one face-up card onto every column (five deals in total). You cannot deal while any column is empty: fill every gap first.',
    'As soon as a column ends in a complete King-to-Ace run of one suit, the run is removed to the completed runs at the top, including runs completed by a deal.',
  ],
  howToPlay: [
    'Choose 1 suit, 2 suits or 4 suits above the table.',
    'Click or tap a card to pick it up together with the cards on it (only a same-suit run lifts), then click the column where it should go. Dragging works too.',
    'Double-click or double-tap a run to move it to the best column automatically: one rank higher in the same suit if possible, then any suit, then an empty column.',
    'Build same-suit runs wherever you can; mixed-suit stacks block you later.',
    'When you run out of useful moves, click the stock (or the Deal button) to deal a new row.',
    'Undo takes back moves and deals. The message line under the table explains why a move is not allowed and warns you if no moves or deals are left.',
  ],
  controls: [
    { action: 'Move between columns and cards', keys: ['←', '→', '↑', '↓'], touch: 'Not needed' },
    { action: 'Pick up a card and the run on it', keys: ['Enter', 'Space'], touch: 'Tap the card' },
    { action: 'Place the run you picked up', keys: ['Enter', 'Space'], touch: 'Tap the destination column' },
    { action: 'Drag and drop', keys: [], keysNote: 'Drag with the mouse', touch: 'Drag the card with your finger' },
    { action: 'Move a run to its best column', keys: ['F'], touch: 'Double-tap the run (double-click with a mouse)' },
    { action: 'Deal a new row', keys: ['D'], touch: 'Tap the stock or the Deal button' },
    { action: 'Undo', keys: ['U'], touch: 'Undo button' },
    { action: 'Put the cards back down', keys: ['Esc'], touch: 'Tap the same card again' },
    ...DOM_COMMON_CONTROLS,
    DOM_PAUSE_CONTROL,
  ],
  scoring: [
    'You start with 500 points. Every move, every deal and every undo costs 1 point, and each completed run earns 100 points. The score never drops below zero.',
    'Your personal best is your highest score in a won game, kept separately for 1, 2 and 4 suits. Games you do not finish never set a best.',
    'The timer starts with your first move and stops while the game is paused. It is shown for interest and does not affect the score.',
    'Games played and won for each suit setting are counted in this browser and shown under the table.',
  ],
  difficultyTitle: 'One, two or four suits',
  difficulty: [
    '1 suit: all 104 cards are spades, so every run you build can move as one. A good place to learn, and most deals can be won.',
    '2 suits: spades and hearts. You have to keep the two suits apart to move long runs, which makes the game far more demanding.',
    '4 suits: two full standard decks. Runs of one suit are rare early on and many deals are very hard to win; expert patience territory.',
  ],
  tips: [
    {
      title: 'Empty columns are your most valuable resource',
      body: 'An empty column lets you take apart a mixed stack, park a run or reach a hidden card. Try to create one early and avoid filling it with something that could stay put.',
    },
    {
      title: 'Prefer same-suit moves',
      body: 'Placing a card on a higher card of its own suit builds a run that can move later. A different-suit placement is fine to free a card, but it locks those cards together.',
    },
    {
      title: 'Deal only when you are ready',
      body: 'Each deal drops a card on every column and can bury runs you were building. Make every useful move first, then deal.',
    },
    {
      title: 'Undo costs a point, not the game',
      body: 'Undo is worth using to test a line of play: one point is a small price compared with the 100 a completed run is worth.',
    },
  ],
  faq: [
    {
      q: 'Why can I not deal a new row?',
      a: 'Classic Spider rules do not allow a deal while any column is empty. Move a card or run into every empty column first. After five deals the stock is empty.',
    },
    {
      q: 'Why will only part of my stack move?',
      a: 'Only runs of a single suit move together. In a stack such as 9 of spades, 8 of hearts, 7 of hearts, only the 8 and 7 of hearts can be picked up as a group.',
    },
    {
      q: 'Does undo cost points?',
      a: 'Yes, 1 point each time, just like a move. That matches the scoring of the classic computer version of Spider.',
    },
    {
      q: 'Where is my best score kept?',
      a: 'In this browser’s local storage only, separately for each suit setting. There are no accounts or online leaderboards.',
    },
  ],
};
