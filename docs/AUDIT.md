# Project audit

Audit date: 2026-10-29. Branch: `feature/all-games-and-audit-cleanup`.

## Baseline when the audit started

- Typecheck clean. Tests passed (989 in 35 files). Lint: 0 errors, 1 warning.
- `npm run check:launch`: "configuration incomplete (3 missing)".
- Not covered: gameplay in a browser, mobile touch behavior, accessibility.

## Flaws and status

| # | Flaw | Status |
|---|---|---|
| 1 | `NEXT_PUBLIC_SITE_URL` unset; a fresh build points canonicals, sitemap and robots.txt at `http://localhost:3000` | Open: operator decision |
| 2 | `operatorName` empty, `/terms` jurisdiction placeholder, `legalPagesReviewed` false | Open: operator decision |
| 3 | `NEXT_PUBLIC_CONTACT_EMAIL` unset, so `/contact` shows no address | Open: operator decision |
| 4 | Content depth for AdSense: 20 games have ~900-word content pages, the 3 original games are covered by standalone guides. Initial note ("only 3 guides") overstated the risk | Revised: lower risk. The 3 original games also have how-to-play and FAQ content in `src/content/games.ts`. AdSense still decides on its own review |
| 5 | AdSense eligibility on `*.pages.dev` unconfirmed; no custom domain | Open: operator decision |
| 6 | No consent platform and no `ads.txt` | Open: operator decision |
| 7 | No Content-Security-Policy | Partly fixed: `frame-ancestors`, `base-uri`, `object-src`, `form-action` added. No `script-src`, because Next's static export uses inline scripts and ads/analytics would break. No HSTS (set it in Cloudflare). |
| 8 | Headers duplicated in `vercel.json` and `public/_headers` | Fixed: `tests/headers.test.ts` fails if they differ |
| 9 | Live headers never verified | Open: run `curl -I` after deploy |
| 10 | `scripts/fix-segment-paths.mjs` patches the export after build; fragile across Next upgrades | Open |
| 11 | Lint warning at `tests/storage.test.ts:164` | Fixed |
| 12 | No tests for game UI components (input, touch, focus) | Open |
| 13 | Smoke test is not part of `npm run check` | Open: proposed separate `check:full` script |

## After the fixes

Lint clean (0 warnings). Tests: 991 passed in 36 files.

## Changed files

- `public/_headers`, `vercel.json`: added the Content-Security-Policy header.
- `tests/storage.test.ts`: removed the unused type-guard parameter.
- `tests/headers.test.ts`: new header drift and CSP test.
