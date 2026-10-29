import { CANVAS_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Basketball Shot Challenge: 60-Second Hoops Game',
  metaDescription:
    'Sink as many baskets as you can in 60 seconds. Aim each arc, chase swishes for bonus points and time, and build streaks as the shooting spot moves out.',
  intro: [
    'Basketball Shot Challenge is a one-minute shooting contest with real ball physics. The ball flies in a true arc, bounces off the rim and backboard, and only counts when it drops down through the hoop.',
    'Every basket moves you to a new shooting spot, starting close to the hoop and working out toward the 3-point line. Clean swishes and long streaks are where the big scores come from.',
  ],
  objective:
    'Score as many points as possible before the 60-second clock runs out. Any score above zero completes the challenge, and your best score is kept in this browser.',
  howToPlay: [
    'Press Start game. The clock starts straight away.',
    'Drag back from anywhere on the court and let go to shoot: the ball flies the opposite way to your drag, and a longer drag shoots harder. The meter on the left shows the power and the angle.',
    'With a keyboard, use Left and Right to change the angle, Up and Down to set the power, and Space or Enter to shoot.',
    'The dotted line shows only the start of the arc, so you still have to judge the distance yourself.',
    'After a basket the shooter moves to a new spot. After a miss you shoot again from the same spot.',
    'When the clock reaches zero the game ends, but a ball already in the air still counts if it goes in.',
  ],
  controls: [
    { action: 'Aim (angle)', keys: ['←', '→', 'A', 'D'], touch: 'Drag back from anywhere on the court' },
    { action: 'Power', keys: ['↑', '↓', 'W', 'S'], touch: 'Drag further for more power' },
    { action: 'Shoot', keys: ['Space', 'Enter'], touch: 'Release the drag' },
    ...CANVAS_COMMON_CONTROLS,
  ],
  scoring: [
    'Basket: 2 points, or 3 points from a spot beyond the 3-point line (the spot is marked 3 PT).',
    'Swish (no rim or backboard contact): +1 point and +2 seconds on the clock.',
    'Streak: baskets 4 to 6 in a row score double and baskets from the 7th in a row score triple. A miss resets the streak. The HUD shows the multiplier your next basket will get.',
    'A basket counts once per shot, and only when the ball drops down through the hoop.',
    'Your best score is saved in this browser only.',
  ],
  difficultyTitle: 'How the spot moves',
  difficulty: [
    'Your first three baskets are shot from close to the hoop.',
    'Baskets 4 to 6 come from mid-range, and from the 7th basket the spot can be beyond the 3-point line.',
    'From the 10th basket every spot is long range, and most of them are worth 3 points.',
    'Spots are chosen at random for each game, so no two games play out the same way.',
  ],
  tips: [
    {
      title: 'Use a high arc',
      body: 'A ball that drops steeply into the hoop has the most room to go in. Flat shots from close range tend to clip the front of the rim.',
    },
    {
      title: 'Change one thing at a time',
      body: 'After a miss you shoot from the same spot. Keep the angle and adjust only the power, and you will home in quickly.',
    },
    {
      title: 'Swishes buy time',
      body: 'Each swish adds 2 seconds, so a clean shooter gets more shots than the clock suggests.',
    },
    {
      title: 'Protect the streak',
      body: 'From the 4th basket in a row every make is doubled. When a new spot looks tricky, take an extra moment to line it up.',
    },
  ],
  faq: [
    {
      q: 'Why did a shot that went through the net not count?',
      a: 'A basket only counts when the ball drops down through the hoop from above. A ball that bounces up through it from below never counts.',
    },
    {
      q: 'Does a shot at the buzzer count?',
      a: 'Yes. If you release before the clock reaches zero, the game waits for the ball to land and counts the basket if it goes in.',
    },
    {
      q: 'Is my high score saved?',
      a: 'Yes, in this browser only. There are no accounts or online leaderboards.',
    },
    {
      q: 'Can I play on a phone?',
      a: 'Yes. Put your finger anywhere on the court, pull back and let go. Your finger never has to cover the ball.',
    },
  ],
};
