# Game design

This document describes how each game actually behaves, with the numbers taken from the code. Change both together: the constants live at the top of each `src/games/<game>/simulation.ts`.

## Shared foundations

### States

All games share the lifecycle in `src/games/engine/status.ts`:

```
ready --start--> playing --pause--> paused --resume--> playing
                    |                  |
                    +-----end------> over <--(end)
paused / over --restart--> playing
```

- Restart is **not** allowed directly from `playing`; you pause first. A stray key can never wipe out a run.
- The game **auto-pauses** when the tab is hidden, the window loses focus, or keyboard focus moves to an element outside the game (for example tabbing to a link).
- After game over, keyboard restarts (`Enter`, `Space`, `R`) are ignored for **600 ms**, and the Play again button ignores taps for the same window. A held or mashed key cannot skip the results screen.
- Keyboard auto-repeat is ignored for actions. Holding a key never re-triggers a jump or launch.

### Timing

- Simulations advance in fixed **1/120 s steps** (`src/games/engine/loop.ts`), independent of the display's refresh rate. Long frames are clamped to 0.1 s, so the game never fast-forwards after a hitch.
- Rendering happens once per animation frame. When the game is not playing, the loop stops entirely: no CPU use on menus or paused screens.

### Input

- Keys use `KeyboardEvent.code` (physical positions), so WASD works on any keyboard layout.
- While playing, game keys are taken from the page body or the game widget. In menus, only focus inside the widget counts, so pressing Space to scroll the page never starts a game.
- Touch gestures are captured (`touch-action: none`) only while a run is in progress. In menus the page scrolls normally.
- Presses that happen between two simulation steps are latched until the next step, so very quick taps are never lost.

### Randomness

- Each run has a 32-bit seed. Standard runs pick a random seed; daily challenge runs use the day's seed.
- Gameplay randomness (course, spawns, drops) and cosmetic randomness (particles) use **separate streams**, so visual effects can never change the layout.

### Rendering and accessibility

- Glowing shapes are pre-rendered once to small offscreen canvases and stamped with `drawImage`. That is far cheaper on mobile than drawing shadows every frame.
- The canvas is scaled to its CSS size times `devicePixelRatio` (capped at 2) for sharp output without excessive GPU cost.
- `prefers-reduced-motion: reduce` disables screen shake and reduces flash intensity.
- Game events (start, pause, level changes, game over, challenge completion) are announced through an `aria-live` region. All menus are real HTML buttons.

### Sound

All sounds are synthesized with the Web Audio API (`src/games/engine/audio.ts`). The audio context is created only inside a user gesture (Start, Resume, Restart), so nothing plays before the player interacts. The mute setting is saved locally.

---

## Neon Dash (endless runner)

Logical size **960 × 540**. The runner stays at x = 180 while the world scrolls left.

| Item | Value |
| --- | --- |
| Start speed / max speed | 380 px/s → 820 px/s |
| Acceleration | 4.2 px/s² (max speed reached after ~105 s) |
| Gravity / jump velocity | 2700 px/s² / 940 px/s → full jump ≈ 164 px high, ≈ 0.70 s airtime |
| Variable jump | releasing early caps upward speed at 380 px/s (short hop ≈ 30 px) |
| Coyote time | 0.10 s after leaving the ground |
| Jump buffer | 0.13 s before landing |
| Landing tolerance | 16 px below the ground line (forgiving pit edges) |

**Controls:** `Space` / `W` / `↑` or tap to jump; hold for a higher jump.

**Obstacles**

| Obstacle | Size | How to pass |
| --- | --- | --- |
| Spikes | 1-3 × 30 px wide, 32 px tall | jump (a tap clears one spike) |
| Block | 44 px wide, 56/72/88 px tall | full jump |
| Pit | 76 px minimum, up to 0.28/0.32/0.36 s of travel (by tier) | jump across |
| Drone | 46 × 30 px, floating with its bottom 14 px above the runner's head | **don't jump**: run underneath |

**Difficulty tiers (by distance):** tier 0 (< 7,000 px, ≈ 17 s) has spikes and short blocks only. Tier 1 (< 20,000 px, ≈ 43 s) adds pits, tall blocks and more triple spikes. Tier 2 adds drones and the tallest blocks.

**Fairness rules (enforced by `CourseGenerator`, verified in `tests/neon-dash.test.ts`):**

- The gap after every obstacle is at least `0.55 × airtime + 0.42 s` of travel at the current speed, plus a random extra that shrinks with tier (0.95 / 0.6 / 0.35 s).
- A full jump covers more than 1.5× the widest possible pit.
- Block height stays at least 40 px below the jump apex.
- The course depends only on distance, never on player input.

