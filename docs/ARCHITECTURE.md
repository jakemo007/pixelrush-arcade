# Architecture and game platform contract

This document is the technical contract every game on PixelRush Arcade follows. It explains how games are registered, rendered, scored and tested, and who owns which files. Read it before adding or changing a game.

## 1. Platform overview

PixelRush Arcade is a fully static Next.js 16 site (`output: 'export'`): every page is pre-rendered HTML, and each game's code is loaded on demand in the browser. There is no server, database or account system. Personal bests and game data live in the player's `localStorage`.

Games use one of two rendering engines:

| Engine | Used for | Shell | Game module exports |
| --- | --- | --- | --- |
| `canvas` | Real-time action games (fixed 120 Hz simulation + Canvas 2D renderer) | `src/components/games/GameShell.tsx` | `GameDefinition` (default export of `src/games/<id>/index.ts`) |
| `dom` | Turn-based card, board, word and puzzle games rendered as accessible React/HTML | `src/components/games/DomGameShell.tsx` | React component taking `DomGameProps` (default export of `src/games/<id>/index.tsx`) |

The shells own everything around the game: HUD bar, start/new game, pause, sound, result screens, personal bests and the screen-reader live region. Game modules own their rules and their play area.

`src/components/games/GamePage.tsx` renders every game page on the server (title, instructions, controls, scoring, tips, FAQ and related games) and picks the shell from `meta.engine`.

## 2. Files that make up a game

```
src/games/<id>/
  meta.ts        Catalogue entry (CanvasGameInfo | DomGameInfo). Plain data: imported by client code.
  content.ts     Page copy (GameContent). Server-only in practice.
  art.tsx        Card illustration: export function Art({ s }: GameArtBodyProps), drawn in a 320x200 viewBox.
  index.ts(x)    Default export: GameDefinition (canvas) or React component (dom). Lazy-loaded.
  ...            Rules, generators, renderer, CSS modules: anything else the game needs.
src/app/games/<id>/page.tsx   Route (identical 5-line file for every game).
tests/games/<id>.test.ts      Vitest unit tests for the game's rules.
```

Registries that list every game (owned by the integration lead):

| File | Purpose |
| --- | --- |
| `src/config/games.ts` | `GAME_IDS`, `GAMES`, categories, `relatedGames()`, `CHALLENGE_GAME_IDS` |
| `src/content/games.ts` | `GAME_CONTENT` (imports each `content.ts`) |
| `src/components/games/game-loaders.ts` | `CANVAS_LOADERS` / `DOM_LOADERS` (dynamic imports) |
| `src/components/games/GameArt.tsx` | Maps ids to each `art.tsx` |
| `src/app/games/<id>/page.tsx` | One route per game |

The sitemap, Open Graph images (`/og/<id>.png`), footer, catalogue and category pages are all generated from `GAMES`, so they update automatically.

## 3. Catalogue metadata (`meta.ts`)

Type: `CanvasGameInfo` or `DomGameInfo` from `src/config/games.ts`.

- `name`, `tagline` (one line), `summary` (two sentences): used on cards, so they must describe the real game.
- `genre`, `categories` (first one is primary; values: `arcade`, `puzzle`, `card`, `board`, `word`, `sports`, `racing`), `tags` (2-4 short labels).
- `controls.keyboard` / `controls.touch`: one-line summaries shown under the game and in the canvas start screen. They must match the implementation exactly.
- `accent`: `cyan | violet | magenta | amber | green`.
- `best`: what counts as a personal best, or `null` when a best makes no sense (chess, checkers, a daily puzzle with its own stats):
  - `label`: shown in the HUD/result screen ("Score", "Time", "Strokes", "Moves", "Speed").
  - `format`: `points` (1,234), `duration` (ms → m:ss), `racetime` (ms → m:ss.cc) or `count` (integer + `unit`).
  - `direction`: `higher` or `lower`. `lower` results are only recorded for won/completed runs.
  - `requiresWin`: also only record won runs for `higher` results.
