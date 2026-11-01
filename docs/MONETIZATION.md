# Monetization: AdSense and H5 Games Ads

> **Status:** advertising is **disabled**. The code is ready to show standard AdSense display ads once you have approval and set the configuration below. **No ads are approved, no publisher ID is configured, and H5 Games Ads are not implemented.** Being ready to integrate is not the same as being approved.

All Google links below were checked on 2026-10-24. Google changes its programs and policies often, so re-read the official pages before every change.

---

## 1. What standard AdSense requires

1. **An approved AdSense account and site.** Google's [eligibility requirements](https://support.google.com/adsense/answer/9724) include original, high-quality content, compliance with the [AdSense Program policies](https://support.google.com/adsense/answer/48182), being at least 18 years old, and owning the site with access to its HTML.
2. **A site worth approving.** Launch first, publish useful content (the game pages and guides are a start), and get real visitors. Approval is never guaranteed.
3. **A hosting plan that permits commercial use.** Vercel's Hobby plan does not allow ads; see [DEPLOYMENT.md](DEPLOYMENT.md#2-choose-a-hosting-plan-that-allows-your-use).
4. **Consent management** for visitors in the EEA, UK and Switzerland (section 6).
5. **An updated privacy policy.** `/privacy` switches automatically to describe AdSense when ads are enabled. Review that text.
6. **ads.txt.** After approval, AdSense gives you a line for an [ads.txt file](https://support.google.com/adsense/answer/12171612). Create `public/ads.txt` containing exactly that line and redeploy; it is served at `/ads.txt`. Do not create this file with a made-up publisher ID.
7. **Placement review** against the [ad placement policies](https://support.google.com/adsense/answer/1346295) (section 5).

## 2. What H5 Games Ads additionally require

[H5 Games Ads](https://support.google.com/adsense/answer/9959170) show **interstitial** and **rewarded** ads inside HTML5 games. They are a separate, **by-application** product: per Google's [sign-up page](https://support.google.com/adsense/answer/1705831) you need an already-approved AdSense account, you apply through Google's form, and approval depends on eligibility.

They are integrated with Google's **Ad Placement API** ([overview](https://developers.google.com/ad-placement), [getting started](https://developers.google.com/ad-placement/docs/html5-game-structure), [`adBreak()` reference](https://developers.google.com/ad-placement/apis/adbreak)), not with ordinary ad units. Full-screen ads may appear only at natural breaks (between levels, between a menu and a game), never during continuous gameplay or right after another full-screen ad.

**Nothing in this repository imitates or stubs that API.** After approval, implement it from Google's current documentation. The natural integration points are:

| Moment in PixelRush | Where in the code | Ad Placement API concept (check current docs) |
| --- | --- | --- |
| Player presses **Start** | `GameShell` → `start()` | a `start` placement |
| Player presses **Play again** after game over | `GameShell` → `restart()` | a `next` placement |
| Brick Breaker level transition | `BrickBreakerSimulation.clearLevel()` (raise an event; the shell decides) | a `next` placement between levels |
| Player opens the **pause** menu | `GameShell` → `pause()` | a `pause` placement |
| Optional reward, e.g. "watch an ad to continue once" | new UI on the game-over screen | a `reward` placement |

Rules to follow when that work happens:

- Call ad breaks only from the React shell at those state transitions, never from inside the simulation loop. The game must be **paused and muted** before an ad (`beforeAd`) and resumed after (`afterAd` / `adBreakDone`). The controller already exposes `pause()`, `resume()` and `setMuted()`.
- **Rewarded ads must be genuinely optional.** Show a clear offer ("Watch a short ad to continue with 1 hull point"), grant exactly the promised reward only when the API reports the ad was viewed (`adViewed`), and grant nothing when it is dismissed (`adDismissed`). Any game-state change, such as a revived run, must be explicit and predictable, and must never alter daily-challenge results.
- Respect the frequency controls Google provides, and do not add your own extra interruptions.
- Keep the game fully playable when no ad is available or the script is blocked.

## 3. Configuring IDs without committing secrets

Publisher and slot IDs are not secrets, but they belong in **environment variables**, not in code, so development and preview builds stay ad-free:

```bash
# In your host's dashboard (production only), never in committed files:
NEXT_PUBLIC_ADS_ENABLED=true
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-0000000000000000   # your real ID from AdSense
NEXT_PUBLIC_ADSENSE_SLOT_GAME_PAGE=1234567890           # an ad unit you created in AdSense
NEXT_PUBLIC_ADSENSE_SLOT_CONTENT_PAGE=1234567890
```

`src/config/integrations.ts` enables ads **only** if the flag is exactly `true` **and** the client ID matches `ca-pub-` plus 16 digits. A placement renders only if its slot ID is numeric. Anything else means no ad container. A valid client ID on its own still loads Google's AdSense loader script on every page (`AdSenseScript`), because AdSense uses it to verify site ownership. That script renders no ad units, but Google can show Auto ads through it if they are switched on for the site in AdSense, so keep Auto ads off until you are ready. With no valid client ID there is no script at all. In Vercel, set these for the **Production** environment only, so preview deployments stay ad-free.

`.env.example` documents the variables with empty values, and `.env.local` is git-ignored.

## 4. Keeping ads off during development

- With no environment variables set (the default), ads are off. `tests/config.test.ts` checks this.
- **Never enable real ads on `localhost` or preview URLs, and never click your own ads.** To check layout, use the placements' positions in the page, not live ads.
- `npm run test:smoke` fails if any request to Google ad or analytics domains is made.

## 5. Validating ad placement

The two prepared placements (`<AdSlot placement="game-page" />` below all game-page content, and `<AdSlot placement="content-page" />` below guide articles) were chosen to comply. Re-check before enabling:

- [ ] Ads are **far from the game**. Google recommends at least 150 px between ads and the edge of a game; ours sit after the full content column.
- [ ] No ad near **game controls, play buttons, navigation or menus**, and none over or inside the canvas, overlays or HUD.
- [ ] Labeled only **"Advertisements"** (the label `AdSlot` renders) or "Sponsored Links", as the placement policy requires.
- [ ] No text asking anyone to click, view or support ads.
- [ ] Ads don't look like site content, buttons or game elements.
- [ ] No auto-refreshing ads and no timed "ad before you can play" walls with display ads.
- [ ] Layout checked on phone and desktop. No accidental-click risk while scrolling past the game.
- [ ] Pages have substantial content compared to ads.

## 6. Consent and privacy

- **EEA, UK, Switzerland:** Google requires a **Google-certified CMP integrated with the IAB TCF** to serve personalized ads to these users ([requirement](https://support.google.com/adsense/answer/13554116)). AdSense offers its own privacy and messaging tools, and third-party certified CMPs exist. **This project bundles no CMP**, so that is a launch limitation to solve before enabling ads for those regions.
- **Google consent mode:** the analytics component sets consent defaults before tags load, as Google [documents](https://developers.google.com/tag-platform/security/guides/consent). The default is `denied` (`NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT`). A CMP must then send `gtag('consent', 'update', …)` when a visitor chooses.
- **US state privacy laws** and others may also apply depending on your audience. One mechanism does not fit every jurisdiction.
- **Children:** arcade games can attract young players. If any part of the site is directed at children, review COPPA and Google's age-restricted treatment tagging ([AdSense help](https://support.google.com/adsense/answer/3248194)) before enabling ads, and get legal advice.
- **Data minimization:** the site stores only scores and settings locally and sends nothing. Keep it that way: don't add tracking that isn't needed.

This repository does not make the site legally compliant by itself. Have the final setup reviewed by a qualified professional.

## 7. Official documentation

| Topic | Link |
| --- | --- |
| AdSense eligibility | <https://support.google.com/adsense/answer/9724> |
| AdSense Program policies | <https://support.google.com/adsense/answer/48182> |
| Ad placement policies | <https://support.google.com/adsense/answer/1346295> |
| Invalid traffic | <https://support.google.com/adsense/answer/16737> |
| ads.txt guide | <https://support.google.com/adsense/answer/12171612> |
| Certified CMP requirement (EEA/UK/CH) | <https://support.google.com/adsense/answer/13554116> |
| Age-restricted / child-directed treatment | <https://support.google.com/adsense/answer/3248194> |
| H5 Games Ads overview | <https://support.google.com/adsense/answer/9959170> |
| H5 Games Ads sign-up | <https://support.google.com/adsense/answer/1705831> |
| Ad Placement API | <https://developers.google.com/ad-placement> |
| Ad Placement API: `adBreak()` | <https://developers.google.com/ad-placement/apis/adbreak> |
| Consent mode setup | <https://developers.google.com/tag-platform/security/guides/consent> |

## 8. Readiness is not approval

| Ready in this repo | Not done, and not doable in code |
| --- | --- |
| Isolated, disabled-by-default AdSense loader and labeled ad slots | AdSense account approval |
| Configuration validation and tests | Site approval and ads.txt with your real ID |
| Privacy page that changes with configuration | Legal review of privacy/terms |
| Documented H5 integration points | H5 Games Ads approval and API integration |
| Consent mode defaults for analytics | A certified CMP for EEA/UK/CH |

## 9. Why artificial traffic and invalid clicks are prohibited

Advertisers pay for real people's genuine interest. Google's [invalid traffic policy](https://support.google.com/adsense/answer/16737) treats as invalid: clicking your own ads, asking or encouraging anyone to click, placements that cause accidental clicks, and automated or purchased traffic (bots, click exchanges, traffic schemes). Consequences include withheld earnings, limited ad serving and **account closure**, often permanently.

So: never click your own live ads, never pay for traffic that promises ad revenue, never add "support us by clicking" messages, and grow traffic honestly through good games, useful guides, SEO and genuine sharing.