**Collision:** axis-aligned boxes, with the runner's box inset 4 px and spike boxes trimmed at the tips, so near misses feel fair. Falling more than 16 px below the ground line ends the run.

**Scoring:** 1 point per 25 px traveled (≈ 15 pts/s at start, ≈ 33 pts/s at max speed) + **20 per energy shard**. Shards appear over jumpable obstacles at jump height, under drones at running height, or in long gaps. The milestone sound plays every 500 points.

**Stats:** `score`, `shards`, `timeSurvived` (s), `distance` (m = px / 40).

---

## Brick Breaker

Logical size **540 × 720**. 10 columns of 50 × 20 px bricks with 4 px gaps, almost flush with the walls (2 px), so there is no channel narrower than the ball.

| Item | Value |
| --- | --- |
| Paddle | 100 × 14 px at y = 664 (80 px with Narrow Paddle); keyboard 720 px/s, pointer follow up to 2,400 px/s |
| Ball | radius 7 px; speed 380 px/s + 32 per level (cap 600), +4 per paddle hit within a level (cap +90) |
| Bounce angle | hit offset × 60° from vertical (center = straight up) |
| Lives | 3 (4 with Bonus Life), maximum 5 |
| Levels | 30: 8 hand-built layouts (Warm-Up, Pyramid, Stripes, Checkerboard, Fortress, Diamond, Gates, Finale) followed by 22 generated layouts (see "Levels and stars" below) |

**Controls:** `←`/`→` or `A`/`D`, the mouse over the game, or drag anywhere on touch screens. `Space`/`↑`/`W`, click or tap launches.

**Bricks:** cyan = 1 hit, violet = 2, pink = 3, grey steel = unbreakable (not required to clear a level). Damaged bricks show cracks.

**Capsules:** 9% chance per destroyed brick (max 3 falling at once). **W** wide paddle (×1.5 for 12 s), **S** slow ball (×0.75 for 10 s), **+** extra life. Effects end when the ball is lost.

**Scoring:**

- destroyed brick: `round(10 × hits × (1 + 0.25 × min(combo, 8)))`, where combo counts bricks broken since the ball last touched the paddle (up to ×3);
- damaging a brick without breaking it: +5;
- level clear: +100 × level;
- winning (clearing level 8): +250 per remaining life.

**Collision robustness:**

- The ball moves in sub-steps of at most 3 px, so it cannot pass through a 20 px brick or a wall at any speed.
- All brick contacts in a sub-step are combined into a single reflection, so a hit on the seam between two bricks bounces once.
- The ball is pushed out along the contact normal and only reflects if it was moving into the surface.
- Walls clamp the position, and the ball always keeps at least 30% of its speed vertically, so no endless horizontal bouncing.
- Non-finite values reset the serve, and a 20-second no-paddle-touch safety net rotates the ball.
- The ball returns to the paddle at every serve and level change.

**Stats:** `score`, `bricksBroken`, `levelReached`, `livesLost`.

**Levels and stars** (`src/games/brick-breaker/levels.ts`, shell integration in `GameShell`, rules in `src/lib/progress/`, see `docs/PROGRESSION.md`):

- **Level select.** The start screen lists all 30 levels. A run starts at the chosen level (`RunOptions.level`) and continues upwards as before: lives carry over, and clearing level 30 wins. The next level to play is preselected. "Choose level" on the pause and result screens returns to the start screen. Daily Challenge runs always start at level 1 and have no level select.
- **Generated levels (9 to 30).** Deterministic: level `n` is built from a seeded generator, so every player gets the same layout. Layouts are left-right symmetric, 5 to 10 rows, with density rising from 62% to 82%, steel bricks from 3% to 13% (never in the first or last row) and a hit-point mix that shifts from mostly 1-hit to mostly 3-hit bricks. Up to 40 attempts are made per level, and a safe fallback layout is used if none passes the check below.
- **Fairness check (`levelProblems`).** At least 12 breakable bricks, at most 12 rows, 10 columns, only `. # 1 2 3`, and every breakable brick must be reachable: flood-fill from above and below through every non-steel cell, treating the side walls as closed. A brick sealed in by steel fails the check. All 30 levels pass in `tests/games/brick-breaker-levels.test.ts`.
- **Stars.** Per level, by balls lost on that level: 0 lost = 3 stars, 1 = 2 stars, more = 1 star (`levels.thresholds = [2, 1, 0]`, lower is better). A level result is only recorded when the level is cleared. Stars never go down on a replay.
- **Star gate.** Level 11 needs 15 stars in total and level 21 needs 30 stars (`gate: { every: 10, starsPerGate: 15 }`). The locked level's tooltip and accessible name state exactly what is missing.
- **Speed.** Ball speed still rises per level up to level 8 (600 px/s cap); the difficulty of later levels comes from layouts.
- **Achievement counters** emitted by the simulation: `brick-breaker:levels-cleared` (add 1 per clear), `brick-breaker:flawless-levels` (add 1 when no ball was lost on the level), `brick-breaker:highest-level` (max), `brick-breaker:best-combo` (max). Definitions are in `src/lib/progress/definitions.ts`.

