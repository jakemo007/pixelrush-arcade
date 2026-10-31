import { DOM_COMMON_CONTROLS, DOM_PAUSE_CONTROL, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Memory Card Match: Free Pairs Memory Game',
  metaDescription:
    'Turn over two cards at a time and find every matching pair in as few moves as possible. A free memory game with 4x4 and 6x6 boards for all ages.',
  intro: [
    'Memory Card Match is the classic pairs game. All the cards start face down. Each turn you flip two of them: if they show the same symbol they stay face up, and if not they turn back over, so you have to remember where you saw each one.',
    'Every symbol is a different shape as well as a different colour (a star, a heart, a key and so on), so the cards are easy to tell apart for everyone. Play the 16-card board for a quick game or the 36-card board for a real test of memory.',
  ],
  objective: 'Find every matching pair using as few moves as you can. One move is turning over two cards.',
  rules: [
    'The 4 x 4 board has 16 cards (8 pairs); the 6 x 6 board has 36 cards (18 pairs). Each symbol appears on exactly two cards, and the cards are shuffled for every game.',
    'Turn over one card, then a second. Turning over the second card completes a move.',
    'If the two cards match, they stay face up and are marked with a check.',
    'If they do not match, they are marked with a cross and turn face down again after about one second. You can also turn over another card straight away, which turns the pair back immediately.',
    'The game ends when every pair has been found.',
  ],
  howToPlay: [
    'Choose the 4 x 4 or 6 x 6 board.',
    'Tap or click any card to turn it over, then pick a second card to try to find its pair. With a keyboard, move between cards with the arrow keys and press Enter or Space to flip.',
    'Watch both cards carefully, even when they do not match: knowing where a symbol is helps you later.',
    'Keep going until all the pairs are face up. The timer starts with your first card and stops when the last pair is found.',
  ],
  controls: [
    { action: 'Flip a card', keys: ['Enter', 'Space'], touch: 'Tap or click the card' },
    { action: 'Move between cards', keys: ['↑', '↓', '←', '→'], touch: 'Tap the card you want' },
    DOM_PAUSE_CONTROL,
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'Your result is the number of moves (pairs of cards turned over) it took to find every pair. Fewer is better.',
    'A perfect game takes exactly one move per pair: 8 moves on 4 x 4 or 18 on 6 x 6. That needs some luck, so most games take a lot more.',
    'Your time is shown as well, but the personal best is the fewest moves, kept separately for each board size in this browser.',
  ],
  difficultyTitle: 'Board sizes',
  difficulty: [
    '4 x 4: 16 cards, 8 pairs. A quick game, good for younger players or a short break.',
    '6 x 6: 36 cards, 18 pairs. There is much more to remember, so expect to need well over one move per pair.',
    'Each game picks its symbols from a set of 18 and shuffles the cards, so no two games are laid out the same.',
  ],
  tips: [
    {
      title: 'Flip a known card second',
      body: 'When you turn over a new card whose match you have already seen, you can complete the pair straight away. Always start a move with an unknown card and use your memory for the second one.',
    },
    {
      title: 'Work in a pattern',
      body: 'Turning cards over row by row makes positions easier to remember than jumping around the board.',
    },
    {
      title: 'Say it in your head',
      body: 'Naming what you see, like “star top left, key second row”, helps the positions stick.',
    },
    {
      title: 'Pause when you need to',
      body: 'Pausing hides the cards and stops the timer, so you can take a break without losing your game. You cannot study the board while paused.',
    },
  ],
  faq: [
    {
      q: 'What counts as a move?',
      a: 'Turning over two cards is one move, whether they match or not. Turning over a single card is not a move until you pick its partner.',
    },
    {
      q: 'Can I tell the cards apart without seeing colours?',
      a: 'Yes. Every symbol has its own shape, and screen readers announce each card by name, such as “yellow star” or “teal key”.',
    },
    {
      q: 'Is the layout the same every time?',
      a: 'No. Every new game picks symbols and shuffles the cards again.',
    },
    {
      q: 'Where are my best results saved?',
      a: 'Your fewest moves for each board size are saved in this browser only. There are no accounts or global leaderboards, and clearing site data removes them.',
    },
  ],
};