- Canvas only: `canvas: { width, height }` must equal the `GameDefinition` width/height.
- DOM only:
  - `variants`: difficulty levels or modes (first is default). Bests are stored per variant. Ids are `[a-z0-9-]`.
  - `variantLabel`: picker label ("Difficulty", "Suits", "Mode").
  - `pausable`: shows a Pause button that hides the board and stops the timer, and auto-pauses when the tab is hidden. Use it for timed games.
  - `aspectRatio`: approximate width/height of the play area, used to reserve space while loading.

## 4. Canvas game contract

Read `src/games/engine/types.ts` and use `src/games/brick-breaker/` as the reference implementation.

- **Simulation** (`simulation.ts`): pure TypeScript, no DOM, no `Math.random()` for gameplay (use `createRng(options.seed)` from `src/lib/utils/random.ts`). `update(dt, input)` is called with a fixed `dt = 1/120 s`. Expose `score`, `outcome` (`null` while running, `'won' | 'lost'` once the run is over and any end animation has finished), `getStats()`, `getHud()` (extra HUD items; the shell adds the score and best), `drainCues()` and `drainAnnouncements()`.
- **Score semantics**: `sim.score` is the value compared with `meta.best`. For a points game it is the score. For a time trial it is the elapsed time in **milliseconds** (integer). For mini golf it is total strokes. It must be a non-negative integer.
- **Renderer** (`renderer.ts`): draws one frame from the simulation; never mutates game state. Pre-render glow effects into sprites (`createSprite`) instead of using `shadowBlur` every frame. Honour `reducedMotion` (no screen shake or flashing).
- **Input**: `bindings` maps actions to `KeyboardEvent.code` values. Pointer input is a single pointer snapshot in logical game coordinates (`inside`, `x`, `y`, `down`, `pressed`, `released`, `moved`); there is no multi-touch. Design touch controls within that (e.g. drag-to-aim, tap zones, auto-throttle). Pointer input only arrives while the game is playing.
- **Lifecycle** (handled by the controller, do not reimplement): Start button / Space / Enter starts; P or Esc pauses; the game auto-pauses on tab switch or focus loss; Enter / R or Play again restarts after game over. Restart creates a brand-new simulation.
- **Levels and progress (optional, canvas only).** A game opts in by setting `levels` in its `CanvasGameInfo` (`count`, `direction`, `thresholds`, `valueLabel`, optional star `gate`). The shell then shows a level select on the start screen, passes the chosen level as `RunOptions.level`, and the simulation reports results through two optional methods: `drainLevelResults()` returns `{ level, value }` for each level cleared (the value is compared with `levels.thresholds` to award stars), and `drainCounters()` returns achievement counter events (`{ counter, value, mode: 'add' | 'max' }`). The shell stores stars with `src/lib/progress/levels.ts` (`game:<id>:progress`) and achievements with `src/lib/progress/achievements.ts` (`achievements`, definitions in `src/lib/progress/definitions.ts`). The controller exposes `refresh()` (rebuild the simulation on the start screen after the level changes) and `showMenu()` (paused or finished game back to the start screen, status event `menu`). Games without `levels` are unaffected. Never read or write progress from inside a game. See `docs/PROGRESSION.md`.
- **Sound**: emit `SoundCue`s from `drainCues()`. Available cues are listed in `src/games/engine/types.ts`, all synthesized in `src/games/engine/audio.ts`.
- **Shared helpers**: `engine/collision.ts` (circle/rect contacts, reflect, clamp), `engine/particles.ts` (pooled particles), `engine/canvas.ts` (palette, sprites, rounded rects, banners).

## 5. DOM game contract

Read `src/games/dom/types.ts` (the contract) and `src/games/dom/hooks.ts` (helpers).

```tsx
export default function MyGame({ host, variant, paused }: DomGameProps) { ... }
```