---

## Space Survival

Logical size **480 × 720**.

| Item | Value |
| --- | --- |
| Ship | hit radius 13 px; keyboard speed 360 px/s; touch drag follows the finger's movement 1:1 (up to 1,100 px/s) |
| Auto-fire | every 0.16 s, bullets at 780 px/s; twin cannons fire two angled shots |
| Hull | 3 (2 with Glass Hull); 1.4 s of invulnerability after a hit |
| Spawn interval | `max(0.34, 1.15 − 0.0075 × t)` seconds (×0.8 with Swarm) |
| Enemy speed | ×(1 + min(t / 240, 0.5)) |
| Caps | 28 enemies, 48 player bullets, 40 enemy bullets, 3 pickups |

**Controls:** arrows or WASD; on touch screens, drag anywhere. Firing is automatic everywhere, so the controls stay simple on phones.

**Enemies**

| Enemy | Unlocks | HP | Points | Behaviour |
| --- | --- | --- | --- | --- |
| Drifter (pink diamond) | 0 s | 1 | 10 | drifts down at 110-160 px/s with sideways drift |
| Weaver (violet hexagon) | 25 s | 2 | 25 | sinusoidal sway, 50-110 px amplitude |
| Charger (orange triangle) | 50 s | 1 | 30 | stops, locks on to the ship's current position for 0.7 s (dashed telegraph line), then dashes at 430 px/s |
| Gunship (red octagon, max 2) | 80 s | 6 | 100 | strafes near the top, fires aimed orbs every 1.9 s, leaves after 14 s |

Enemies cannot be hit until they are on screen.

**Pickups:** 6% drop chance per kill (50% for gunships). **+** repair (only while damaged), **2x** twin cannons for 10 s.

**Scoring:** kill points + **5 per second** survived. A new **wave** (banner + sound) starts every 30 s.

**Determinism:** every spawn draws exactly five random numbers before looking at game state, and drops use a separate stream. The spawn timeline for a seed is therefore identical whatever the player does, except in the rare case where the enemy cap is reached.

**Stats:** `score`, `enemiesDestroyed`, `timeSurvived`, `wave`.

---

## Stackfall (falling-block puzzle)

Logical size **480 × 600**: a 10 × 20 board of 28 px cells at (20, 20), with a Hold box and a Next list (3 pieces) in the side panel. Constants live at the top of `src/games/stackfall/simulation.ts`; piece shapes and rotations are in `pieces.ts`.

| Item | Value |
| --- | --- |
| Pieces | 7 four-square shapes (I, O, T, S, Z, J, L), dealt from a shuffled bag so each appears once per 7 |
| Spawn | top centre, rotation 0; a spawn that overlaps the stack ends the run |
| Gravity | `max(0.02, (0.8 − 0.007 × (level − 1)) ^ (level − 1))` seconds per row: 1 s at level 1, ≈ 0.36 s at level 5, ≈ 0.06 s at level 10, floor 0.02 s from level 13 |
| Level | 1 + rows cleared / 10, maximum 15 |
| Soft drop | one row per 0.04 s while held |
| Auto-repeat | first repeat after 0.17 s, then every 0.045 s |
| Lock delay | 0.5 s on the stack; a successful move or turn resets it, up to 15 times per piece (the count resets when the piece reaches a new lowest row) |
| Turning | clockwise and counter-clockwise; the square does not turn; if the turned piece collides it is tried at offsets (−1, 0), (+1, 0), (−2, 0), (+2, 0), (0, −1), otherwise the turn is ignored |
| Hold | one swap per piece; unlocks when the next piece lands |
| Row clear | 0.3 s flash, then rows are removed and the rest falls; input is ignored meanwhile |

**Controls:** `←`/`→`/`A`/`D` move, `↓`/`S` soft drop, `↑`/`W`/`X` turn clockwise, `Z` counter-clockwise, `Space` hard drop, `C`/`Shift` hold.

**Touch (single pointer):** drag moves one column per 28 logical px of horizontal travel; holding a finger more than 50 px below where it started soft drops; a tap (≤ 12 px travel, ≤ 0.4 s) turns clockwise, or holds when it lands in the Hold box; a downward flick (≥ 90 px within 0.3 s, mostly vertical) hard drops. There is no counter-clockwise turn on touch.

