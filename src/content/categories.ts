import type { GameCategory } from '@/config/games';

export interface CategoryContent {
  heading: string;
  metaTitle: string;
  metaDescription: string;
  blurb: string;
  intro: readonly string[];
}

export const CATEGORY_CONTENT: Record<GameCategory, CategoryContent> = {
  arcade: {
    heading: 'Arcade Games',
    metaTitle: 'Free Arcade Games to Play in Your Browser',
    metaDescription:
      'Free arcade games that start in a second: an endless runner, a brick breaker, a space shooter, Snake and more. Play with a keyboard, mouse or touch screen.',
    blurb: 'Quick runs, fast reflexes and high scores.',
    intro: [
      'Arcade games are built for short, intense runs. You learn the controls in a few seconds, then spend the rest of the time chasing a higher score. Every game here starts with one click or tap and plays with a keyboard, mouse or touch screen.',
      'Your best score for each game is saved in this browser, so the only record you are up against is your own. The three original arcade games also take turns in the Daily Challenge, which sets one shared goal each day.',
    ],
  },
  puzzle: {
    heading: 'Puzzle Games',
    metaTitle: 'Free Puzzle Games: Sudoku, 2048, Minesweeper and More',
    metaDescription:
      'Play free puzzle games online: Sudoku, 2048, Minesweeper, Mahjong Solitaire, memory and matching puzzles. No sign-up needed, and they work on any device.',
    blurb: 'Logic, numbers, matching and memory.',
    intro: [
      'Puzzle games reward thinking over reflexes. Some are logic puzzles with exactly one correct answer, others are about spotting matches, planning a few moves ahead or remembering where things are hidden.',
      'Several of them come in more than one difficulty. Where a game tracks a best time or score, your record is kept in this browser, separately for each difficulty, so you can start easy and work your way up.',
    ],
  },
  card: {
    heading: 'Card Games',
    metaTitle: 'Free Card Games: Solitaire, Spider and FreeCell',
    metaDescription:
      'Play free solitaire card games in your browser: classic Klondike, Spider Solitaire and FreeCell, with large readable cards for desktop, tablet and mobile.',
    blurb: 'Solitaire classics, one deal at a time.',
    intro: [
      'Solitaire, also known as patience, is the classic single-player card game: deal the cards, then sort them into order by following a few simple rules. Klondike is the one most people know, Spider is a longer game played with two decks, and FreeCell deals every card face up so skill matters more than luck.',
      'Play by tapping or clicking a card and then its destination, or with the arrow keys and Enter. Your fastest winning time for each game is saved in this browser.',
    ],
  },
  board: {
    heading: 'Board Games',
    metaTitle: 'Free Board Games: Play Chess and Checkers Online',
    metaDescription:
      'Play chess and checkers free in your browser against a computer opponent, or play checkers with a friend on one device. Mouse, touch and keyboard controls.',
    blurb: 'Classic strategy against the computer.',
    intro: [
      'Board games are about strategy: thinking a few moves ahead, setting traps and spotting your opponent’s threats before they land. The computer opponent runs entirely in your browser, so you can play at any time without an account.',
      'There is no clock and no score to chase here, so take as long as you like over each move. Chess lets you choose how strongly the computer plays, and Checkers can also be played by two people sharing one device.',
    ],
  },
  word: {
    heading: 'Word Games',
    metaTitle: 'Free Word Games: Daily Word, Crosswords and Word Search',
    metaDescription:
      'Free word games to play online: a daily five-letter word puzzle, mini crosswords, word search grids and a typing speed test. No sign-up, just start playing.',
    blurb: 'Letters, clues and a word a day.',
    intro: [
      'Word games test your vocabulary, spelling and eye for patterns. Guess the hidden word of the day, fill in a small crossword, hunt for words in a grid of letters or see how fast and accurately you can type.',
      'On a computer you play with your keyboard; on a phone or tablet you tap, drag or use an on-screen keyboard. None of them needs an account or a download.',
    ],
  },
  sports: {
    heading: 'Sports Games',
    metaTitle: 'Free Sports Games: Mini Golf and Basketball Online',
    metaDescription:
      'Play free sports games in your browser: a mini golf course full of bank shots and a timed basketball shooting challenge. Aim, set your power and beat your best.',
    blurb: 'Aim, power and a little physics.',
    intro: [
      'These sports games are all about aim and touch. Line up the shot, judge the power and let the physics do the rest. A drag-and-release gesture works on touch screens, and the arrow keys and Space work on a keyboard.',
      'Each game keeps your personal best in this browser, whether that is your lowest number of strokes or your highest score.',
    ],
  },
  racing: {
    heading: 'Racing Games',
    metaTitle: 'Free Racing Games: Top-Down Time Trials',
    metaDescription:
      'Play a free top-down racing game in your browser: race against the clock, learn the racing line and shave time off your personal best on desktop or mobile.',
    blurb: 'Racing lines and the clock.',
    intro: [
      'Time trials are a race against the clock rather than other cars. Learn where to brake, find the racing line through each corner and try to beat your own best time.',
      'Steer with the arrow keys or WASD, or with the on-screen pedals and steering zones on a touch screen. Your best time is saved in this browser.',
    ],
  },
};
