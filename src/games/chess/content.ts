import { DOM_COMMON_CONTROLS, type GameContent } from '@/content/types';

export const content: GameContent = {
  metaTitle: 'Chess vs Computer: Free Online Chess, Three Levels',
  metaDescription:
    'Play a full game of chess against the computer in your browser. Pick Easy, Medium or Hard, play White or Black, take back moves and follow every move in SAN.',
  intro: [
    'Chess vs Computer is a complete game of chess against a computer opponent written for this site. Every rule is enforced, including castling, en passant, promotion, check and all the ways a game can be drawn.',
    'Pick a level that suits you, choose whether to play White or Black, and take back a move whenever you want to try something else. The computer thinks in the background, so the page stays responsive while it decides.',
  ],
  objective:
    'Checkmate the computer’s king: put it in check so that no legal move gets it out. A game can also end in a draw.',
  rules: [
    'Standard FIDE rules of play. Legal moves and every game result are checked by the open-source chess.js library.',
    'Castling, en passant captures and pawn promotion are all available. When a pawn reaches the last rank you choose a queen, rook, bishop or knight.',
    'You may never make a move that leaves your own king in check.',
    'Checkmate wins the game. Stalemate (no legal move while not in check) is a draw.',
    'The game is also drawn by threefold repetition of the same position, by the fifty-move rule (fifty moves each without a capture or pawn move), and when neither side has enough material to checkmate.',
    'There is no clock: take as long as you like over each move.',
  ],
  howToPlay: [
    'Pick Easy, Medium or Hard above the board, and choose Play as White or Black beside it. White always moves first; if you play Black the computer opens.',
    'Click or tap one of your pieces to see its legal moves: a dot marks an empty square and a ring marks a capture. Then click the square you want. You can also drag the piece.',
    'The last move is highlighted, and a king in check glows red.',
    'Use Take back to undo your last move and the computer’s reply. Resign ends the game as a loss.',
    'Every move appears in the move list in standard algebraic notation (SAN), and captured pieces are shown with the material balance.',
  ],
  controls: [
    { action: 'Move between squares', keys: ['←', '→', '↑', '↓'], touch: 'Not needed' },
    { action: 'Pick up a piece, then choose its square', keys: ['Enter', 'Space'], touch: 'Tap the piece, then a highlighted square' },
    { action: 'Drag a piece', keys: [], keysNote: 'Drag with the mouse', touch: 'Drag the piece with your finger' },
    { action: 'Cancel the selection or the promotion choice', keys: ['Esc'], touch: 'Tap the piece again, or Cancel' },
    { action: 'Take back your last move', keys: [], keysNote: 'Take back button', touch: 'Take back button' },
    { action: 'Resign', keys: [], keysNote: 'Resign button', touch: 'Resign button' },
    ...DOM_COMMON_CONTROLS,
  ],
  scoring: [
    'There is no score or personal best: each game is a win, a loss or a draw, and the result screen says how it ended (for example "Checkmate in 31 moves").',
    'Your wins, losses and draws are counted separately for each level, saved only in this browser and shown beside the board.',
  ],
  difficultyTitle: 'How strong is the computer?',
  difficulty: [
    'The engine is an amateur-level program, not a grandmaster. It searches with alpha-beta, tries captures of valuable pieces first, keeps searching captures until the position is quiet, and judges positions by material and piece placement.',
    'Easy looks one move ahead plus any capture sequences, then picks at random among the moves it rates within about a pawn of its best. It rarely leaves a piece hanging, but it misses forks and short combinations.',
    'Medium searches four half-moves ahead plus captures (well under a second), so it spots most two-move tactics.',
    'Hard keeps searching deeper for up to two and a half seconds, usually 5 to 9 half-moves ahead. It is a tough opponent for casual players, but an experienced club player should be able to beat it.',
  ],
  tips: [
    {
      title: 'Develop before you attack',
      body: 'Bring your knights and bishops out, castle and connect your rooks before launching an attack. Moving the same piece repeatedly in the opening gives the computer time.',
    },
    {
      title: 'Check every capture and check',
      body: 'Before each move, look at every check, capture and threat your opponent could reply with. That habit alone avoids most lost pieces.',
    },
    {
      title: 'Use Take back to learn',
      body: 'If a move goes badly, take it back and look for what you missed. On Easy and Medium this is a good way to practise tactics.',
    },
    {
      title: 'Trade down when you are ahead',
      body: 'With extra material, exchanging pieces makes your advantage easier to convert. The computer will try to do the same when it is ahead.',
    },
  ],
  faq: [
    {
      q: 'Can I play as Black?',
      a: 'Yes. Choose Black under Play as. If you have not made a move yet the new side applies at once; otherwise it applies from your next game.',
    },
    {
      q: 'Is the computer a famous chess engine?',
      a: 'No. It is a small engine written for this site. It plays sensibly but is far weaker than professional engines and strong human players.',
    },
    {
      q: 'Why was my game declared a draw?',
      a: 'The game ends in a draw on stalemate, threefold repetition, the fifty-move rule or insufficient material. The result screen names the reason.',
    },
    {
      q: 'Are my results saved?',
      a: 'Your win, loss and draw record for each level is saved in this browser only. There are no accounts or online ratings.',
    },
  ],
};
