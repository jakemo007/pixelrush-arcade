# Progression design: levels, stars, themes and achievements

Status: Phase 1 (shared core) is built and tested. Phases 2 to 5 are planned and not started.

## Goal and guardrails

Give players a reason to keep playing a game for hours: a clear next goal, visible progress and rewards for mastery. Everything is stored in the browser only (`localStorage`), like the rest of the site.

Rules every phase follows:

- **No pressure mechanics.** No streaks, no daily-return penalties, no timers that expire, no fake scarcity, no limited lives that block play.
- **No ads tied to progress.** Nothing is locked behind watching or clicking an ad, and levels are never made hard on purpose to push ads.
- **Honest copy.** Progress, stars and achievements are described as stored in this browser; clearing site data removes them. No global leaderboards, no accounts.
- **Gates are about skill, not time.** A level or theme unlocks by clearing the previous level or earning stars, never by waiting.
- **Cosmetic unlocks only.** Themes change colours and art, never gameplay.

## Architecture (`src/lib/progress/`)

Pure TypeScript with no React or DOM imports. Unit tests: `tests/progress.test.ts`.

| Module | Responsibility |
| --- | --- |
| `levels.ts` | Stars from a result (`starsFor`, higher or lower is better), per-level records (best value, stars, date), recording that never lowers a result (`recordLevelResult`), unlock rules (previous level cleared, optional star gate every N levels), `nextLevelToPlay`, validation, load/save through `GameStorage` |
| `achievements.ts` | Counter-driven achievements (`add` or `max` counters, target per definition), unlocking exactly once, progress towards a target, validation of definitions and stored state, load/save |
| `themes.ts` | Theme definitions per game with an unlock rule (default, total stars, or an achievement), resolving the saved theme with fallback to the default, validation, load/save of the chosen theme |

Storage (all keys prefixed `pixelrush:v1:`):

| Key | Contents |
| --- | --- |
| `game:<id>:progress` | `{ levels: { "<n>": { stars, best, at } } }` |
| `game:<id>:theme` | the chosen theme id |
| `achievements` | `{ counters: {...}, unlocked: { "<id>": ISO date } }` |

Everything read is validated. Missing, malformed or hand-edited data falls back to empty progress, and storage failures never throw.

## Integration contract (Phase 2 onwards)

- `RunOptions` gains an optional `level` so a simulation can start at a chosen level. Games that ignore it behave as today.
- A shared level-select screen (stars per level, locked levels visibly locked, a "Continue" button for `nextLevelToPlay`) is rendered by the shells, not by each game.
- When a level ends, the result overlay shows stars earned, the best so far and "Next level" and "Retry" buttons.
- A game reports a level result as `(level, value)` and counters as `(counter, value, mode)`. It does not read or write progress directly.
- Achievement unlocks show as a small, dismissible, non-blocking notice. Notices never interrupt play.
- Each game's levels carry a fairness check in its unit tests: every level must be completable, and star thresholds must be strictly ordered (`isValidThresholds`).

## Per-game plan (parameters are proposals, to be confirmed in each game's phase)

| Game | Levels | Stars | Theme and achievement ideas |
| --- | --- | --- | --- |
| Brick Breaker | 8 hand-built layouts extended to about 30 with generated layouts that pass a fairness check | 3 stars for no life lost, 2 for one, 1 for clearing | Paddle and brick themes; "Clear a level without losing a life", "Break 20 bricks in one combo" |
| Mini Golf | More courses of rising difficulty, grouped in sets | Strokes against par | Ball and green themes; "Hole in one", "Under par on a whole course" |
| Match-3 | Goal levels (reach a score, clear a colour, limited moves) | Score thresholds | Gem set themes; "Cascade of 5", "Clear 10 levels" |
| Bubble Shooter | Hand-built layouts with a clear-all goal | Shots left or score | Bubble set themes; "Drop 20 bubbles with one shot" |
| Sudoku | Packs of puzzles per difficulty that unlock in order | Time and no mistakes | Board themes; "Solve without a hint", "Finish a hard pack" |
| Mahjong Solitaire | More tile layouts that unlock in order | Time and shuffles used | Tile set themes; "Clear a board with no shuffle" |

## Phases

1. **Core (done):** `src/lib/progress/` and its tests.
2. **Shell integration with Brick Breaker as the first game:** `RunOptions.level`, shared level select, stars on the result overlay, level generator with fairness tests, achievement notice.
3. **Mini Golf, Match-3 and Bubble Shooter.**
4. **Sudoku and Mahjong Solitaire** (DOM shell, packs and layouts).
5. **Achievements page and theme picker,** with a list of every achievement and its progress.

Each phase is released only after lint, typecheck, unit tests and the browser smoke test pass, and its numbers are added to `docs/GAME_DESIGN.md`.
