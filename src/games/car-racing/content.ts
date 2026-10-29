import { CANVAS_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Car Racing Time Trial: Top-Down Lap Racer',
  metaDescription:
    'Race three laps of a neon circuit against the clock. Brake into corners, stay off the grass and beat a ghost of your best lap in this top-down time trial.',
  intro: [
    'Car Racing Time Trial is a top-down racer with one goal: the fastest three laps you can drive. The camera rides behind your car and turns with it, so the road ahead is always at the top of the screen, and a minimap in the corner shows the whole circuit.',
    'The car slides when you turn hard at speed, the grass slows you right down, and the barriers stop you dead. After your first lap a faint ghost car replays your best lap so far, so you can see exactly where you are gaining or losing time.',
  ],
  objective:
    'Complete three laps as quickly as possible. Your time runs from GO until you cross the line at the end of the third lap, and it only counts if every checkpoint around the lap was passed in order.',
  howToPlay: [
    'Press Start game. A 3-2-1 countdown runs before the clock starts; the car cannot move until GO.',
    'Accelerate with Up or W, brake with Down or S (keep holding it to reverse), and steer with Left/Right or A/D.',
    'On a touch screen, press and hold anywhere above the strip at the bottom to accelerate. The car steers toward your finger: the further from the middle, the sharper the turn. Slide your finger into the bottom strip to brake or reverse.',
    'Stay on the dark asphalt. On the green grass your top speed drops to about a third, and the violet barriers beyond it stop the car.',
    'A dashed cyan line marks the next checkpoint. Cross them all in order and then the start line to complete a lap. A WRONG WAY warning appears if you turn around.',
    'After three laps the race ends and your total time is compared with your best.',
  ],
  controls: [
    { action: 'Accelerate', keys: ['↑', 'W'], touch: 'Hold anywhere above the bottom strip' },
    { action: 'Brake / reverse', keys: ['↓', 'S'], touch: 'Hold inside the bottom strip' },
    { action: 'Steer', keys: ['←', '→', 'A', 'D'], touch: 'Move your finger left or right of the middle' },
    ...CANVAS_COMMON_CONTROLS,
  ],
  scoring: [
    'Your result is the total race time from GO to the end of lap 3, shown to the hundredth of a second. Lower is better.',
    'The HUD shows the lap you are on and your best lap of the current race.',
    'Only finished races are recorded. Your best time is saved in this browser only.',
    'A race still running after 10 minutes ends as did-not-finish and is not recorded.',
  ],
  difficultyTitle: 'Car and track',
  difficulty: [
    'There is one hand-built circuit with a long start straight, a tight hairpin, an S-bend and a looping left-hand section.',
    'Steering is quickest at medium speed. Flat out, the car turns more slowly and slides if you turn hard, so brake before the tight corners.',
    'Hitting a barrier head-on costs most of your speed; glancing blows cost less. Holding the accelerator lets you turn away from a barrier even from a standstill.',
  ],
  tips: [
    {
      title: 'Brake in a straight line',
      body: 'Slow down before you turn into a tight corner, then accelerate out of it. Braking while turning hard makes the car slide wide.',
    },
    {
      title: 'Use the whole road',
      body: 'Start a corner from the outside edge, clip the inside kerb and drift back out. The kerbs are part of the track and are not slow.',
    },
    {
      title: 'Chase the ghost',
      body: 'From lap 2 the ghost car shows your best lap. If it pulls away through a corner, try braking a little later or turning in earlier there.',
    },
    {
      title: 'On touch screens, keep your finger low',
      body: 'Hold your finger just above the brake strip. A small slide down brakes, and small moves left and right steer without covering the road ahead.',
    },
  ],
  faq: [
    {
      q: 'Why did my lap not count?',
      a: 'Every checkpoint must be crossed in order. If you turn around or miss part of the lap, drive back to the next checkpoint, which is marked by a dashed cyan line.',
    },
    {
      q: 'What is the faint second car?',
      a: 'It is a ghost replay of your best lap in the current race. It does not collide with you and is cleared when you start a new race.',
    },
    {
      q: 'Is my best time saved?',
      a: 'Yes, in this browser only, and only for races you finish. There are no accounts or online leaderboards.',
    },
    {
      q: 'Can I race on a phone?',
      a: 'Yes. Hold your finger on the screen to drive and move it sideways to steer; the strip at the bottom is the brake. Turning the phone sideways is not needed.',
    },
  ],
};
