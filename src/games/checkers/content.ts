import { DOM_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Checkers: Play Free vs the Computer or a Friend',
  metaDescription:
    'Play American checkers in your browser against a thinking computer opponent or a friend on the same device. Forced captures, multi-jumps and kings included.',
  intro: [
    'Checkers, also called English draughts, is played on the dark squares of an 8×8 board. Each side starts with twelve men that move diagonally forward, jump enemy pieces and become kings on the far row.',
    'Play against the computer, which searches several moves ahead before each turn, or pass the device back and forth for a two-player game.',
  ],
  objective: 'Capture all of your opponent’s pieces, or leave them with no legal move on their turn.',
  rules: [
    'Red moves first and starts at the bottom of the board; White starts at the top. Against the computer you always play Red.',
    'Men move one square diagonally forward onto an empty dark square. Kings move one square diagonally in any direction.',
    'A capture is a jump over an adjacent enemy piece onto the empty square right behind it. Men capture forward only; kings capture in any direction.',
    'Captures are compulsory. If any of your pieces can jump, you must make a jump that turn.',
    'If the jumping piece can jump again from where it lands, it must keep jumping. When several capture routes exist you may choose any of them; you do not have to take the longest.',
    'A man that reaches the far row is crowned a king, and its move ends there, even if it could otherwise keep jumping.',
    'You lose when you have no pieces left or no legal move on your turn.',
    'The game is drawn if 40 moves pass on each side (80 turns in a row) with no capture and no man moving, which happens when only kings are shuffling around.',
  ],
  howToPlay: [
    'Choose Vs computer or Two players above the board.',
    'Click or tap one of your pieces. Its legal moves are marked: a dot for a step, a ring for a jump.',
    'If a capture is available, the pieces that can capture are outlined with a dashed ring and only they can move.',
    'Click a marked square to move. For a multi-jump, click each landing square in turn; the jumped pieces fade with a cross until the move is complete.',
    'Against the computer, wait while it thinks; its move is described under the turn indicator and highlighted on the board.',
    'Take back undoes your last move and the computer’s reply (in two-player mode, Undo move takes back one turn).',
  ],
  controls: [
    { action: 'Move between squares', keys: ['←', '→', '↑', '↓'], touch: 'Not needed' },
    { action: 'Select a piece, then a destination', keys: ['Enter', 'Space'], touch: 'Tap the piece, then the marked square' },
    { action: 'Continue a multi-jump', keys: ['Enter', 'Space'], touch: 'Tap each landing square in turn' },
    { action: 'Cancel the selection or a half-finished jump', keys: ['Esc'], touch: 'Cancel button' },
    { action: 'Take back a move', keys: [], keysNote: 'Take back button', touch: 'Take back button' },
    { action: 'Resign (vs computer)', keys: [], keysNote: 'Resign button', touch: 'Resign button' },
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'There is no score or personal best: a game ends in a win, a loss or a draw.',
    'Your wins, losses and draws against the computer are counted in this browser and shown beside the board. Two-player games are not recorded.',
  ],
  difficultyTitle: 'About the computer opponent',
  difficulty: [
    'The computer uses an alpha-beta search for about 0.7 seconds per move, which usually lets it look 9 to 11 turns ahead, and always follows a capture sequence to the end before judging a position.',
    'It judges positions by material (a king is worth about one and a half men), how far its men have advanced, keeping its back row guarded early, central squares and, in the endgame, bringing its kings toward yours.',
    'It plays a solid tactical game and punishes loose pieces, but it has no opening book or endgame database, so strong players can outplan it.',
  ],
  tips: [
    {
      title: 'Keep your back row as long as you can',
      body: 'Men on your own back row stop the opponent from crowning. Moving them out early gives the other side an easy path to a king.',
    },
    {
      title: 'Use forced captures against your opponent',
      body: 'Because jumps are compulsory, you can offer a piece to drag an enemy piece where you want it, then win two in return.',
    },
    {
      title: 'Control the centre',
      body: 'Pieces in the middle of the board have more moves and support each other. Pieces on the edges can only go one way.',
    },
    {
      title: 'Trade when you are ahead',
      body: 'Each even exchange makes a material lead count for more. When you are behind, avoid trades and keep pieces together.',
    },
  ],
  faq: [
    {
      q: 'Do I have to capture?',
      a: 'Yes. If any jump is available you must take one, and a piece that can keep jumping must continue. You may choose which capture to make.',
    },
    {
      q: 'Why did my piece stop jumping after it became a king?',
      a: 'In these rules, reaching the far row ends the move. The new king can jump on your next turn.',
    },
    {
      q: 'How strong is the computer?',
      a: 'It is a reasonably strong casual opponent that looks many moves ahead, but it has no opening book or endgame tables and is not a world-class program.',
    },
    {
      q: 'Are my results saved?',
      a: 'Your record against the computer is saved only in this browser. There are no accounts or online rankings.',
    },
  ],
};