**Scoring:** 100 / 300 / 500 / 800 for 1 / 2 / 3 / 4 rows, times the level at the time of the clear; +1 per row of soft drop, +2 per row of hard drop. The run has no win state; it ends with outcome `lost` after a 1.1 s animation.

**Stats:** `score`, `rows`, `level`, `pieces`.

---

## Drop Four (four in a row)

DOM game (`src/games/drop-four/`). Pure rules in `rules.ts`, computer opponent in `ai.ts`, UI in `index.tsx`.

| Item | Value |
| --- | --- |
| Board | 7 columns × 6 rows; a disc falls to the lowest empty row; Red (player 1) always moves first |
| Win | 4 or more of one colour in a row, column or either diagonal; the whole run is highlighted. A full board with no run is a draw |
| Modes | Easy, Medium, Hard (human plays Red against the computer) and Two players (same device) |
| Easy | negamax with alpha-beta, depth 2, plays a random legal column 30% of the time |
| Medium | depth 4 |
| Hard | depth 6 |
| Evaluation | +3 per disc in the centre column (−3 for the rival's), plus window scores over all 69 four-cell windows (1 / 4 / 16 for 1 / 2 / 3 discs with no rival disc in the window) |
| Search order | columns 4, 3, 5, 2, 6, 1, 7 (centre first); an immediate win is always taken; ties are broken at random in the UI and by centre order in tests |
| Timing | the computer replies after 550 ms; the search itself is deterministic, depth-limited and runs in under about 100 ms, so it is not moved to a worker |

**Controls:** `←`/`→`/`Home`/`End` move between columns, `Enter`/`Space`/`↓` drop, `1`–`7` drop straight into a column; click or tap any cell of a column. Take back removes the last move, and against the computer its reply too; it is unavailable after the game ends.

**Records:** there is no personal best (`best: null`). Wins, losses and draws against the computer are stored per difficulty under `host.storage` as `stats-easy`, `stats-medium` and `stats-hard`; Two players records nothing.

**Accessibility:** the board is a `grid` with one labelled `gridcell` per space ("Row 3, column 4, Red disc"); the cursor column's top cell has `data-game-focus`. Discs differ by shape (ring vs diamond) as well as colour. The drop animation is skipped for `prefers-reduced-motion`.

---

## Daily Challenge rules

Implemented in `src/lib/daily/challenge.ts` and tested in `tests/daily-challenge.test.ts`.

- **Time zone:** the challenge day is the **UTC calendar date**. It changes at 00:00 UTC (8 PM EDT / 7 PM EST).
- **Seed:** 32-bit FNV-1a hash of `pixelrush-daily-v1:<YYYY-MM-DD>`. Changing the salt changes every challenge.
- **Featured game:** rotates in catalogue order by day number (days since 1970-01-01 UTC), so consecutive days never repeat a game.
- **Goal:** one of three templates per game, with a target picked by the seeded PRNG within a fixed range and step (for example Neon Dash score 400-1,200 in steps of 50).
- **Modifier:** 60% of days add one of the game's three modifiers.
- **Play:** the card links to `/games/<game>/?mode=daily`. If today's game matches, the run uses the day's seed and modifier, and every retry replays the same layout. If the link is stale (another game is featured today), the page says so and runs a standard game.
- **Completion** is detected live during the run and also checked at game over.
- **Rendering:** computed **in the browser**, never at build time, so a static deployment still rolls over at midnight UTC. A minute timer and the tab-visibility event refresh it.

---

## Local score storage

Implemented in `src/lib/storage/` and tested in `tests/storage.test.ts`.

| Key | Format | Notes |
| --- | --- | --- |
| `pixelrush:v1:best:<game>` | `{ "score": number, "achievedAt": ISO string }` | standard runs only |
| `pixelrush:v1:daily` | `{ "<YYYY-MM-DD>": { "best": number, "completed": boolean } }` | capped to the latest 14 days |
| `pixelrush:v1:settings` | `{ "muted": boolean }` | |

- The `v1` prefix allows a future format change without misreading old data.
- Everything read is validated: scores must be whole numbers from 0 to 10,000,000, and malformed entries are ignored.
- Storage that is unavailable (server rendering, privacy modes, disabled storage) or full never throws. The game still works, and the results screen says scores cannot be saved.
- A run is a new personal best only if it is strictly higher than the previous best and above zero.
- Challenge scores are kept separate from personal bests because modifiers change the rules.
- Nothing is ever sent to a server, and the UI always describes scores as local to the browser.
