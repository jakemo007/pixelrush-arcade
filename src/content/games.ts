/**
 * Player-facing content for each game page. Every number here reflects the
 * actual game rules in src/games/ — update both together.
 */

import type { GameId } from '@/config/games';

export interface ControlRow {
  action: string;
  /** Key names, rendered as <kbd>. Empty means "not applicable". */
  keys: readonly string[];
  touch: string;
}

export interface GameContent {
  metaTitle: string;
  metaDescription: string;
  intro: readonly string[];
  objective: string;
  howToPlay: readonly string[];
  controls: readonly ControlRow[];
  scoring: readonly string[];
  difficulty: readonly string[];
  tips: readonly { title: string; body: string }[];
  faq: readonly { q: string; a: string }[];
}

const commonControls: readonly ControlRow[] = [
  { action: 'Pause / resume', keys: ['P', 'Esc'], touch: 'Pause button above the game' },
  { action: 'Play again after game over', keys: ['Enter', 'R'], touch: 'Play again button' },
  { action: 'Sound on / off', keys: [], touch: 'Sound button above the game' },
];

export const GAME_CONTENT: Record<GameId, GameContent> = {
  'neon-dash': {
    metaTitle: 'Neon Dash: Free Endless Runner Game',
    metaDescription:
      'Play Neon Dash free in your browser: a one-button endless runner. Jump spikes and pits, dodge drones and chase your best score on desktop or mobile.',
    intro: [
      'Neon Dash is a one-button endless runner set in a glowing synth city. Your runner sprints forward on its own; your only job is deciding exactly when to jump. It takes seconds to learn and a lot longer to master.',
      'Every run builds a new course ahead of you, so you cannot memorize it — you have to read it. The city speeds up the longer you survive, new hazards join in and the gaps between them tighten.',
    ],
    objective:
      'Travel as far as you can without hitting an obstacle or falling into a pit. Distance and the gold energy shards you collect both count toward your score.',
    howToPlay: [
      'Press Start game (or Space) to begin. Your runner starts moving immediately.',
      'Jump over pink spikes and violet blocks. A quick tap gives a short hop; holding the button gives a full-height jump.',
      'Jump across gaps in the floor. You still have a split second to jump after your runner leaves the edge.',
      'When an orange drone hovers ahead, stay on the ground and run underneath it. Jumping into a drone ends the run.',
      'Grab gold energy shards for bonus points, but never at the cost of a safe jump.',
      'After a crash, press Enter or Play again to start a fresh run straight away.',
    ],
    controls: [
      { action: 'Jump', keys: ['Space', 'W', '↑'], touch: 'Tap anywhere on the game' },
      { action: 'Higher jump', keys: ['Hold the jump key'], touch: 'Keep your finger down' },
      ...commonControls,
    ],
    scoring: [
      'Distance: 1 point for every 25 pixels traveled. That is about 15 points per second at the start, rising as you speed up.',
      'Energy shard: +20 points each.',
      'Your best score is saved in this browser only. Clearing your browser’s site data removes it.',
    ],
    difficulty: [
      'Speed increases smoothly from the first second until it reaches a fixed maximum a little over twice the starting speed, after just under two minutes.',
      'For roughly the first 15 to 20 seconds you only meet spikes and blocks. Then pits appear, and from about 40 seconds drones join in and the gaps tighten.',
      'Every course follows fairness rules: after each obstacle there is always room to land, react and jump again, and no pit is wider than a full jump can clear.',
    ],
    tips: [
      {
        title: 'Look ahead, not at your runner',
        body: 'Your runner never moves left or right on screen, so keep your eyes on the right-hand side of the game where the next hazards appear.',
      },
      {
        title: 'Use short hops for single spikes',
        body: 'A tap clears a single spike and lands sooner, leaving more time for whatever comes next. Save full jumps for blocks, pits and spike groups.',
      },
      {
        title: 'When in doubt, press slightly early',
        body: 'The game remembers a jump pressed just before you land and still accepts a jump for a moment after you run off a ledge.',
      },
      {
        title: 'Treat drones as “do nothing” moments',
        body: 'The hardest habit to break is jumping on reflex. When a drone is coming, keep your thumb still and let the runner pass underneath.',
      },
      {
        title: 'Shards are optional',
        body: 'A shard is worth 20 points, a little over a second of running at the starting speed. A crash costs the whole run.',
      },
    ],
    faq: [
      { q: 'Is Neon Dash free?', a: 'Yes. It runs in your browser with no download, account or payment.' },
      {
        q: 'Does it work on phones and tablets?',
        a: 'Yes. Tap anywhere on the game to jump and hold for a higher jump. On a phone held upright the game area is small; turning your phone sideways gives a much larger view.',
      },
      {
        q: 'Where is my high score saved?',
        a: 'Only in your browser’s local storage on this device. It is not uploaded and there is no global leaderboard. Private browsing or clearing site data removes it.',
      },
      {
        q: 'Why did the game pause by itself?',
        a: 'Neon Dash pauses automatically when you switch tabs, minimize the browser or move keyboard focus away from the game, so a distraction never costs you a run.',
      },
      {
        q: 'Is the course different every time?',
        a: 'Yes, in normal runs. On days when Neon Dash is the Daily Challenge, everyone gets the same course for that day.',
      },
    ],
  },

  'brick-breaker': {
    metaTitle: 'Brick Breaker: Free Classic Arcade Game',
    metaDescription:
      'Play Brick Breaker free online. Aim your paddle bounces, chain combos and clear eight hand-built levels with mouse, keyboard or touch controls.',
    intro: [
      'Brick Breaker is our take on the classic paddle-and-ball arcade game. Keep the ball in play, aim each rebound off your paddle and clear every breakable brick to move on to the next wall.',
      'There are eight hand-built levels, from a gentle warm-up to a steel-reinforced finale. The ball gets faster on each new level and tougher bricks need more than one hit.',
    ],
    objective:
      'Clear all eight levels before you run out of lives. A level is complete when every breakable brick is gone; grey steel bricks cannot be broken and do not need to be.',
    howToPlay: [
      'Move the paddle with your mouse, your finger or the arrow keys.',
      'Press Space or tap the game to launch the ball.',
      'Keep the ball from falling past your paddle. Where it hits the paddle sets the angle: the center sends it straight up, the edges send it off at a sharp angle.',
      'Break bricks to score. Cyan bricks break in one hit, violet in two and pink in three. Grey steel bricks never break.',
      'Catch falling capsules: W widens your paddle, S slows the ball and + gives you an extra life.',
      'Clear every breakable brick to advance. If you lose the ball with no lives left, the game ends.',
    ],
    controls: [
      { action: 'Move paddle', keys: ['←', '→', 'A', 'D'], touch: 'Drag anywhere on the game (or move the mouse over it)' },
      { action: 'Launch ball', keys: ['Space', '↑', 'W'], touch: 'Tap or click the game' },
      ...commonControls,
    ],
    scoring: [
      'Breaking a brick: 10 points for each hit it needed (10, 20 or 30).',
      'Combo bonus: each extra brick broken before the ball returns to your paddle adds 25% to that brick’s points, up to triple points.',
      'Damaging a tough brick without breaking it: +5 points.',
      'Clearing a level: 100 × the level number.',
      'Winning the game: +250 for every life you have left.',
    ],
    difficulty: [
      'The ball starts faster on every level and speeds up slightly each time it touches your paddle within a level.',
      'Later levels use tougher bricks and steel blocks that change the ball’s path.',
      'You start with 3 lives and can hold up to 5. Power-up effects end when you lose the ball.',
    ],
    tips: [
      {
        title: 'Aim with the paddle edges',
        body: 'Hitting the ball near an edge sends it off at up to 60° from vertical. Use that to reach corners instead of waiting for a lucky bounce.',
      },
      {
        title: 'Get the ball behind the wall',
        body: 'Open a gap and send the ball through it: it will bounce between the ceiling and the bricks, breaking several in a row and building a big combo.',
      },
      {
        title: 'Move to where the ball will land',
        body: 'Read the ball’s angle as it leaves the bricks and move early, then make small corrections, rather than chasing it at the last moment.',
      },
      {
        title: 'Chase capsules only when it is safe',
        body: 'A wider paddle makes the next 12 seconds easier, but no capsule is worth losing the ball for.',
      },
      {
        title: 'Use steel as a mirror',
        body: 'Steel bricks never break, but they bounce the ball predictably. Use them to redirect shots into hard-to-reach areas.',
      },
    ],
    faq: [
      { q: 'How many levels are there?', a: 'Eight. Clear the last one to win; every remaining life adds bonus points.' },
      { q: 'Can I play with a mouse?', a: 'Yes. The paddle follows your mouse while it is over the game. Click to launch the ball.' },
      {
        q: 'Why can’t I break the grey bricks?',
        a: 'They are steel. They exist to change the ball’s path, and you do not need to clear them to finish a level.',
      },
      { q: 'Where is my high score saved?', a: 'Only in this browser on this device. Nothing is uploaded and there are no accounts.' },
      { q: 'Does the game pause automatically?', a: 'Yes, whenever you switch tabs or move keyboard focus away from the game.' },
    ],
  },

  'space-survival': {
    metaTitle: 'Space Survival: Free Space Shooter Game',
    metaDescription:
      'Play Space Survival free in your browser. Your ship fires automatically, so focus on dodging drifters, chargers and gunships across faster waves.',
    intro: [
      'Space Survival is a vertical space shooter built around one idea: your cannons fire on their own, so all of your attention goes into flying. Weave through enemy formations, line up shots by positioning and stay alive as the waves speed up.',
      'The controls are the same on every device. Steer with the keyboard, or drag anywhere on the screen and the ship follows your finger’s movement without being hidden under it.',
    ],
    objective:
      'Survive as long as you can and destroy as many enemies as possible. Your hull can take three hits; the third one ends the run.',
    howToPlay: [
      'Press Start game. Your ship begins firing straight away.',
      'Fly with the arrow keys or WASD, or drag anywhere on the game. The ship copies your finger’s movement, so you can always see it.',
      'Line up beneath enemies to shoot them down, and avoid touching them.',
      'Watch for orange chargers: they stop, show a dashed line toward where you were, then dash along it. Move off the line.',
      'Red gunships fire pink energy orbs at you and take six hits, so keep moving while you wear them down.',
      'Collect green + pickups to repair your hull and yellow 2x pickups for ten seconds of twin cannons.',
    ],
    controls: [
      { action: 'Fly', keys: ['←', '→', '↑', '↓', 'W', 'A', 'S', 'D'], touch: 'Drag anywhere on the game' },
      { action: 'Fire', keys: ['Automatic'], touch: 'Automatic' },
      ...commonControls,
    ],
    scoring: [
      'Survival: 5 points for every second you stay alive.',
      'Drifter (pink diamond, 1 hit): 10 points.',
      'Weaver (violet hexagon, 2 hits): 25 points.',
      'Charger (orange triangle, 1 hit): 30 points.',
      'Gunship (red octagon, 6 hits): 100 points.',
    ],
    difficulty: [
      'A new wave begins every 30 seconds. Enemies arrive more often and fly faster as time goes on, up to fixed limits.',
      'Weavers appear after 25 seconds, chargers after 50 and gunships after 80.',
      'After a hit your ship blinks and is invulnerable for about a second and a half, giving you time to recover.',
    ],
    tips: [
      {
        title: 'Live in the lower middle',
        body: 'Keeping your ship low and central gives you the most room to dodge in every direction while your shots still travel the full screen.',
      },
      {
        title: 'Step off the dashed line early',
        body: 'A charger commits to its path when the line appears. A small, early sidestep is safer than a big, late one.',
      },
      {
        title: 'Get under gunships, then keep moving',
        body: 'Your shots only travel straight up, so stay below a gunship to damage it, and strafe so its aimed orbs miss.',
      },
      {
        title: 'Small drags on touch screens',
        body: 'The ship copies your finger’s movement one-to-one. Short, smooth drags are more precise than big swipes.',
      },
      {
        title: 'Grab pickups after the danger passes',
        body: 'Pickups drift down slowly, so there is usually time to collect them once a threat has gone by.',
      },
    ],
    faq: [
      { q: 'Do I need to press a button to shoot?', a: 'No. The ship fires automatically whenever the game is running, on every device.' },
      { q: 'Does it work on mobile?', a: 'Yes. Drag anywhere on the game to steer; your finger does not need to be on the ship.' },
      {
        q: 'Is the game violent?',
        a: 'No. Every ship is a simple geometric shape that bursts into sparks. There are no characters, blood or gore.',
      },
      { q: 'Where is my score saved?', a: 'Only in this browser. Nothing is uploaded and there are no accounts.' },
      { q: 'Why does my ship blink?', a: 'After a hit it is invulnerable for about a second and a half. Use that time to fly somewhere safe.' },
    ],
  },
};
