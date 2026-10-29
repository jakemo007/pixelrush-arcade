# Launch readiness

Status as of 2026-10-29. Advertising is disabled. This file does not guarantee AdSense approval or legal compliance.

## Cloudflare Pages settings

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `out` |
| Node version | `>=20.9.0` (set `NODE_VERSION=22` in Pages variables) |
| Required variable | `NEXT_PUBLIC_SITE_URL` = final `https://` origin (no trailing path) |
| Optional variables | `NEXT_PUBLIC_CONTACT_EMAIL`; ad/analytics variables stay unset |

- Without `NEXT_PUBLIC_SITE_URL`, canonical URLs, the sitemap and robots.txt point at `http://localhost:3000`. `npm run check:launch` flags this, including in built `out/` output. `CF_PAGES_URL` is a per-deployment URL, so it is deliberately not used as a fallback.
- Security headers live in `public/_headers` (Cloudflare reads this file; `vercel.json` is ignored there). After deploying, verify with `curl -I https://<site>/` that the headers are present. This has not been verified against the live site.

## Checks

- `npm run check:launch` reports `TODO`, `WARN`, `REVIEW`, `OK`, `INFO` and a final STATE line. `--strict` exits non-zero until nothing is outstanding.
- A passing check means "ready for technical verification" only.

## AdSense: verified against Google's pages (fetched 2026-10-29)

- Eligibility (support.google.com/adsense/answer/9724): original high-quality content, applicant 18+, compliance with program policies, access to the site's HTML. The page itself does not discuss subdomains; it links to "Owning the site you want to use to participate in AdSense", which was not reviewed. Whether `*.pages.dev` is acceptable is therefore **unconfirmed**. A custom domain gives long-term control but has not been bought or configured.
- Consent (answer/13554020): a Google-certified CMP integrated with IAB TCF is required to serve personalized ads in the EEA, UK and Switzerland. No CMP is implemented. Select one before enabling ads for those regions.
- `ads.txt` (answer/12171612): not reviewed in detail. Add `public/ads.txt` only with the exact line Google provides. None exists.

## Technical state of ads

Ads are off by default and only load when `NEXT_PUBLIC_ADS_ENABLED=true` and a valid `ca-pub-` ID are set. The smoke test asserts no ad or analytics requests occur by default. Suggested future placements, away from controls: below the game description, and in the sidebar or footer of content pages. Never inside or overlapping the canvas, Play/Restart/Pause controls or level-complete dialogs.

## Operator decisions needed

1. Final domain and `NEXT_PUBLIC_SITE_URL`.
2. `NEXT_PUBLIC_CONTACT_EMAIL`.
3. `operatorName` in `src/config/site.ts` (legal name of the person or business).
4. Governing jurisdiction in `/terms` (currently an explicit bracketed placeholder).
5. Legal review of `/privacy` and `/terms`; only then set `legalPagesReviewed`.
6. Consent platform choice, AdSense account and `ads.txt` line.
