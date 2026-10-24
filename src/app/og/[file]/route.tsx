import { GAME_IDS, getGame, isGameId } from '@/config/games';
import { renderOgImage } from '@/lib/seo/og-image';

/**
 * Social preview images, generated once at build time as real .png files
 * (/og/site.png, /og/neon-dash.png, ...) so every static host serves them
 * with the correct content type.
 */
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
  return renderOgImage({ title: 'Free arcade games, instant play', subtitle: 'Neon Dash · Brick Breaker · Space Survival' });
}
