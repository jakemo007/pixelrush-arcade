# PixelRush Arcade

A fast, static, mobile-friendly website of **original browser arcade games**: an endless runner (**Neon Dash**), a paddle-and-ball game (**Brick Breaker**) and a vertical survival shooter (**Space Survival**). It also has a deterministic **Daily Challenge**, strategy guides and local personal bests.

There are no accounts, database or paid APIs. Advertising and analytics are wired in but **disabled by default**.

> "PixelRush Arcade" is a provisional brand. Rename it in [`src/config/site.ts`](src/config/site.ts).

---

## Contents

1. [Features](#features)
2. [Technology](#technology)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Local development](#local-development)
6. [npm scripts](#npm-scripts)
7. [Project structure](#project-structure)
8. [Testing](#testing)
9. [Configuring the production URL](#configuring-the-production-url)
10. [Optional analytics](#optional-analytics)
11. [Advertising (disabled by default)](#advertising-disabled-by-default)
12. [Deployment](#deployment)
13. [Technical decisions and trade-offs](#technical-decisions-and-trade-offs)
14. [Troubleshooting](#troubleshooting)
15. [Before you launch](#before-you-launch)

---

## Features

- **Three complete games**, each with start, pause, resume, game-over and restart states, keyboard + mouse + touch controls, sound (with mute), difficulty progression and a locally saved personal best.
  - **Neon Dash**: one-button endless runner with variable jump height, coyote time, jump buffering, pits, drones, collectibles and a fairness-checked course generator.
  - **Brick Breaker**: 8 hand-built levels, angle control from the paddle, combos, power-ups, steel bricks, lives and a win state. Sub-stepped collision prevents tunneling.
  - **Space Survival**: auto-fire shooter with four enemy types, telegraphed attacks, waves, a hull with invulnerability frames, and pickups. Touch steering is relative, so your finger never covers the ship.
- **Daily Challenge**: one game, one goal and an optional modifier per UTC day, the same for every player. Challenge runs use that day's seed, so everyone gets the same course or waves.
- **Content and SEO**: crawlable game pages (how to play, controls, scoring, tips, FAQ), three original guides, unique metadata, canonical URLs, Open Graph images, `sitemap.xml`, `robots.txt`, breadcrumbs with structured data and a custom 404.
- **Accessibility**: semantic HTML, skip link, visible focus, keyboard-operable menus, a screen-reader live region for game events, reduced-motion support (no screen shake, softer flashes) and touch targets of at least 44px.
- **Privacy-first defaults**: no cookies set by the site, local-only storage and honest starter legal pages that reflect the actual build configuration.
- **Static output**: `npm run build` produces plain files in `out/` that any static host can serve.

## Technology

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) with `output: 'export'` (fully static) |
| UI | React 19, TypeScript 5.9 (strict), CSS Modules + one global design-token stylesheet |
| Games | Custom TypeScript engine on the Canvas 2D API (see [trade-offs](#technical-decisions-and-trade-offs)) |
| Audio | Web Audio API, all sounds synthesized in code |
| Tests | Vitest 4 (unit and simulation tests), Playwright Core driving an installed Chrome/Edge (smoke tests) |
| Lint | ESLint 9 with `eslint-config-next` |
| Hosting | Any static host; `vercel.json` included for Vercel |

Runtime dependencies are only `next`, `react` and `react-dom`.

## Prerequisites

- **Node.js 20.9 or newer** (Node 22 LTS recommended). Check with `node --version`.
- **npm 10 or newer** (bundled with Node). `npm ci` works on all npm 10 releases (verified with 10.5.1). Some older 10.x releases fail when *adding* packages (`npm install <pkg>`) with `Cannot read properties of null (reading 'edgesOut')`; upgrade with `npm install -g npm@10` or use `npx npm@10 install <pkg>`.
- **Git**.
- Optional, for `npm run test:smoke`: **Google Chrome or Microsoft Edge** installed locally. No browser download is needed.

## Installation

```bash
git clone https://github.com/jakemo007/pixelrush-arcade.git
cd pixelrush-arcade
npm ci            # installs the exact versions from package-lock.json
cp .env.example .env.local   # optional: every value is optional
```

## Local development

```bash
npm run dev
```

Open <http://localhost:3000>. Pages and games hot-reload as you edit.

To check the real production output locally:

```bash
npm run build     # writes the static site to out/
npm run preview   # serves out/ at http://localhost:3000 like a static host would
```

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production static export to `out/` (also runs `scripts/fix-segment-paths.mjs`, see below) |
| `npm run preview` | Serves `out/` locally (`PORT=4000 npm run preview` to change port) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates Next.js route types, then runs `tsc --noEmit` |
| `npm test` | Unit and simulation tests (Vitest) |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:smoke` | Browser smoke test of the built site (requires `npm run build` first and Chrome/Edge) |
| `npm run check` | Lint, type-check, tests and build, in that order |
| `npm run check:launch` | Lists launch configuration that still needs attention |

## Project structure

```
src/
  app/                       Routes (App Router). Each folder = a URL.
    page.tsx                 Homepage
    games/                   /games/ catalogue + one folder per game page
    daily-challenge/         /daily-challenge/
    guides/                  /guides/ and /guides/[slug]/
    about/ contact/ privacy/ terms/
    og/[file]/route.tsx      Social images generated at build time (/og/*.png)
    apple-touch-icon.png/    iOS home-screen icon generated at build time
    sitemap.ts robots.ts manifest.ts icon.svg not-found.tsx
    layout.tsx globals.css   Root layout and design tokens
  components/
    games/                   GameShell (canvas + HUD + overlays), GamePage, GameCard, GameArt
    daily/                   Daily challenge card and UTC clock hooks
    layout/                  Header, footer, logo
    advertising/             AdSense script + ad slot (render nothing unless enabled)
    analytics/               Google Analytics (renders nothing unless configured)
    ui/                      Breadcrumbs, JSON-LD, operator notes
  games/
    engine/                  Shared runtime: loop, input, status machine, collision, audio, controller
    neon-dash/ brick-breaker/ space-survival/
                             simulation.ts (pure rules), renderer.ts (canvas drawing), index.ts
    modifiers.ts             Daily challenge modifiers
  config/                    site.ts (brand), games.ts (catalogue), integrations.ts (ads/analytics flags)
  content/                   Game page copy and guide articles
  lib/                       storage (localStorage), daily (challenge generator), seo, utils
tests/                       Vitest suites
scripts/                     preview server, smoke test, launch check, export fix
docs/                        Deployment, game design, monetization, SEO, asset licenses
```

**Where game logic lives:** each `simulation.ts` is plain TypeScript with no DOM access. It advances with a fixed timestep and an input snapshot, which is why the rules can be tested in Node. `renderer.ts` only draws. `src/games/engine/controller.ts` connects a game to the canvas, keyboard, pointer, audio and page visibility, and the React `GameShell` adds the HUD and menus.

## Testing

```bash
npm test                         # 90 unit + simulation tests, about 5 seconds
npm run build && npm run test:smoke   # browser smoke test, about 1-2 minutes
```

The unit and simulation tests cover:

- score formulas, personal-best comparison, storage validation and failure handling (corrupt JSON, throwing storage);
- daily challenge determinism, UTC boundaries, rotation, and that goals and modifiers belong to the featured game;
- the game status state machine, input edge latching, the fixed-step loop and collision helpers;
- **gameplay simulations**:
  - Neon Dash: every generated gap and pit is fair, and a scripted player survives 90 s on at least 90% of seeds;
  - Brick Breaker: no tunneling, seam bounces, and 6-minute bot runs where the ball never leaves the arena or rests inside a brick;
  - Space Survival: hits, invulnerability, game over, spawn timelines that don't depend on player movement, and bounded entity counts;
- that ads and analytics stay disabled without configuration.

The smoke test serves `out/` and drives your installed Chrome/Edge through every sitemap page at phone and desktop widths. It checks one `<h1>`, metadata, no horizontal overflow and no console errors. It then plays each game (start, pause, resume, game over, restart, personal-best persistence, touch input), follows the daily challenge into challenge mode, checks the 404 page and verifies that **no ad or analytics requests** are made. Screenshots go to `smoke-output/` (git-ignored). Set `CHROME_PATH` to use a specific browser.

## Configuring the production URL

Canonical tags, Open Graph URLs, `sitemap.xml` and `robots.txt` use, in order:

1. `NEXT_PUBLIC_SITE_URL`, e.g. `https://www.example.com` (set this once you have a domain);
2. on Vercel, the project's production domain (`VERCEL_PROJECT_PRODUCTION_URL`, set automatically);
3. `http://localhost:3000` otherwise. The build prints a warning in this case.

Set the variable in your host's dashboard (Vercel: Project → Settings → Environment Variables) and redeploy. `NEXT_PUBLIC_*` values are baked in at build time.

## Optional analytics

Set `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` to load Google Analytics 4. With it empty (the default), no analytics code is loaded.

Google consent mode defaults are set **before** the tag loads, using `NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT` (`denied` by default). No consent banner or CMP is bundled. Read [docs/MONETIZATION.md](docs/MONETIZATION.md#consent-and-privacy) before enabling analytics for regions that require prior consent. To verify it works, open GA4 → Reports → Realtime while visiting the deployed site. The privacy page updates automatically to describe analytics once it is enabled.

## Advertising (disabled by default)

Ads load **only** when `NEXT_PUBLIC_ADS_ENABLED=true` **and** `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is a valid `ca-pub-` ID. Each placement also needs an approved ad-unit ID (`NEXT_PUBLIC_ADSENSE_SLOT_GAME_PAGE`, `NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_PAGE`). Otherwise nothing renders: no script, no empty boxes. The only placements are below the game-page content and below guide articles, never near the game canvas or controls.

H5 Games Ads (interstitial and rewarded ads inside games) are **not implemented**. They require a separate Google approval and Google's official Ad Placement API. See [docs/MONETIZATION.md](docs/MONETIZATION.md) for requirements, policies and where an approved integration would go.

## Deployment

Full instructions: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). In short:

1. Push the repository to GitHub.
2. Import it in Vercel (framework: Next.js; build command `npm run build` is set in `vercel.json`).
3. Set `NEXT_PUBLIC_SITE_URL` once you have a domain.

> **Commercial use:** Vercel's Hobby plan is limited to non-commercial personal use, and its fair-use guidelines explicitly list advertising such as Google AdSense as commercial use. Before monetizing, move to a plan whose terms allow commercial use, or deploy `out/` to another static host whose terms do.

## Technical decisions and trade-offs

- **Custom canvas engine instead of Phaser.** Phaser 3 was the preferred option, but these three 2D games need only a loop, input, simple collision and sprite drawing. Measured on this build, the entire Next.js + React page ships about **144 KB gzipped** of JavaScript, and each game's engine chunk is about **6 KB gzipped**. Phaser 3.90's minified build alone is **309 KB gzipped**. Writing the rules as pure TypeScript also lets the test suite run thousands of simulated frames per game in Node. The trade-off: no ready-made physics, tilemaps or scene system. If a future game needs those, Phaser can be added to that game's chunk only.
- **Fully static export.** No server means near-zero hosting cost and a portable deployment. Things that would normally run on a server work in the browser instead: the daily challenge is computed client-side (so it changes at midnight UTC without a rebuild), and scores live in `localStorage`. Next.js `headers()`, redirects and image optimization are unavailable with static export. Security headers are therefore set in `vercel.json`, and the site uses inline SVG and generated PNGs instead of optimized images.
- **Trailing slashes** (`/games/neon-dash/`) give every page exactly one URL, and the export works identically on any static host.
- **`scripts/fix-segment-paths.mjs`.** Next.js 16.4's static export writes client-navigation prefetch files at nested paths (`about/__next.about/__PAGE__.txt`) while the router requests dotted names (`about/__next.about.__PAGE__.txt`). On a static host every link prefetch would 404. The script copies each file to the dotted name after `next build`. Navigation works without it, just with failed prefetches. Remove it once a Next.js release fixes the mismatch; the smoke test reports any 404s.
- **Fixed-timestep simulation (120 Hz)** gives stable collisions and reproducible seeded runs on any display refresh rate.
- **Local-only scores.** There is no backend leaderboard, so nothing claims to be verified or global.
- **System fonts** avoid web-font downloads and licensing.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `npm install <pkg>` fails with `reading 'edgesOut'` | npm bug in some older 10.x releases: `npm install -g npm@10`, or `npx npm@10 install <pkg>`. Plain `npm ci` is unaffected |
| `require() of ES Module ... std-env` when running tests | Use Node 20.19+/22.12+ or keep `vitest.config.mts` (the `.mts` extension avoids this on older Node 22) |
| Build warns `NEXT_PUBLIC_SITE_URL is not set` | Expected locally. Set it in production so canonical URLs use your domain |
| `npm run preview` says `out/` is missing | Run `npm run build` first |
| `npm run test:smoke` cannot find a browser | Install Chrome or Edge, or set `CHROME_PATH` to a Chromium-based browser executable |
| Changing an env var has no effect | `NEXT_PUBLIC_*` values are embedded at build time: rebuild and redeploy |
| Game does not respond to keys | Click the game area first; keys only control the game when it (or the page body) has focus. The game pauses when focus leaves it |
| Scores disappear | They are stored per browser. Private windows, other devices or clearing site data start fresh |

## Before you launch

Run `npm run check:launch` and work through [docs/SEO_CHECKLIST.md](docs/SEO_CHECKLIST.md). At minimum:

- set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_CONTACT_EMAIL`;
- fill in `operatorName`, review `/privacy` and `/terms` (ideally with legal advice), then set `legalPagesReviewed: true` in `src/config/site.ts`;
- confirm your hosting plan permits your intended use;
- verify the site in Google Search Console and submit the sitemap.

## License

All rights reserved (`"license": "UNLICENSED"` in `package.json`) until you choose a license. Third-party packages keep their own licenses; see [docs/ASSET_LICENSES.md](docs/ASSET_LICENSES.md).
