import type { ComponentType } from 'react';
import { getGame, isChallengeGameId, type GameId } from '@/config/games';
import { Art as SolitaireArt } from '@/games/solitaire/art';
import { Art as SudokuArt } from '@/games/sudoku/art';
import { Art as SnakeArt } from '@/games/snake/art';
import { Art as Game2048Art } from '@/games/2048/art';
import { Art as MinesweeperArt } from '@/games/minesweeper/art';
import { Art as ChessArt } from '@/games/chess/art';
import { Art as CheckersArt } from '@/games/checkers/art';
import { Art as SpiderSolitaireArt } from '@/games/spider-solitaire/art';
import { Art as FreecellArt } from '@/games/freecell/art';
import { Art as MahjongSolitaireArt } from '@/games/mahjong-solitaire/art';
import { Art as DailyWordArt } from '@/games/daily-word/art';
import { Art as CrosswordMiniArt } from '@/games/crossword-mini/art';
import { Art as WordSearchArt } from '@/games/word-search/art';
import { Art as BubbleShooterArt } from '@/games/bubble-shooter/art';
import { Art as Match3Art } from '@/games/match-3/art';
import { Art as TypingSpeedArt } from '@/games/typing-speed/art';
import { Art as MemoryMatchArt } from '@/games/memory-match/art';
import { Art as CarRacingArt } from '@/games/car-racing/art';
import { Art as MiniGolfArt } from '@/games/mini-golf/art';
import { Art as BasketballArt } from '@/games/basketball/art';
import { ClassicArtBody } from './ClassicGameArt';

export interface GameArtBodyProps {
  s: string;
}

const ART: Record<Exclude<GameId, 'neon-dash' | 'brick-breaker' | 'space-survival'>, ComponentType<GameArtBodyProps>> = {
  'solitaire': SolitaireArt,
  'sudoku': SudokuArt,
  'snake': SnakeArt,
  '2048': Game2048Art,
  'minesweeper': MinesweeperArt,
  'chess': ChessArt,
  'checkers': CheckersArt,
  'spider-solitaire': SpiderSolitaireArt,
  'freecell': FreecellArt,
  'mahjong-solitaire': MahjongSolitaireArt,
  'daily-word': DailyWordArt,
  'crossword-mini': CrosswordMiniArt,
  'word-search': WordSearchArt,
  'bubble-shooter': BubbleShooterArt,
  'match-3': Match3Art,
  'typing-speed': TypingSpeedArt,
  'memory-match': MemoryMatchArt,
  'car-racing': CarRacingArt,
  'mini-golf': MiniGolfArt,
  'basketball': BasketballArt,
};

function FallbackArt({ name }: { name: string }) {
  return (
    <>
      <rect width="320" height="200" fill="#141a33" />
      <circle cx="160" cy="84" r="34" fill="#2b3566" />
      <text x="160" y="96" textAnchor="middle" fontSize="34" fontWeight="700" fill="#e8ecff">
        {name.charAt(0)}
      </text>
      <text x="160" y="152" textAnchor="middle" fontSize="18" fill="#aab3e0">
        {name}
      </text>
    </>
  );
}

interface ArtProps {
  gameId: GameId;
  idSuffix?: string;
  label?: string;
  className?: string;
}

export function GameArt({ gameId, label, className, idSuffix = 'art' }: ArtProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  const Body = isChallengeGameId(gameId) ? null : ART[gameId];
  return (
    <svg viewBox="0 0 320 200" className={className} preserveAspectRatio="xMidYMid slice" focusable="false" {...a11y}>
      {isChallengeGameId(gameId) ? <ClassicArtBody gameId={gameId} s={idSuffix} /> : Body ? <Body s={idSuffix} /> : <FallbackArt name={getGame(gameId).name} />}
    </svg>
  );
}
