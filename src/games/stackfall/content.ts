import { CANVAS_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Stackfall: Free Falling-Block Puzzle Game Online',
  metaDescription:
    'Drop, turn and slide seven block shapes to complete rows on a 10 by 20 board. Free in your browser, with a hold slot, ghost piece and touch controls.',
  intro: [
    'Stackfall is a falling-block puzzle. Seven shapes, each made of four squares, drop one at a time into a tall 10 by 20 board. You slide and turn each one so it settles without gaps, and every complete row disappears to give you room.',
    'The pace is gentle at first and speeds up as you clear rows. Stackfall shows the next three pieces, lets you put one piece aside in a hold slot and draws an outline where the current piece will land, so you can plan a few moves ahead.',
  ],
  objective:
    'Score as many points as you can before the stack reaches the top. There is no winning screen: the run ends when a new piece no longer fits at the top of the board.',
  howToPlay: [
    'Press Start game, Space or Enter to begin. The first piece appears at the top centre and starts to fall.',
    'Move the piece left or right and turn it so its shape fits the stack. A faint outline shows exactly where it will land.',
    'Let it fall, press the down key to speed it up, or press Space to drop it at once.',
    'Fill every square across a row to clear it. The rows above fall down to fill the space. Clearing several rows with one piece scores much more.',
    'Press C or Shift to swap the current piece with the one in the Hold box. You can hold once per piece; the hold unlocks again after the next piece lands.',
    'The game ends when a new piece appears on top of existing blocks. Press Enter, R or Play again for a new run.',
  ],
  controls: [
    { action: 'Move left / right', keys: ['←', '→', 'A', 'D'], touch: 'Drag left or right: one column for each block width you drag' },
    { action: 'Soft drop (fall faster)', keys: ['↓', 'S'], touch: 'Drag down about 50 px and keep your finger on the game' },
    { action: 'Turn clockwise', keys: ['↑', 'W', 'X'], touch: 'Tap the game' },
    { action: 'Turn counter-clockwise', keys: ['Z'], touch: 'Not available on touch screens' },
    { action: 'Hard drop (land at once)', keys: ['Space'], touch: 'Flick quickly downwards' },
    { action: 'Hold / swap piece', keys: ['C', 'Shift'], touch: 'Tap the Hold box' },
    { action: 'Start a run', keys: ['Space', 'Enter'], touch: 'Start game button' },
    ...CANVAS_COMMON_CONTROLS,
  ],
  scoring: [
    'Clearing rows scores 100 for one row, 300 for two, 500 for three and 800 for four at once, each multiplied by your current level.',
    'Each square a piece moves during a soft drop adds 1 point. Each square it moves during a hard drop adds 2 points.',
    'The HUD shows your score, your best, the current level and the total rows cleared.',
    'Your best score is saved in this browser only. Clearing your browser’s site data removes it.',
  ],
  difficultyTitle: 'Levels and speed',
  difficulty: [
    'You start at level 1. Every 10 rows cleared raises the level by one, up to level 15.',
    'At level 1 a piece falls one row every second. That drops to about 0.36 seconds per row at level 5 and about 0.06 seconds at level 10.',
    'The speed stops increasing at level 13, where a piece falls one row every 0.02 seconds. After that, the only thing that grows is how little time you have to think.',
    'A piece that touches the stack does not lock for half a second, and moving or turning it resets that timer up to 15 times. The delay gives you time to slide a piece into a gap, but it does not let you stall forever.',
  ],
  tips: [
    {
      title: 'Keep the surface flat',
      body: 'Try to place each piece so the top of the stack stays level. Deep one-square wells and overhangs are what end most runs.',
    },
    {
      title: 'Leave one column open for the long piece',
      body: 'Stack up to four rows with a single empty column on one side. When the straight four-square piece arrives, dropping it in clears all four rows at once for 800 points times your level.',
    },
    {
      title: 'Use the hold slot to rescue a bad piece',
      body: 'If the current piece does not fit anywhere sensible, hold it and play the next one. Hold the long straight piece when you are not ready for it.',
    },
    {
      title: 'Read the next-piece list',
      body: 'The three pieces in the Next panel tell you what you will have in a few seconds. Plan where the next two will go before you place the current one.',
    },
    {
      title: 'Slide pieces under the lock delay',
      body: 'A piece has half a second after it touches down, so you can still nudge it sideways into a gap. Turn it first, then slide, rather than dropping it and hoping.',
    },
  ],
  faq: [
    {
      q: 'Which shapes are in the game?',
      a: 'Seven shapes of four squares each: a straight line, a square, a T, two zigzags (S and Z) and two L shapes (J and L). They arrive in a shuffled bag, so you see every shape once in each set of seven.',
    },
    {
      q: 'Can I rotate the square piece?',
      a: 'The square looks the same in every direction, so turning it does nothing.',
    },
    {
      q: 'What if a turn would push a piece into the wall or the stack?',
      a: 'Stackfall tries nudging the piece one or two columns sideways, or one row up, so it can still turn near a wall. If none of those positions are free, the turn is ignored.',
    },
    {
      q: 'Does it work on a phone?',
      a: 'Yes. Drag to move, tap to turn, flick downwards to drop and tap the Hold box to hold. Keyboard play is a little more precise, because touch controls cannot turn counter-clockwise.',
    },
    {
      q: 'Where is my score saved?',
      a: 'Only in this browser. Nothing is uploaded, and there are no accounts or global leaderboards.',
    },
  ],
};
