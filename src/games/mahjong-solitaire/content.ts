import { DOM_COMMON_CONTROLS, DOM_PAUSE_CONTROL, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Mahjong Solitaire: Match Tiles on Three Layouts',
  metaDescription:
    'Clear a stack of mahjong tiles by matching free pairs. Three original layouts, deals that can always be won, plus hints, undo and shuffle when you are stuck.',
  intro: [
    'Mahjong Solitaire is a single-player tile-matching game played with a set of mahjong tiles stacked in layers. You remove the tiles two at a time by matching identical pairs, but only tiles that are free can be taken.',
    'Every deal is built backwards from an empty table, so there is always at least one way to clear the whole board. Choose the 144-tile Pyramid for a full game, or the 72-tile Garden and Bridge layouts for a quicker one.',
  ],
  objective: 'Remove every tile from the board by matching free tiles in pairs.',
  rules: [
    'A tile is free when no tile lies on top of it, even partly, and its left side or its right side has no tile next to it on the same layer.',
    'Select two free tiles that match to remove them. Identical tiles match; in addition, any Flower matches any other Flower and any Season matches any other Season.',
    'The full set has 144 tiles: Dots, Bamboo and Characters numbered 1 to 9, the four Winds and the three Dragons (four of each), plus four different Flowers and four different Seasons. The 72-tile layouts use two of each ordinary tile, two Flowers and two Seasons.',
    'If no free pair remains, you can shuffle: the remaining tiles are re-dealt into an arrangement that can still be cleared, and 30 seconds are added to your time. Shuffling clears the undo history.',
    'The game is won when the last pair is removed.',
  ],
  howToPlay: [
    'Look for free tiles. Tiles that cannot be taken yet are slightly darker.',
    'Click or tap a free tile to select it. Free tiles that match it get a dashed green outline.',
    'Click or tap a matching free tile to remove the pair. Selecting a non-matching free tile simply switches the selection.',
    'Use Undo to put the last pair back, or Hint to highlight a pair that can be removed now.',
    'If the game says no pairs are free, press Shuffle or undo a few moves and try a different order.',
    'With a keyboard, Tab and the arrow keys move between free tiles, and Enter or Space selects one.',
  ],
  controls: [
    { action: 'Move between free tiles', keys: ['Tab', '↑', '↓', '←', '→'], touch: '–' },
    { action: 'Select a tile', keys: ['Enter', 'Space'], touch: 'Tap the tile' },
    { action: 'Hint, Undo, Shuffle', keys: [], keysNote: 'Buttons above the board', touch: 'Buttons above the board' },
    { action: 'Change layout', keys: [], keysNote: 'Layout buttons', touch: 'Layout buttons above the board' },
    DOM_PAUSE_CONTROL,
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'Your result is the time taken to clear the board, plus 30 seconds for every shuffle. Paused time does not count.',
    'Hints and undo are free; the result screen shows how many hints and shuffles you used.',
    'Your fastest time is saved separately for each layout, in this browser only.',
  ],
  difficultyTitle: 'Layouts',
  difficulty: [
    'Pyramid (144 tiles): a 10x8 base with clipped corners, rising through three more floors to a 2x2 peak. The full classic tile set.',
    'Garden (72 tiles): a smaller three-floor stack for a game of a few minutes, using two of each ordinary tile.',
    'Bridge (72 tiles): two towers joined by a long deck. Posts at each end block the deck rows, and each tower is topped by a pennant tile.',
    'Every deal on every layout is generated so that it can be cleared, but a careless order of matches can still leave you stuck.',
  ],
  tips: [
    {
      title: 'Free the long rows first',
      body: 'Tiles in the middle of a long row stay blocked until one end is cleared. Work from the ends inward.',
    },
    {
      title: 'Uncover tall stacks early',
      body: 'Tiles under the peak can only be reached once the top is gone, so match the upper tiles when you can.',
    },
    {
      title: 'Think before matching the last pair of a kind',
      body: 'When three or four of the same tile are free, choose the pair whose removal frees the most other tiles.',
    },
    {
      title: 'Bonus tiles are flexible',
      body: 'Any two Flowers or any two Seasons match, so keep them for when you need to open up a blocked area.',
    },
  ],
  faq: [
    {
      q: 'Can every game be won?',
      a: 'Yes, every deal is generated in reverse from an empty table, so a full solution always exists. It is still possible to get stuck by matching in an unlucky order; Undo and Shuffle help.',
    },
    {
      q: 'What does Shuffle do?',
      a: 'It re-deals the tiles still on the board into an arrangement that can be cleared, usually in the same spots. In the rare case those spots cannot be cleared in any order (for example two tiles stacked on each other), the tiles are moved to the bottom layer. Each shuffle adds 30 seconds.',
    },
    {
      q: 'Where are my best times saved?',
      a: 'Only in this browser, one best time per layout. There are no accounts or global leaderboards, and clearing your site data removes them.',
    },
    {
      q: 'Why are some tiles darker?',
      a: 'Darker tiles are not free yet: something is on top of them or both of their sides are blocked. They become normal once you can take them.',
    },
  ],
};
