export interface ControlRow {
  action: string;
  keys: readonly string[];
  keysNote?: string;
  touch: string;
}

export interface GameContent {
  metaTitle: string;
  metaDescription: string;
  intro: readonly string[];
  objective: string;
  rules?: readonly string[];
  howToPlay: readonly string[];
  controls: readonly ControlRow[];
  scoring: readonly string[];
  difficultyTitle?: string;
  difficulty: readonly string[];
  tips: readonly { title: string; body: string }[];
  faq: readonly { q: string; a: string }[];
}

export const CANVAS_COMMON_CONTROLS: readonly ControlRow[] = [
  { action: 'Pause / resume', keys: ['P', 'Esc'], touch: 'Pause button above the game' },
  { action: 'Play again after game over', keys: ['Enter', 'R'], touch: 'Play again button' },
  { action: 'Sound on / off', keys: [], keysNote: 'Sound button', touch: 'Sound button above the game' },
];

export const DOM_COMMON_CONTROLS: readonly ControlRow[] = [
  { action: 'Start a new game', keys: [], keysNote: 'New game button', touch: 'New game button above the game' },
  { action: 'Sound on / off', keys: [], keysNote: 'Sound button', touch: 'Sound button above the game' },
];

export const DOM_PAUSE_CONTROL: ControlRow = {
  action: 'Pause / resume the timer',
  keys: [],
  keysNote: 'Pause button',
  touch: 'Pause button above the game',
};