- **New game = remount.** The shell gives the component a new React key for every new game, so initial state comes from `useState` initialisers and cleanup happens on unmount. Never keep game state in module-level variables.
- **Starting.** DOM games are playable as soon as they mount (no start screen). Start timers on the first move.
- **`host.setInProgress(true)`** after the player's first meaningful action. While true, New game and variant changes ask for confirmation, and the Pause button appears for pausable games.
- **`host.finish(result)`** when the game is won, lost or drawn: `{ outcome, value?, title?, detail?, continuable?, canReplay? }`. `value` uses the unit of `meta.best` (points, milliseconds, moves, WPM). The shell saves the best and shows the result overlay ("Play again", "View board", "Other games"). Use `continuable: true` when play can go on (e.g. 2048 after the 2048 tile). After `finish`, ignore further moves unless continuable.
- **`host.setHud(items)`**: game stats shown in the HUD next to "Best" (e.g. Moves, Time, Mines). Call it when values change, not every frame. Format times with `formatDuration` / `formatRaceTime` from `src/lib/format.ts`.
- **`paused`**: when true the shell hides the board; stop timers and ignore input. For game timers use `usePlayClock(started && !paused && !over)` from `src/games/dom/use-play-clock.ts`: it re-renders a few times a second for display and its `read()` returns the exact elapsed milliseconds for results (the pure `PlayClock` in `src/games/dom/clock.ts` is unit tested).
- **`host.announce(message)`** for important events (check, invalid move, word found). Keep it short.
- **`host.playSound(cue)`** for feedback; respects the shared mute button.
- **`host.storage`**: namespaced storage for anything that is not a personal best (`read(name, validator)`, `write(name, value)`, `remove(name)`; key `pixelrush:v1:game:<id>:<name>`). Always validate what you read; storage may be missing, full or hand-edited.
- **Focus and keyboard.** Mark the element that should receive focus after New game / Resume with `data-game-focus` (it needs `tabIndex={0}` or to be a control). Handle keys with `onKeyDown` on your own elements. If a game must accept typing while focus is on the page body (e.g. a word game), attach a `window` keydown listener in an effect, ignore events with Ctrl/Meta/Alt, and ignore events whose target is a form field or link outside your game root; remove the listener on unmount.
- **Sizing.** The play area gets the full content width (up to 1160 px). Make boards fit `var(--stage-max-h)` (viewport height minus the HUD) where practical, and never overflow horizontally at 320 px width. Use CSS (`min()`, `aspect-ratio`, container-relative units) rather than measuring in JS where possible.
- **Accessibility.** Use real `<button>`s or grid roles with `aria-label`s that describe each cell or card ("7 of hearts", "Row 3, column 5, flagged"). Visible focus, 44 px minimum touch targets where the board allows, information not conveyed by colour alone, `prefers-reduced-motion` respected.
- **Rules live in pure modules** (`rules.ts`, `generator.ts`, `engine.ts`...) with no React or DOM imports, so they can be unit tested in Node.

## 6. Page content (`content.ts`)

Type: `GameContent` from `src/content/types.ts`. Everything must describe the game exactly as implemented, in plain, helpful language.

- `metaTitle`: unique, about 40-60 characters, without the site name (the layout appends it). E.g. "FreeCell Solitaire: Play Free Online".
- `metaDescription`: unique, 120-160 characters, written for this game. No templated copy shared between games and no keyword stuffing.
- `intro` (1-2 paragraphs), `objective`, optional `rules` (formal rules for card/board/puzzle games), `howToPlay` (numbered steps), `controls` (table rows; append `CANVAS_COMMON_CONTROLS` or `DOM_COMMON_CONTROLS`, and `DOM_PAUSE_CONTROL` for pausable DOM games), `scoring`, `difficulty` (with `difficultyTitle` such as "Difficulty levels" when the default heading does not fit), `tips` (3-5), `faq` (3-5, honest answers; never claim global leaderboards, accounts or sync).

## 7. Art (`art.tsx`)

`export function Art({ s }: GameArtBodyProps)` returns SVG elements (no `<svg>` wrapper) for a `0 0 320 200` viewBox, rendered on the server. Original artwork only: simple shapes and gradients in the site's palette. Suffix every `id` (gradients, clip paths) with `s` so two copies on one page do not clash. No external images, fonts, logos or copyrighted characters.

## 8. Storage conventions

All keys start with `pixelrush:v1:`.

