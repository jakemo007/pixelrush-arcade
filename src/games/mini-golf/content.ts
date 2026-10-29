import { CANVAS_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Mini Golf: Nine-Hole Putting Course Online',
  metaDescription:
    'Putt your way around nine neon mini golf holes with bank shots, sand, water, slopes, a windmill and a sliding gate. Finish the round in the fewest strokes.',
  intro: [
    'Mini Golf is a nine-hole putting course with real ball physics. Every hole is hand-built around a different idea: a dogleg that rewards a bank shot, a bunker in front of the cup, a pond to play around, a turning windmill, a ramp that bends your putt and a sliding gate you have to time.',
    'Aim by pulling back like a slingshot, or use the keyboard to set the angle and power precisely. Walls bounce the ball, sand slows it sharply and water costs a stroke.',
  ],
  objective:
    'Sink the ball on all nine holes in as few strokes as possible. The course is par 28; your result is the total number of strokes for the round.',
  howToPlay: [
    'Press Start game. The ball sits on the tee and the dotted arrow shows the direction of your putt.',
    'Drag back from anywhere on the course and let go to putt: the ball goes the opposite way to your drag, and a longer drag hits harder. The ring around the ball shows the power.',
    'With a keyboard, turn the arrow with Left and Right, set the power with Up and Down, then press Space or Enter.',
    'The ball must be rolling slowly to drop into the cup. A fast ball runs over the hole and keeps going.',
    'After each hole a scorecard shows your strokes against par. Tap or press Space to go straight to the next hole.',
  ],
  controls: [
    { action: 'Aim and set power', keys: ['←', '→', '↑', '↓'], touch: 'Drag back from anywhere on the course' },
    { action: 'Putt', keys: ['Space', 'Enter'], touch: 'Release the drag' },
    { action: 'Cancel a putt', keys: [], keysNote: 'Release close to where you pressed', touch: 'Slide back to where you started, then release' },
    { action: 'Next hole on the scorecard', keys: ['Space', 'Enter'], touch: 'Tap the course' },
    ...CANVAS_COMMON_CONTROLS,
  ],
  scoring: [
    'Each putt is one stroke. Your result is the total for all nine holes; lower is better.',
    'Water: one penalty stroke, and the ball returns to the spot you putted from.',
    'Stroke limit: if the ball is not in after 8 strokes (penalties included), the hole ends and counts as 10.',
    'Only completed rounds are recorded as a personal best, saved in this browser only.',
  ],
  difficultyTitle: 'The course',
  difficulty: [
    'Holes 1 to 4 (pars 2, 3, 3 and 3) introduce banks off straight and angled walls, a sand bunker with two bouncy bumpers, and a pond you must play around.',
    'Hole 5 has a turning windmill, hole 6 a ramp that pushes the ball sideways, and hole 7 is a par-4 zigzag between two inner walls.',
    'Hole 8 adds a gate that slides from side to side, and hole 9 (par 4) combines a pond, two bumpers and a slope that speeds the ball toward the cup.',
    'Moving obstacles keep moving while you aim, and a passing blade can nudge a resting ball without costing you a stroke.',
  ],
  tips: [
    {
      title: 'Bank it',
      body: 'Walls send the ball off at roughly the angle it arrives and keep most of its speed, so a bank shot is often the shortest way around a corner.',
    },
    {
      title: 'Putt to stop, not to slam',
      body: 'A ball that arrives too fast lips out. Aim to reach the cup with just enough speed to drop in.',
    },
    {
      title: 'Read the ramps',
      body: 'Violet arrows show which way a slope pushes the ball. Aim up-slope and give the putt a little extra pace.',
    },
    {
      title: 'Time the moving parts',
      body: 'Watch the windmill and the sliding gate for a cycle before you putt; they move at a steady speed, so the gaps are predictable.',
    },
  ],
  faq: [
    {
      q: 'Why did the ball roll over the hole?',
      a: 'It was moving too fast. The cup only catches a ball that is rolling slowly when it reaches the middle of the hole.',
    },
    {
      q: 'What happens if I keep missing?',
      a: 'After 8 strokes on a hole, including penalty strokes, the hole ends, counts as 10 strokes and you move on, so nobody gets stuck.',
    },
    {
      q: 'Is my best round saved?',
      a: 'Your lowest total for a completed round is saved in this browser only. There are no accounts or online leaderboards.',
    },
    {
      q: 'Can I play on a phone?',
      a: 'Yes. Put your finger anywhere on the course, pull back and let go. You do not need to touch the ball itself, so your finger never hides it.',
    },
  ],
};
