#!/usr/bin/env node
/**
 * Browser smoke test for the production build.
 *
 * Serves `out/`, then drives an installed Chrome or Edge (via playwright-core,
 * no browser download) through every page and the main game flows:
 *   - every sitemap page loads, has one <h1>, a title, description and canonical;
 *   - no console errors or uncaught exceptions;
 *   - no horizontal overflow at phone and desktop widths;
 *   - each game starts, pauses, resumes, ends and restarts;
 *   - personal bests persist across reloads;
 *   - the daily challenge links into challenge mode;
 *   - no advertising or analytics requests are made by default;
 *   - unknown URLs return the 404 page.
 * Screenshots are written to smoke-output/ for manual review.
 *
 * Usage: npm run build && npm run test:smoke
 * Set CHROME_PATH to use a specific browser executable.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const PORT = Number(process.env.SMOKE_PORT) || 4173;
const BASE = `http://localhost:${PORT}`;
const OUT_DIR = 'smoke-output';
const failures = [];
const passes = [];

function check(condition, message) {
  if (condition) passes.push(message);
  else failures.push(message);
  console.log(`${condition ? '  ✓' : '  ✗'} ${message}`);
}

if (!existsSync('out/index.html')) {
  console.error('out/ is missing. Run `npm run build` first.');
  process.exit(1);
}
mkdirSync(OUT_DIR, { recursive: true });

const server = spawn(process.execPath, ['scripts/serve-out.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
function stopServer() {
  try {
    if (server.exitCode === null) server.kill();
  } catch {
    // already stopped
  }
}
process.on('exit', stopServer);

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(100);
  }
  throw new Error('Static server did not start');
}

async function launch() {
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH });
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel });
    } catch {
      // try the next one
    }
  }
  throw new Error('No Chrome or Edge installation found. Set CHROME_PATH.');
}

const sitemapPaths = [...readFileSync('out/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

await waitForServer();
const browser = await launch();
console.log(`Browser: ${browser.version()}  Pages in sitemap: ${sitemapPaths.length}`);

const blockedRequests = [];
function watch(page, label) {
  const errors = [];
  page.on('console', (msg) => {
    // Failed resource loads are reported below with their URL instead.
    if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) errors.push(`${label}: console error: ${msg.text()}`);
  });
  page.on('response', (res) => {
    const expected404 = res.url().includes('this-page-does-not-exist');
    if (res.status() >= 400 && !expected404) errors.push(`${label}: HTTP ${res.status()} ${res.url().replace(BASE, '')}`);
  });
  page.on('pageerror', (err) => errors.push(`${label}: page error: ${err.message}`));
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

// ---------------------------------------------------------------------------
console.log('\nPages (desktop 1280x800 and phone 375x740)');
for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 375, height: 740 },
]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = watch(page, viewport.name);
  for (const path of sitemapPaths) {
    const res = await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const info = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      noindex: (document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '').includes('noindex'),
    }));
    const ok =
      res?.status() === 200 && info.h1 === 1 && info.title.length > 10 && info.description.length > 50 && info.canonical.endsWith(path) && info.overflow <= 0 && !info.noindex;
    check(ok, `${viewport.name} ${path} (status ${res?.status()}, h1=${info.h1}, overflow=${info.overflow}px)`);
    if (['/', '/games/neon-dash/', '/daily-challenge/', '/guides/how-to-get-better-at-brick-breaker/'].includes(path)) {
      const name = path === '/' ? 'home' : path.replaceAll('/', '_').replace(/^_|_$/g, '');
      await page.screenshot({ path: `${OUT_DIR}/${viewport.name}-${name}.png`, fullPage: path === '/' });
    }
  }
  check(errors.length === 0, `${viewport.name}: no console errors on content pages${errors.length ? `\n      ${errors.join('\n      ')}` : ''}`);
  await context.close();
}

// ---------------------------------------------------------------------------
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
  // Holding Space must not auto-repeat jumps or restart the game later.
  await waitForStatus(page, 'over', 30000);
  check(true, 'run ends on collision (game over)');
  await page.keyboard.press('Enter'); // inside the restart lock window: ignored
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

// ---------------------------------------------------------------------------
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
  // Park the paddle in a corner; the ball should eventually be lost.
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

// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
check(blockedRequests.length === 0, `no advertising or analytics requests by default${blockedRequests.length ? `: ${blockedRequests[0]}` : ''}`);

await browser.close();
stopServer();
console.log(`\n${passes.length} passed, ${failures.length} failed. Screenshots in ${OUT_DIR}/`);
if (failures.length) {
  console.log('\nFailures:\n  - ' + failures.join('\n  - '));
  process.exit(1);
}