| Key | Written by | Contents |
| --- | --- | --- |
| `best:<gameId>` | shells (`recordBest`) | `{ score, achievedAt }` for games without variants |
| `best:<gameId>:<variant>` | DOM shell | the same, per variant |
| `game:<gameId>:<name>` | the game via `host.storage` | game-specific data: stats, saved games, daily results |
| `game:<gameId>:prefs` | DOM shell | `{ variant }`, the last chosen variant |
| `settings` | shells | `{ muted }` |
| `daily` | canvas shell | Daily Challenge progress |

Never call `localStorage` directly from a game. Never present local results as global leaderboards.

## 9. Styling

- Global design tokens and classes live in `src/app/globals.css` (`--color-*`, `--space-*`, `--radius-*`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.pill`, `.visually-hidden`). Use them; for in-game toolbars use `className="btn btn-secondary btn-sm"`.
- Game-specific styles go in a CSS module inside the game's folder. Each game may have its own theme (felt table, wooden board, neon grid), but the surrounding page, HUD and controls stay consistent.
- System fonts only. No external stylesheets, fonts, images or scripts.
- Keep decoration restrained: no glassmorphism, no animated gradients behind text, no motion when `prefers-reduced-motion: reduce`.

## 10. Performance and cleanup

- Canvas games never call React state per frame; the controller throttles HUD updates.
- DOM games update React state on player actions and at most a few times a second for timers.
- Every `setInterval`, `setTimeout`, `requestAnimationFrame`, event listener, observer and Web Worker must be cleaned up on unmount. Navigating away or starting a new game must leave nothing running.
- Heavy computation (puzzle generation, chess search) must not block input for more than about 100 ms at a time: defer it with `setTimeout`, split it into chunks, or use a Web Worker. Show a "thinking" or "generating" state.

## 11. Testing

- Unit tests: `tests/games/<id>.test.ts`, Vitest in a Node environment (`npx vitest run tests/games/<id>.test.ts`). Test the rules, not rendering: legal and illegal moves, win and loss detection, scoring, generators (validity, uniqueness, determinism with a seed) and edge cases. `tests/helpers.ts` has `makeInput()` for canvas simulations and `MemoryStore` / `ThrowingStore` for storage.
- Registry tests (`tests/registry.test.ts`) check every game has a meta, content, art, loader, route and sitemap entry.
- Browser smoke test: `npm run build && npm run test:smoke` drives every page and game in an installed Chrome or Edge.

## 12. Dependencies

Runtime dependencies: `next`, `react`, `react-dom` and `chess.js` (BSD-2-Clause; chess move legality and game-end rules for Chess vs Computer). Adding any other dependency needs a documented reason in the README.

## 13. Advertising and privacy

No advertising or analytics code is loaded by default (`src/config/integrations.ts`). Games must not add ad placeholders, third-party scripts, remote assets or network requests of any kind.

## 14. Ownership (expansion workstreams)

During the 20-game expansion each workstream edited only the files it owned. Anything else was changed by the integration lead.

| Workstream | Owns |
| --- | --- |
| 1. Classic arcade and number puzzles | `src/games/{snake,2048,minesweeper,memory-match,typing-speed}/**`, `tests/games/{snake,2048,minesweeper,memory-match,typing-speed}*.test.ts` |
| 2. Solitaire and card/board games | `src/games/{solitaire,spider-solitaire,freecell,checkers,chess}/**`, `src/games/cards/**` (shared playing-card code), their tests |
| 3. Logic, word and daily puzzles | `src/games/{sudoku,daily-word,crossword-mini,word-search,mahjong-solitaire}/**`, `src/games/words/**` (shared word lists), their tests |
| 4. Action, matching and shooting | `src/games/{bubble-shooter,match-3,car-racing,mini-golf,basketball}/**`, `src/games/arcade-kit/**` (shared physics helpers), their tests |
| 5. Platform, UX and QA | Homepage, `/games/`, `/categories/**`, about/404 copy, header/footer/navigation, `GameCard*`, `src/components/catalogue/**`, `src/content/categories.ts`, `src/lib/seo/routes.ts`, `scripts/smoke-test.mjs`, `tests/registry.test.ts`, `tests/catalogue.test.ts` |
| Integration lead | Registries (section 2), shells, `GamePage`, engine, `src/games/dom/**`, storage, `src/lib/format.ts`, routes, docs, README, `package.json` |
