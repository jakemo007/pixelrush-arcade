# SEO and launch checklist

Good SEO here means: useful pages, crawlable content, one URL per page, accurate metadata and fast load times. Nothing guarantees indexing or rankings; Google's [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) is the best overview. Links were checked on 2026-10-24.

## Already implemented

- [x] Unique `<title>` and meta description on every page (`pageMetadata()` in `src/lib/seo/metadata.ts`, game copy in `src/content/games.ts`)
- [x] Clean, descriptive URLs with one canonical form (trailing slash), plus `<link rel="canonical">` on every page
- [x] Open Graph and Twitter card tags with generated 1200×630 PNG images (`/og/*.png`)
- [x] `sitemap.xml` listing every indexable page, with accurate `lastmod` dates from `src/lib/seo/routes.ts`
- [x] `robots.txt` allowing crawling and pointing to the sitemap
- [x] `index, follow` on public pages; only the 404 page is `noindex`
- [x] Exactly one `<h1>` per page and a logical heading order (checked by the smoke test)
- [x] Game pages contain real, server-rendered content (description, objective, how to play, controls, scoring, difficulty, tips, FAQ) that is readable without JavaScript
- [x] Internal links between games, guides, the daily challenge and the catalogue, with descriptive link text
- [x] Breadcrumb navigation with `BreadcrumbList` structured data, plus `WebSite` data on the homepage. No ratings, reviews or other fabricated structured data
- [x] Accessible names for the SVG artwork used as content
- [x] SVG favicon, iOS home-screen icon and web app manifest
- [x] Custom 404 page that links back to the games
- [x] Mobile-first responsive layout, no horizontal overflow at 375 px (checked by the smoke test)
- [x] Game code is lazy-loaded only on game pages; no web fonts; no blocking third-party scripts

## Before launch

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the final `https://` origin and redeploy (`npm run check:launch` reports it)
- [ ] Choose `www` or apex as primary and redirect the other to it
- [ ] Open `https://<domain>/sitemap.xml` and `/robots.txt` and confirm they use the real domain
- [ ] View page source on a few pages: canonical URL correct, no `noindex`
- [ ] Share a game page in a chat app or the [Rich Results Test](https://search.google.com/test/rich-results) to check the preview image and breadcrumbs
- [ ] Set the contact email; complete and review privacy/terms (`legalPagesReviewed`)
- [ ] When you edit a page's content meaningfully, update its date in `src/lib/seo/routes.ts` or `src/content/guides/index.ts`. Google uses `lastmod` only when it is consistently accurate.

## Google Search Console

1. **Add a property** at <https://search.google.com/search-console>. A **Domain** property (verified by a DNS TXT record at your registrar) covers `www`, the apex and `http`/`https` together. A **URL-prefix** property can be verified with an HTML file in `public/` or a meta tag. See [verification methods](https://support.google.com/webmasters/answer/9008080). Don't commit someone else's verification code, and never invent one.
2. **Submit the sitemap:** Sitemaps report → enter `sitemap.xml` → Submit ([guide](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)). The sitemap is also referenced in `robots.txt`.
3. **Check indexing:** paste a URL into the [URL Inspection tool](https://support.google.com/webmasters/answer/9012289) to see whether it is indexed, run a live test and request indexing for important pages. The **Pages** report shows site-wide indexing status and reasons for exclusions.
4. **Monitor queries and clicks:** the [Performance report](https://support.google.com/webmasters/answer/7576553) shows clicks, impressions, CTR and average position by query and page. Review it weekly. Look for queries with many impressions but low CTR (improve titles and descriptions) and pages ranking on page 2 (improve the content).
5. **Core Web Vitals report:** appears once there is enough real-user traffic.

## Performance testing

Google's ["good" Core Web Vitals thresholds](https://developers.google.com/search/docs/appearance/core-web-vitals) are LCP ≤ 2.5 s, INP < 200 ms and CLS < 0.1.

- **PageSpeed Insights:** <https://pagespeed.web.dev/>. Test the homepage and one game page on mobile and desktop after each significant change. Field data appears only with enough real traffic.
- **Lighthouse:** Chrome DevTools → Lighthouse → Mobile → Analyze, or `npx lighthouse https://<domain>/ --view`.
- Measure before claiming any score. Lab scores vary between runs and devices.

Measured build characteristics (not Lighthouse scores): all pages are static HTML, about 144 KB gzipped of framework and app JavaScript for modern browsers, plus about 6 KB gzipped of engine code per game, loaded after the page renders. The game area's size is reserved in CSS, so it causes no layout shift.

## Content growth ideas (genuinely useful only)

- A guide per new game, written around how that game actually works
- Patch notes or "what changed" pages when games are updated
- Short gameplay videos embedded on game pages (own recordings only), linked from a YouTube channel you control
- Avoid thin pages, keyword stuffing, auto-generated text and fake reviews or ratings
