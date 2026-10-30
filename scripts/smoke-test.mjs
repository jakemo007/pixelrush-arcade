#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const EXTERNAL = (process.env.SMOKE_BASE_URL ?? '').trim().replace(/\/+$/, '');
const PORT = Number(process.env.SMOKE_PORT) || 4173;
const BASE = EXTERNAL || `http://localhost:${PORT}`;
const OUT_DIR = 'smoke-output';
const NAV_TIMEOUT = EXTERNAL ? 90000 : 30000;
const failures = [];
const passes = [];
const startedAt = Date.now();

function check(condition, message) {
  if (condition) passes.push(message);
  else failures.push(message);
  console.log(`${condition ? '  ✓' : '  ✗'} ${message}`);
}

if (!EXTERNAL && !existsSync('out/index.html')) {
  console.error('out/ is missing. Run `npm run build` first (or set SMOKE_BASE_URL to test a running server).');
  process.exit(1);
}
mkdirSync(OUT_DIR, { recursive: true });

let server = null;
if (!EXTERNAL) {
  server = spawn(process.execPath, ['scripts/serve-out.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
}
function stopServer() {
  try {
    if (server && server.exitCode === null) server.kill();
  } catch {
  }
}
process.on('exit', stopServer);

async function waitForServer() {
  for (let i = 0; i < (EXTERNAL ? 300 : 50); i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
    }
    await sleep(100);
  }
  throw new Error(`Server at ${BASE} did not respond`);
}

async function launch() {
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH });
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel });
    } catch {
    }
  }
  throw new Error('No Chrome or Edge installation found. Set CHROME_PATH.');
}

await waitForServer();
const sitemapXml = EXTERNAL ? await (await fetch(`${BASE}/sitemap.xml`)).text() : readFileSync('out/sitemap.xml', 'utf8');
const sitemapPaths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const gamePaths = sitemapPaths.filter((p) => /^\/games\/[^/]+\/$/.test(p));
const categoryPaths = sitemapPaths.filter((p) => /^\/categories\/[^/]+\/$/.test(p));

const browser = await launch();
console.log(`Browser: ${browser.version()}  Target: ${BASE}${EXTERNAL ? ' (running server)' : ' (out/)'}  Pages in sitemap: ${sitemapPaths.length}`);

const blockedRequests = [];
const firstLines = (text, n = 2) => String(text).split('\n').filter(Boolean).slice(0, n).join(' / ');
function watch(page, label) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) errors.push(`${label}: console error: ${firstLines(msg.text())}`);
  });
  page.on('response', (res) => {
    const expected404 = res.url().includes('this-page-does-not-exist');
    if (res.status() >= 400 && !expected404) errors.push(`${label}: HTTP ${res.status()} ${res.url().replace(BASE, '')}`);
  });
  page.on('pageerror', (err) => errors.push(`${label}: page error: ${firstLines(err.message)}`));
  page.on('request', (req) => {
    if (/googlesyndication|googletagmanager|google-analytics|doubleclick/.test(req.url())) blockedRequests.push(req.url());
  });
  return errors;
}

const statusOf = (page) => page.locator('section[data-status]').getAttribute('data-status');
const hudValue = (page, label) =>
  page.evaluate((l) => {
    for (const div of document.querySelectorAll('section[data-status] dl > div')) {
      if (div.querySelector('dt')?.textContent === l) return div.querySelector('dd')?.textContent ?? '';
    }
    return '';
  }, label);
const toNumber = (text) => Number(String(text).replace(/[^\d]/g, '')) || 0;

async function waitForStatus(page, status, timeout = 15000) {
  await page.waitForFunction((s) => document.querySelector('section[data-status]')?.getAttribute('data-status') === s, status, { timeout });
}

