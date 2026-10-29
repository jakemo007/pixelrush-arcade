import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GAME_IDS } from '@/config/games';
import { GameArt } from '@/components/games/GameArt';

const render = (id: (typeof GAME_IDS)[number], suffix: string, label?: string) =>
  renderToStaticMarkup(createElement(GameArt, { gameId: id, idSuffix: suffix, label }));

describe.each(GAME_IDS.map((id) => [id]))('artwork for %s', (id) => {
  it('renders non-empty SVG content with drawn shapes', () => {
    const svg = render(id, 'a');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toMatch(/<(rect|path|circle|ellipse|polygon|line|text)\b/);
    expect(svg.length).toBeGreaterThan(400);
  });

  it('uses no external image resources', () => {
    expect(render(id, 'a')).not.toMatch(/<image\b|href="https?:|url\(https?:/);
  });

  it('has unique ids across repeated instances', () => {
    const ids = (s: string) => [...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
    const a = ids(render(id, 'one'));
    const b = ids(render(id, 'two'));
    expect(new Set(a).size).toBe(a.length);
    expect(a.filter((x) => b.includes(x))).toEqual([]);
  });

  it('is hidden from assistive tech unless labelled', () => {
    expect(render(id, 'a')).toContain('aria-hidden="true"');
    expect(render(id, 'a', 'x')).toContain('role="img"');
  });
});
