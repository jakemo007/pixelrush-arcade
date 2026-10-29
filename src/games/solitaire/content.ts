import { DOM_COMMON_CONTROLS, DOM_PAUSE_CONTROL, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Classic Solitaire (Klondike): Play Free Online',
  metaDescription:
    'Play classic Klondike solitaire free in your browser. Draw one or three cards, drag or tap to move, undo any move and let auto-complete finish a solved game.',
  intro: [
    'Classic Solitaire is Klondike, the patience game most people simply call solitaire. Twenty-eight cards are dealt into seven columns with only the top card of each showing, and the rest wait face down in the stock. Your job is to uncover every hidden card and sort the whole deck into four suits.',
    'Choose Draw 1 for a relaxed game that you can usually win with care, or Draw 3 for the tougher traditional version. Every move can be undone, and once all the cards are face up the game offers to finish itself.',
  ],
  objective:
    'Move all 52 cards to the four foundations, building each suit up from Ace to King. The game is won the moment the last King lands on its foundation.',
  rules: [
    'The deal: seven tableau columns hold 1 to 7 cards with only the top card face up. The other 24 cards form the face-down stock.',
    'Tableau columns build down in alternating colours: a red 6 goes on a black 7, a black Queen on a red King.',
    'You may move any face-up card together with all the cards on top of it, as long as they form a valid alternating, descending run.',
    'Only a King, or a run that starts with a King, can be moved into an empty column.',
    'When a face-down card is left on top of a column it is turned over automatically.',
    'Foundations build up by suit from the Ace. Any Ace can start any empty foundation. The top card of a foundation may be moved back onto the tableau if it fits there.',
    'Clicking the stock turns over one card (Draw 1) or three cards (Draw 3) onto the waste; only the top waste card can be played. When the stock runs out, click it again to turn the waste back over. There is no limit on passes in either mode.',
  ],
  howToPlay: [
    'Look for Aces and play them to the foundations first, then any 2 of the same suit.',
    'Pick up a card by clicking or tapping it (the cards on top of it lift with it), then click the column or foundation where it should go. You can also drag cards with the mouse or your finger.',
    'Valid destinations are outlined with a dashed line while cards are picked up. If a move is not allowed, the line under the table tells you why.',
    'Double-click or double-tap a top card to send it straight to its foundation.',
    'Click the stock to draw when you run out of moves on the table.',
    'Use Undo freely. When every card is face up and the stock and waste are empty, press Auto-complete to finish the game.',
  ],
  controls: [
    { action: 'Move between piles and cards', keys: ['←', '→', '↑', '↓'], touch: 'Not needed' },
    { action: 'Pick up a card and the cards on it', keys: ['Enter', 'Space'], touch: 'Tap the card' },
    { action: 'Place the cards you picked up', keys: ['Enter', 'Space'], touch: 'Tap the destination pile' },
    { action: 'Drag and drop', keys: [], keysNote: 'Drag with the mouse', touch: 'Drag the card with your finger' },
    { action: 'Send a card to its foundation', keys: ['F'], touch: 'Double-tap the card (double-click with a mouse)' },
    { action: 'Draw from the stock', keys: ['D'], touch: 'Tap the stock' },
    { action: 'Undo the last move', keys: ['U'], touch: 'Undo button' },
    { action: 'Put the cards back down', keys: ['Esc'], touch: 'Tap the same card again' },
    { action: 'Auto-complete (when offered)', keys: ['A'], touch: 'Auto-complete button' },
    ...DOM_COMMON_CONTROLS,
    DOM_PAUSE_CONTROL,
  ],
  scoring: [
    'Moves counts every card move, every draw from the stock and every time the waste is turned back over. Undoing a move takes it off the count again.',
    'The timer starts with your first move. Pausing hides the cards and stops the timer, and the game pauses itself if you switch to another tab.',
    'Your personal best is your fastest winning time, kept separately for Draw 1 and Draw 3. Unfinished games never set a best.',
    'Games played and games won for each mode are counted in this browser and shown under the table. A game counts as played from your first move.',
  ],
  difficultyTitle: 'Draw 1 or Draw 3',
  difficulty: [
    'Draw 1 turns over one card at a time, so every card in the stock is reachable on every pass. Most deals can be won with careful play.',
    'Draw 3 turns over three cards at a time and only the top one is playable, so many cards stay buried until a later pass. Fewer deals are winnable and planning matters much more.',
    'Deals are random shuffles, so some games cannot be won no matter how you play. Undo lets you explore, but it does not change the cards.',
  ],
  tips: [
    {
      title: 'Uncover hidden cards first',
      body: 'A move that turns over a face-down card is almost always better than one that only shuffles face-up cards around. Work on the longest hidden columns early.',
    },
    {
      title: 'Do not empty a column without a King to put there',
      body: 'Only Kings can fill an empty column. Clearing one is only useful when a King (ideally with a run under it) is ready to move in.',
    },
    {
      title: 'Hold back on the foundations',
      body: 'Low cards belong on the foundations straight away, but sending up a 5 or 6 too early can leave you with nowhere to park the 4 or 5 of the other colour.',
    },
    {
      title: 'Watch the colours of your Kings',
      body: 'When choosing which King goes into an empty column, check which Queens are waiting. A red King needs a black Queen, and the wrong choice can block a whole column.',
    },
  ],
  faq: [
    {
      q: 'Is every game winnable?',
      a: 'No. The cards are shuffled at random and some Klondike deals cannot be solved. Draw 1 gives you much better odds than Draw 3.',
    },
    {
      q: 'How many times can I go through the stock?',
      a: 'As many times as you like, in both modes. When the stock is empty, click it to turn the waste back over.',
    },
    {
      q: 'Where are my best times and statistics saved?',
      a: 'Only in this browser’s local storage, on this device. Nothing is uploaded, there are no accounts and there is no global leaderboard. Clearing site data removes them.',
    },
    {
      q: 'Can I play with only a keyboard?',
      a: 'Yes. Use the arrow keys to move between piles and cards, Enter or Space to pick up and place, D to draw, F to send a card to a foundation and U to undo.',
    },
  ],
};
