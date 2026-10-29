import { CANVAS_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Match-3 Puzzle: Swap Gems and Chain Cascades',
  metaDescription:
    'Swap neighbouring gems to line up three or more, then watch cascades multiply your points. Reach each target score in 25 moves in this free gem puzzle.',
  intro: [
    'Match-3 Puzzle is a classic gem-swapping game on an 8 by 8 board. Swap two neighbouring gems to line up three or more of the same kind; they clear, the gems above fall into the gaps and new gems drop in from the top.',
    'Every gem type has its own shape as well as its own colour: cyan circles, pink diamonds, yellow stars, green triangles, violet squares and orange hexagons. When falling gems form new lines by themselves, you get a cascade, and each step of a cascade is worth more than the last.',
  ],
  objective:
    'Reach the level’s target score within 25 moves. Hitting the target takes you straight to the next level with a fresh set of moves; running out of moves first ends the game.',
  howToPlay: [
    'Press Start game. The target for the level and your remaining moves are shown above the board.',
    'Swap two gems that sit side by side or one above the other. Swipe a gem toward its neighbour, or tap one gem and then the other.',
    'A swap only counts if it lines up three or more matching gems. Otherwise the gems slide back and you keep the move.',
    'Matched gems clear, gems above fall down and new gems fill the board. Lines formed by falling gems clear automatically as cascades.',
    'Stuck? After a few seconds without a move, a possible swap is outlined in yellow. If the board has no moves at all, it is shuffled for you.',
  ],
  controls: [
    { action: 'Swap gems', keys: [], keysNote: 'Swipe or drag with the mouse', touch: 'Swipe a gem toward a neighbour' },
    { action: 'Select, then swap', keys: [], keysNote: 'Click two neighbouring gems', touch: 'Tap one gem, then a neighbour' },
    { action: 'Move the cursor', keys: ['←', '→', '↑', '↓'], touch: 'Not needed' },
    { action: 'Select the gem under the cursor', keys: ['Space', 'Enter'], touch: 'Not needed' },
    { action: 'Swap the selected gem', keys: ['Arrow key toward the neighbour'], touch: 'Not needed' },
    ...CANVAS_COMMON_CONTROLS,
  ],
  scoring: [
    'Each cleared gem: 10 points.',
    'A line of 4 adds 20 points and a line of 5 or more adds 50. An L or T shape scores both of its lines, but each gem counts once.',
    'Cascades multiply everything: the swap’s own match scores ×1, the first cascade ×2, the second ×3 and so on.',
    'Reaching the target early: 30 bonus points for every move you have left.',
    'Your total score carries across levels, and your best is saved only in this browser.',
  ],
  difficultyTitle: 'Levels',
  difficulty: [
    'Level 1 asks for 1,000 points in 25 moves. Each level after that asks for 250 more (1,250, then 1,500 and so on), always with 25 moves.',
    'Only points scored during a level count toward its target; the bonus for unused moves goes to your total score.',
    'New boards and new gems never arrive already matched, and the board always has at least one possible swap.',
  ],
  tips: [
    {
      title: 'Work from the bottom',
      body: 'Matches low on the board move more gems, so they are far more likely to set off cascades than matches near the top.',
    },
    {
      title: 'Look for fours and fives',
      body: 'A line of four is worth 60 points before multipliers, and a line of five 100. They are worth a moment’s search before you take an easy three.',
    },
    {
      title: 'Use the shapes',
      body: 'Scanning for one shape at a time, such as all the stars, is often faster than scanning for colours.',
    },
    {
      title: 'Count your moves near the end',
      body: 'When the target is close, a guaranteed three now can be worth more than a bigger match that takes two moves to set up.',
    },
  ],
  faq: [
    {
      q: 'Why did my swap slide back?',
      a: 'Swaps only count when they line up at least three matching gems. A swap that does not is undone and does not cost a move.',
    },
    {
      q: 'Can I play with the keyboard?',
      a: 'Yes. Use the arrow keys to move the cursor, press Space or Enter to pick up a gem, then press an arrow to swap it in that direction.',
    },
    {
      q: 'What happens if there are no moves left on the board?',
      a: 'The game tells you and shuffles the gems already on the board into a new arrangement that has at least one possible swap.',
    },
    {
      q: 'Is my score saved?',
      a: 'Your best score is saved only in this browser on this device. There are no accounts or online leaderboards.',
    },
  ],
};
