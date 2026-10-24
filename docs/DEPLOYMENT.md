# Deployment guide

PixelRush Arcade builds to a folder of static files (`out/`). It needs no server, database or environment secrets. This guide covers GitHub, Vercel, other static hosts, custom domains and post-deployment checks.

---

## 1. Put the code on GitHub

The repository already exists at `https://github.com/jakemo007/pixelrush-arcade`.

From the project folder:

```bash
git status                       # review what will be committed
git add .
git commit -m "Describe your change"
git push origin main
```

First-time setup on a new machine:

```bash
git clone https://github.com/jakemo007/pixelrush-arcade.git
cd pixelrush-arcade
npm ci
```

To use a different repository, create an **empty** repository on GitHub (no README or license) and then:

```bash
git remote set-url origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### Never commit environment files

`.gitignore` already excludes `.env`, `.env.local` and every other `.env.*` file except `.env.example`. Keep real values in your host's dashboard. Before committing, `git status` should never list a `.env.local` file. If one was committed by mistake, remove it from the index with `git rm --cached .env.local`, commit, and rotate anything sensitive it contained.

`NEXT_PUBLIC_*` variables are **public by design**: they end up in the JavaScript sent to browsers. This project only uses public identifiers (site URL, contact email, GA and AdSense IDs), never secrets.

---

## 2. Choose a hosting plan that allows your use

Check this **before** you add advertising or any other revenue:

- **Vercel Hobby (free) is for non-commercial personal use only.** Vercel's [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage) define commercial usage to include "the inclusion of advertisements, including but not limited to online advertising platforms like Google AdSense". A monetized site needs a Pro or Enterprise plan.
- Other providers have their own rules. Read the current terms of any host before you rely on it for a commercial site.

You can launch without ads on a plan that suits a non-commercial site, then move to an appropriate plan before enabling monetization.

---

## 3. Deploy to Vercel

1. Sign in at <https://vercel.com> with your GitHub account.
2. **Add New → Project**, then import `pixelrush-arcade`.
3. Vercel detects **Next.js**. The settings come from `vercel.json`:
   - Build command: `npm run build` (runs `next build` plus the export fix script);
   - Output: detected automatically from `output: 'export'` (the `out/` folder);
   - Install command: default (`npm install`, or `npm ci` when a lockfile is present).
4. **Environment variables** (Project → Settings → Environment Variables). All are optional; see `.env.example`:

   | Variable | When to set it |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | As soon as you have a custom domain, e.g. `https://www.example.com`. Until then Vercel's production `*.vercel.app` domain is used automatically. |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | When you have a monitored inbox |
   | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT` | Only after reading the consent section of `docs/MONETIZATION.md` |
   | `NEXT_PUBLIC_ADS_ENABLED`, `NEXT_PUBLIC_ADSENSE_*` | Only after AdSense approval, on a plan that permits commercial use |

5. Click **Deploy**. Every push to `main` deploys to production, and other branches and pull requests get preview URLs.

After changing an environment variable, **redeploy** (Deployments → ⋯ → Redeploy). The values are compiled into the static files.

`vercel.json` also sets basic security headers (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`). Next.js `headers()` does not work with static export, which is why they live there.

---

## 4. Alternative static hosts

Any host that serves static files works:

```bash
npm ci
npm run build        # output: out/
```

Upload the contents of `out/` or point the host at it:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output / publish directory | `out` |
| Node version | 20.9 or newer (22 recommended) |
| 404 page | `out/404.html` (most hosts pick it up automatically) |

Requirements and notes:

- The site uses trailing-slash URLs (`/games/neon-dash/` → `games/neon-dash/index.html`), which static hosts resolve by default.
- To reproduce `vercel.json`'s security headers elsewhere, use that host's mechanism (for example a `_headers` file on hosts that support it, or server configuration on Nginx/Apache).
- Check the host's terms for commercial use before monetizing.

---

## 5. Custom domain

1. Buy a domain from any registrar (this project never buys one for you).
2. In Vercel: Project → Settings → **Domains** → add `www.example.com` (and the apex `example.com`, redirecting to one of them).
3. Create the DNS records Vercel shows you at your registrar and wait for verification.
4. Set `NEXT_PUBLIC_SITE_URL=https://www.example.com` (the exact form you chose as primary) and redeploy.
5. Add the domain to Google Search Console and submit `https://www.example.com/sitemap.xml` (see `docs/SEO_CHECKLIST.md`).

Pick one primary hostname (with or without `www`) and redirect the other to it, so each page has a single canonical URL.

---

## 6. Test the public deployment

After each production deployment:

1. **Pages**: open `/`, `/games/`, each game, `/daily-challenge/`, `/guides/` and one guide, `/about/`, `/contact/`, `/privacy/`, `/terms/`, plus a made-up URL (should show the 404 page).
2. **Games**: start, pause (P), resume, lose and restart each game. Reload and confirm the personal best is still shown.
3. **Phone**: repeat a quick game check on a real phone (touch controls, layout, landscape for Neon Dash).
4. **SEO files**: `https://<your-domain>/sitemap.xml` lists your real domain (not `localhost`), and `/robots.txt` points to it.
5. **Page source**: `<link rel="canonical">` uses your domain, and there is no `noindex` on public pages.
6. **Integrations**: with ads and analytics disabled, the browser's Network tab shows no requests to `googlesyndication.com` or `googletagmanager.com`.
7. **Performance**: run <https://pagespeed.web.dev/> on the homepage and a game page (see `docs/SEO_CHECKLIST.md`).

Locally, `npm run build && npm run test:smoke` automates most of these checks against the production build.
