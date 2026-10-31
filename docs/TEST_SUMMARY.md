# Test automation summary

Date: 2026-10-30. Framework: existing `playwright-core` smoke test (`scripts/smoke-test.mjs`) driving the built `out/` site in Chrome or Edge. Run with `npm run build && npm run test:smoke`.

## Generated E2E tests

Added to `scripts/smoke-test.mjs`, in the existing style (semantic locators, linear steps, no new dependencies).

### Stackfall
- [x] Keyboard run: starts at level 1 with 0 rows; a hard drop scores points; hold, pause and resume work; stacking in the middle ends the run; the personal best is saved in `localStorage`; no console errors
- [x] Touch (phone viewport): a tap turns the piece and the run continues; no horizontal overflow; no console errors

### Drop Four
- [x] Click a column: a Red disc lands in the bottom row; the computer replies with a Yellow disc
- [x] Keyboard: the number key 1 drops a disc and the computer replies
- [x] Take back removes the last move and the computer's reply
- [x] Switching to Two players asks for confirmation and starts an empty board
- [x] A vertical four ends the game with "Red wins!" and marks exactly four discs
- [x] Touch (phone viewport): tapping a column drops a disc; no overflow; no console errors

## Result

`212 passed, 0 failed` (195 before). Unit tests (`npm test`): 1,084 passed.

## Coverage

- Both new games: page load, start or first move, core rule, end state, touch, console errors.
- Not covered by browser tests: Stackfall row clears, hold swapping and drag/flick touch gestures (unit-tested only); Drop Four Easy and Hard modes, draws and the computer winning; the 25 pre-existing games beyond the generic shell checks.
- No API endpoints exist (static site), so no API tests apply.

## Next steps

- Run `npm run test:smoke` in CI after `npm run build`.
- Add the same kind of section for each existing game with custom input (Snake swipes, Bubble Shooter aiming, Chess moves).
- Keep the Drop Four and Stackfall timing waits in view if CI machines are slow.
