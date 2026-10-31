import { GAME_IDS, getGame, isGameId } from '@/config/games';
import { renderOgImage } from '@/lib/seo/og-image';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return ['site', ...GAME_IDS].map((name) => ({ file: `${name}.png` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const name = file.replace(/\.png$/, '');
  if (isGameId(name)) {
    const game = getGame(name);
    return renderOgImage({ title: `Play ${game.name}`, subtitle: game.tagline, accent: game.accent });
  }
  return renderOgImage({ title: 'Free browser games, instant play', subtitle: 'Solitaire · Sudoku · Chess · Word puzzles · Arcade' });
}