console.log('\nPages (desktop 1280x800 and phone 375x740)');
for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 375, height: 740 },
]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = watch(page, viewport.name);
  for (const path of sitemapPaths) {
    let res = null;
    try {
      res = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
    } catch (err) {
      check(false, `${viewport.name} ${path} (navigation failed: ${String(err?.message ?? err).split('\n')[0]})`);
      continue;
    }
    const info = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      noindex: (document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '').includes('noindex'),
    }));
    const problems = [
      res?.status() !== 200 && `status ${res?.status()}`,
      info.h1 !== 1 && `${info.h1} h1 elements`,
      info.title.length <= 10 && `title too short ("${info.title}")`,
      info.description.length <= 50 && `description too short (${info.description.length} chars)`,
      !info.canonical.endsWith(path) && `canonical ${info.canonical || 'missing'}`,
      info.overflow > 0 && `overflow ${info.overflow}px`,
      info.noindex && 'noindex',
    ].filter(Boolean);
    check(problems.length === 0, `${viewport.name} ${path}${problems.length ? `: ${problems.join(', ')}` : ` (status ${res?.status()}, h1=${info.h1}, overflow=${info.overflow}px)`}`);
    if (['/', '/games/', '/games/neon-dash/', '/daily-challenge/', '/guides/how-to-get-better-at-brick-breaker/', categoryPaths[0]].includes(path)) {
      const name = path === '/' ? 'home' : path.replaceAll('/', '_').replace(/^_|_$/g, '');
      await page.screenshot({ path: `${OUT_DIR}/${viewport.name}-${name}.png`, fullPage: path === '/' });
    }
  }
  check(errors.length === 0, `${viewport.name}: no console errors on content pages${errors.length ? `\n      ${errors.join('\n      ')}` : ''}`);
  await context.close();
}

console.log(`\nEvery game page: shell, controls and cleanup (${gamePaths.length} games, desktop 1280x800 and phone 390x844)`);
for (const viewport of [
  { name: 'desktop', width: 1280, height: 800, touch: false },
  { name: 'phone', width: 390, height: 844, touch: true },
]) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    ...(viewport.touch ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
  });
  const page = await context.newPage();
  const errors = watch(page, viewport.name);
  const press = (locator) => (viewport.touch ? locator.tap() : locator.click());
  for (const path of gamePaths) {
    const id = path.split('/')[2];
    const firstError = errors.length;
    const problems = [];
    let engine = '?';
    try {
      await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
      const shell = page.locator('section[data-status]');
      await shell.waitFor({ timeout: 15000 });
      engine = (await shell.getAttribute('data-engine')) === 'dom' ? 'dom' : 'canvas';
      if (engine === 'canvas') {
        const start = page.getByRole('button', { name: 'Start game' });
        await start.waitFor({ timeout: 15000 });
        await press(start);
        await waitForStatus(page, 'playing');
        if (viewport.touch) await press(page.getByRole('button', { name: 'Pause game' }));
        else await page.keyboard.press('KeyP');
        await waitForStatus(page, 'paused');
        if (viewport.touch) await press(page.getByRole('button', { name: 'Resume', exact: true }));
        else await page.keyboard.press('KeyP');
        await waitForStatus(page, 'playing');
      } else {
        await waitForStatus(page, 'playing');
        await press(page.getByRole('button', { name: 'New game' }));
        await sleep(300);
        const status = await statusOf(page);
        if (status !== 'playing') problems.push(`status after New game: ${status}`);
        const focusTarget = page.locator('section[data-status] [data-game-focus]').first();
        if ((await focusTarget.count()) > 0) {
          await focusTarget.focus();
          await page.keyboard.press('ArrowRight');
          await sleep(250);
        }
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0) problems.push(`horizontal overflow ${overflow}px`);
      if (id === 'solitaire' || id === 'snake') await page.screenshot({ path: `${OUT_DIR}/${viewport.name}-game-${id}.png` });
      await page.locator('header a[href="/"]').first().click();
      await page.waitForURL(`${BASE}/`, { timeout: NAV_TIMEOUT });
      await sleep(700);
    } catch (err) {
      problems.push(String(err?.message ?? err).split('\n')[0]);
    }
    const newErrors = errors.slice(firstError);
    const detail = [...problems, ...newErrors].join(' | ');
    check(problems.length === 0 && newErrors.length === 0, `${viewport.name} ${id} (${engine})${detail ? `: ${detail}` : ''}`);
  }
  await context.close();
}

console.log('\nHomepage search');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = watch(page, 'home-search');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
  const items = page.locator('[data-catalogue-grid] > li');
  const visibleIds = () => page.$$eval('[data-catalogue-grid] > li', (lis) => lis.filter((li) => !li.hidden).map((li) => li.dataset.gameId));
  const shownCount = (n, compare) =>
    page.waitForFunction(
      ([expected, mode]) => {
        const shown = [...document.querySelectorAll('[data-catalogue-grid] > li')].filter((li) => !li.hidden).length;
        return mode === 'less' ? shown < expected : shown === expected;
      },
      [n, compare],
    );
  const total = await items.count();
  check(total === gamePaths.length, `the catalogue lists every game before searching (${total}/${gamePaths.length})`);
  const target = items.nth(Math.min(4, total - 1));
  const targetId = await target.getAttribute('data-game-id');
  const targetName = (await target.locator('h2, h3').first().textContent())?.trim() ?? '';
  const input = page.locator('[data-catalogue-search]');
  await input.fill(targetName);
  await shownCount(total, 'less');
  const found = await visibleIds();
  check(found.includes(targetId) && found.length < total, `typing "${targetName}" filters the cards (${found.length} shown, includes ${targetId})`);
  const status = ((await page.textContent('[data-catalogue-status]')) ?? '').trim();
  check(/match/.test(status), `the result count is announced ("${status}")`);
  await page.screenshot({ path: `${OUT_DIR}/home-search-results.png` });
  await input.fill('zzqqxv');
  await page.locator('[data-catalogue-empty]').waitFor({ timeout: 5000 });
  check((await visibleIds()).length === 0, 'a nonsense query shows the empty state');
  await page.getByRole('button', { name: 'Clear search' }).first().click();
  await shownCount(total, 'equal');
  check((await visibleIds()).length === total && (await input.inputValue()) === '', 'clearing the search restores every game');
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nAll games page filters');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = watch(page, 'games-filters');
  await page.goto(`${BASE}/games/`, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
  const visibleCount = () => page.$$eval('[data-catalogue-grid] > li', (lis) => lis.filter((li) => !li.hidden).length);
  const total = await visibleCount();
  const chips = page.getByRole('group', { name: 'Filter by category' }).getByRole('button');
  const chip = chips.nth(3);
  await chip.click();
  check((await chip.getAttribute('aria-pressed')) === 'true', 'a category chip toggles aria-pressed');
  const filtered = await visibleCount();
  check(filtered > 0 && filtered < total, `a category chip filters the list (${filtered}/${total})`);
  await chips.first().click();
  check((await visibleCount()) === total, '"All games" shows everything again');
  await page.goto(`${BASE}/games/?q=zzqqxv`, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
  await page.locator('[data-catalogue-empty]').waitFor({ timeout: 5000 });
  check((await page.locator('[data-catalogue-search]').inputValue()) === 'zzqqxv', '?q= in the URL pre-fills the search');
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nCategory pages');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = watch(page, 'categories');
  check(categoryPaths.length > 0, `the sitemap lists category pages (${categoryPaths.length})`);
  for (const path of categoryPaths) {
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
    const info = await page.evaluate(() => {
      const section = document.querySelector('main section');
      const links = [...(section?.querySelectorAll('article h2 a') ?? [])].map((a) => a.getAttribute('href'));
      return { h1: document.querySelectorAll('h1').length, links, crumbs: document.querySelectorAll('nav[aria-label="Breadcrumb"] li').length };
    });
    const valid = info.links.length > 0 && info.links.every((href) => gamePaths.includes(href ?? ''));
    check(info.h1 === 1 && valid && info.crumbs === 3, `${path}: one h1, ${info.links.length} game cards, ${info.crumbs} breadcrumbs`);
  }
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nMobile menu (390x844, touch)');
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = watch(page, 'mobile-menu');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
  const button = page.getByRole('button', { name: 'Menu' });
  check((await button.isVisible()) && (await button.getAttribute('aria-expanded')) === 'false', 'the Menu button is shown, collapsed');
  const panel = page.locator(`[id="${await button.getAttribute('aria-controls')}"]`);
  await button.tap();
  check((await button.getAttribute('aria-expanded')) === 'true' && (await panel.isVisible()), 'tapping Menu opens the panel');
  const links = await panel.getByRole('link').count();
  check(links >= 4 + categoryPaths.length, `the panel lists the sections and categories (${links} links)`);
  await page.screenshot({ path: `${OUT_DIR}/phone-menu-open.png` });
  await page.keyboard.press('Escape');
  const focusedButton = await page.evaluate(() => document.activeElement?.hasAttribute('aria-controls') ?? false);
  check((await button.getAttribute('aria-expanded')) === 'false' && !(await panel.isVisible()) && focusedButton, 'Escape closes it and returns focus to the button');
  await button.tap();
  await panel.getByRole('link').first().tap();
  await page.waitForURL(`${BASE}/games/`, { timeout: NAV_TIMEOUT });
  await sleep(300);
  check((await button.getAttribute('aria-expanded')) === 'false' && !(await panel.isVisible()), 'following a link closes the menu');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, `no horizontal overflow after navigating (${overflow}px)`);
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nNeon Dash (keyboard)');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = watch(page, 'neon-dash');
  await page.goto(`${BASE}/games/neon-dash/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start game' }).waitFor();
  await page.screenshot({ path: `${OUT_DIR}/neon-dash-ready.png` });
  await page.getByRole('button', { name: 'Start game' }).click();
  await waitForStatus(page, 'playing');
  check(true, 'starts from the Start button');
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
  check(focused.includes('play area'), `focus moves to the play area (${focused})`);
  await page.keyboard.press('Space');
  await sleep(900);
  await page.screenshot({ path: `${OUT_DIR}/neon-dash-playing.png` });
  const score1 = toNumber(await hudValue(page, 'Score'));
  check(score1 > 0, `score increases while running (${score1})`);
  await page.keyboard.press('KeyP');
  await waitForStatus(page, 'paused');
  const pausedScore = toNumber(await hudValue(page, 'Score'));
  await sleep(500);
  check(toNumber(await hudValue(page, 'Score')) === pausedScore, 'P pauses and the score stops');
  await page.screenshot({ path: `${OUT_DIR}/neon-dash-paused.png` });
  await page.keyboard.press('KeyP');
  await waitForStatus(page, 'playing');
  check(true, 'P resumes');
  await waitForStatus(page, 'over', 30000);
  check(true, 'run ends on collision (game over)');
  await page.keyboard.press('Enter');
  check((await statusOf(page)) === 'over', 'an immediate Enter after game over is ignored (restart lock)');
  const final = toNumber(await page.locator('[class*="finalScore"]').textContent());
  const stored = await page.evaluate(() => localStorage.getItem('pixelrush:v1:best:neon-dash'));
  check(stored !== null && JSON.parse(stored).score === final && final > 0, `personal best saved locally (${stored})`);
  await sleep(700);
  await page.screenshot({ path: `${OUT_DIR}/neon-dash-over.png` });
  await page.keyboard.press('Enter');
  await waitForStatus(page, 'playing');
  check(true, 'Enter restarts after the lock');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start game' }).waitFor();
  check(toNumber(await hudValue(page, 'Best')) === final, 'personal best is shown again after reload');
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nBrick Breaker (mouse + keyboard)');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = watch(page, 'brick-breaker');
  await page.goto(`${BASE}/games/brick-breaker/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start game' }).click();
  await waitForStatus(page, 'playing');
  check((await hudValue(page, 'Lives')) === '3' && (await hudValue(page, 'Level')) === '1/8', 'starts with 3 lives on level 1/8');
  const box = await page.locator('canvas').boundingBox();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.8);
  await page.keyboard.press('Space');
  await sleep(1200);
  await page.screenshot({ path: `${OUT_DIR}/brick-breaker-playing.png` });
  await page.keyboard.press('Escape');
  await waitForStatus(page, 'paused');
  check(true, 'Esc pauses');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await waitForStatus(page, 'playing');
  check(true, 'Resume button resumes');
  await page.mouse.move(box.x + 2, box.y + box.height - 5);
  await page.waitForFunction(
    () => {
      for (const div of document.querySelectorAll('section[data-status] dl > div')) {
        if (div.querySelector('dt')?.textContent === 'Lives') return div.querySelector('dd')?.textContent === '2';
      }
      return false;
    },
    null,
    { timeout: 45000 },
  );
  check(true, 'losing the ball costs a life');
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nSpace Survival (keyboard + HUD buttons)');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = watch(page, 'space-survival');
  await page.goto(`${BASE}/games/space-survival/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start game' }).click();
  await waitForStatus(page, 'playing');
  await page.keyboard.down('ArrowLeft');
  await sleep(700);
  await page.keyboard.up('ArrowLeft');
  await sleep(4500);
  await page.screenshot({ path: `${OUT_DIR}/space-survival-playing.png` });
  const score = toNumber(await hudValue(page, 'Score'));
  check(score >= 20, `score grows with survival time (${score})`);
  await page.getByRole('button', { name: 'Pause game' }).click();
  await waitForStatus(page, 'paused');
  check(true, 'HUD pause button pauses');
  await page.getByRole('button', { name: /Sound on/ }).click();
  check((await page.evaluate(() => localStorage.getItem('pixelrush:v1:settings'))) === '{"muted":true}', 'mute toggle is remembered');
  await page.getByRole('button', { name: 'Restart' }).click();
  await waitForStatus(page, 'playing');
  check(toNumber(await hudValue(page, 'Score')) < score, 'Restart from the pause menu starts a fresh run');
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nTouch device (iPhone-sized, touch events)');
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = watch(page, 'touch');
  for (const id of ['neon-dash', 'brick-breaker', 'space-survival']) {
    await page.goto(`${BASE}/games/${id}/`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start game' }).tap();
    await waitForStatus(page, 'playing');
    const box = await page.locator('canvas').boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await sleep(800);
    await page.screenshot({ path: `${OUT_DIR}/touch-${id}.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check((await statusOf(page)) !== 'ready' && overflow <= 0, `${id}: starts and plays with touch, no overflow`);
  }
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nStackfall (keyboard, game over, personal best)');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = watch(page, 'stackfall');
  await page.goto(`${BASE}/games/stackfall/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start game' }).click();
  await waitForStatus(page, 'playing');
  check(toNumber(await hudValue(page, 'Level')) === 1 && toNumber(await hudValue(page, 'Rows')) === 0, 'starts at level 1 with 0 rows');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Space');
  await sleep(300);
  const score = toNumber(await hudValue(page, 'Score'));
  check(score > 0, `a hard drop scores points (${score})`);
  await page.keyboard.press('KeyC');
  await sleep(150);
  await page.keyboard.press('KeyP');
  await waitForStatus(page, 'paused');
  await page.keyboard.press('KeyP');
  await waitForStatus(page, 'playing');
  check(true, 'hold, pause and resume work');
  for (let i = 0; i < 40 && (await statusOf(page)) === 'playing'; i++) {
    await page.keyboard.press('Space');
    await sleep(90);
  }
  await waitForStatus(page, 'over', 8000);
  check(true, 'stacking pieces in the middle ends the run (game over)');
  const best = await page.evaluate(() => localStorage.getItem('pixelrush:v1:best:stackfall'));
  check(Boolean(best && JSON.parse(best).score > 0), `personal best saved locally (${best})`);
  await page.screenshot({ path: `${OUT_DIR}/stackfall-over.png` });
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nStackfall (touch)');
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = watch(page, 'stackfall-touch');
  await page.goto(`${BASE}/games/stackfall/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Start game' }).tap();
  await waitForStatus(page, 'playing');
  const box = await page.locator('canvas').boundingBox();
  await page.touchscreen.tap(box.x + box.width * 0.35, box.y + box.height * 0.5);
  await sleep(500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check((await statusOf(page)) === 'playing' && overflow <= 0, 'a tap turns the piece and the run continues, no overflow');
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nDrop Four (vs computer, keyboard, take back, two players)');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = watch(page, 'drop-four');
  const moves = async () => toNumber(await hudValue(page, 'Moves'));
  const waitForMoves = (n) =>
    page.waitForFunction(
      (target) => {
        for (const div of document.querySelectorAll('section[data-status] dl > div')) {
          if (div.querySelector('dt')?.textContent === 'Moves') return Number(div.querySelector('dd')?.textContent) === target;
        }
        return false;
      },
      n,
      { timeout: 6000 },
    );
  await page.goto(`${BASE}/games/drop-four/`, { waitUntil: 'networkidle' });
  await page.getByRole('gridcell', { name: 'Row 1, column 4, empty', exact: true }).click();
  await page.getByRole('gridcell', { name: /Row 6, column 4, Red disc/ }).waitFor({ timeout: 3000 });
  check(true, 'clicking a column drops a Red disc to the bottom');
  await waitForMoves(2);
  check(await page.getByRole('gridcell', { name: /Yellow disc/ }).first().isVisible(), 'the computer replies with a Yellow disc');
  await page.locator('[data-game-focus]').first().focus();
  await page.keyboard.press('Digit1');
  await waitForMoves(4);
  check(true, 'the number key 1 drops a disc and the computer replies');
  await page.getByRole('button', { name: 'Take back' }).click();
  await waitForMoves(2);
  check(true, 'Take back undoes the last move and the computer’s reply');
  await page.getByRole('button', { name: 'Two players', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Start new game' }).click();
  await waitForMoves(0);
  check(true, 'switching to Two players asks for confirmation and starts a fresh board');
  for (const col of [1, 2, 1, 2, 1, 2, 1]) {
    await page.getByRole('gridcell', { name: `Row 1, column ${col}, empty`, exact: true }).click();
    await sleep(100);
  }
  await page.getByText('Red wins!').first().waitFor({ timeout: 5000 });
  check((await page.getByRole('gridcell', { name: /part of the winning four/ }).count()) === 4, 'a vertical four wins and the four discs are marked');
  await page.screenshot({ path: `${OUT_DIR}/drop-four-win.png` });
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nDrop Four (touch)');
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = watch(page, 'drop-four-touch');
  await page.goto(`${BASE}/games/drop-four/`, { waitUntil: 'networkidle' });
  await page.getByRole('gridcell', { name: 'Row 1, column 4, empty', exact: true }).tap();
  await page.getByRole('gridcell', { name: /Row 6, column 4, Red disc/ }).waitFor({ timeout: 3000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, `tapping a column drops a disc, no overflow (${overflow}px)`);
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);
  await context.close();
}

console.log('\nDaily challenge');
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = watch(page, 'daily');
  await page.goto(`${BASE}/daily-challenge/`, { waitUntil: 'networkidle' });
  const link = page.getByRole('link', { name: /Play the challenge|Play again/ });
  await link.waitFor();
  const href = await link.getAttribute('href');
  check(/\/games\/[a-z-]+\/\?mode=daily$/.test(href ?? ''), `challenge card links to challenge mode (${href})`);
  await link.click();
  await page.getByRole('button', { name: 'Start challenge' }).waitFor();
  const bar = await page.locator('[class*="challengeBar"]').textContent();
  check(Boolean(bar?.includes('Daily Challenge')), 'game page shows the challenge goal');
  await page.screenshot({ path: `${OUT_DIR}/daily-mode.png` });
  check(errors.length === 0, `no console errors${errors.length ? `: ${errors.join(' | ')}` : ''}`);

  const res = await page.goto(`${BASE}/this-page-does-not-exist/`);
  check(res?.status() === 404 && (await page.locator('h1').textContent())?.includes('doesn’t exist'), 'unknown URL shows the 404 page');
  await context.close();
}

check(blockedRequests.length === 0, `no advertising or analytics requests by default${blockedRequests.length ? `: ${blockedRequests[0]}` : ''}`);

await browser.close();
stopServer();
console.log(`\n${passes.length} passed, ${failures.length} failed in ${Math.round((Date.now() - startedAt) / 1000)} s. Screenshots in ${OUT_DIR}/`);
if (failures.length) {
  console.log('\nFailures:\n  - ' + failures.join('\n  - '));
  process.exit(1);
}
