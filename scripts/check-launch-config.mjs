#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const STRICT = process.argv.includes('--strict');

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) out[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const env = { ...loadEnvFile('.env.local'), ...loadEnvFile('.env.production.local'), ...process.env };
const site = readFileSync('src/config/site.ts', 'utf8');
const results = [];
const add = (status, item, detail) => results.push({ status, item, detail });

const siteUrl = (env.NEXT_PUBLIC_SITE_URL ?? '').trim();
if (!siteUrl) add('TODO', 'NEXT_PUBLIC_SITE_URL', 'Not set. Canonical URLs, sitemap and robots.txt fall back to http://localhost:3000 unless the host provides VERCEL_PROJECT_PRODUCTION_URL.');
else if (!/^https:\/\//.test(siteUrl)) add('WARN', 'NEXT_PUBLIC_SITE_URL', 'Must start with https:// for production.');
else if (/localhost|127\.0\.0\.1/.test(siteUrl)) add('WARN', 'NEXT_PUBLIC_SITE_URL', 'Points at localhost.');
else add('OK', 'NEXT_PUBLIC_SITE_URL', siteUrl);

const email = (env.NEXT_PUBLIC_CONTACT_EMAIL ?? '').trim();
if (!email) add('TODO', 'NEXT_PUBLIC_CONTACT_EMAIL', 'Not set. /contact shows that no address is published yet.');
else if (!/^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/.test(email)) add('WARN', 'NEXT_PUBLIC_CONTACT_EMAIL', 'Not a valid address, so /contact will ignore it.');
else add('OK', 'NEXT_PUBLIC_CONTACT_EMAIL', 'Set');

const operatorMissing = /operatorName:\s*''/.test(site);
add(operatorMissing ? 'TODO' : 'OK', 'siteConfig.operatorName', operatorMissing ? 'Empty. Operator must supply the legal name shown in /privacy and /terms.' : 'Set');

const reviewed = !/legalPagesReviewed:\s*false/.test(site);
add(reviewed ? 'OK' : 'REVIEW', 'siteConfig.legalPagesReviewed', reviewed ? 'Operator states /privacy and /terms were reviewed. This script cannot verify that.' : 'Operator review required. Only set to true after a real review; never to pass this check.');

if (existsSync('out/index.html')) {
  const htmlFiles = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith('.html')) htmlFiles.push(path);
    }
  };
  walk('out');
  const home = readFileSync('out/index.html', 'utf8');
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(home)?.[1] ?? '';
  if (!canonical) add('WARN', 'out/ canonical', 'Homepage has no canonical link.');
  else if (/localhost|127\.0\.0\.1/.test(canonical)) add('WARN', 'out/ canonical', `Built output uses ${canonical}. Rebuild with NEXT_PUBLIC_SITE_URL set.`);
  else add('OK', 'out/ canonical', canonical);
  const placeholders = htmlFiles.filter((f) => /\[[^\]]*to be completed[^\]]*\]/i.test(readFileSync(f, 'utf8')));
  add(placeholders.length ? 'REVIEW' : 'OK', 'out/ placeholders', placeholders.length ? `Unresolved placeholder text in: ${placeholders.map((f) => f.split(sep).join('/')).join(', ')}` : 'No bracketed placeholders in built pages.');
  const adHits = htmlFiles.filter((f) => /googlesyndication|adsbygoogle|googletagmanager/.test(readFileSync(f, 'utf8')));
  add(adHits.length ? 'INFO' : 'OK', 'out/ ad or analytics scripts', adHits.length ? `${adHits.length} page(s) reference ad/analytics scripts.` : 'None in built pages.');
} else {
  add('INFO', 'out/', 'Not built; run `npm run build` to check built output.');
}

add(existsSync('public/_headers') ? 'OK' : 'WARN', 'public/_headers', 'Security headers for Cloudflare Pages (vercel.json is ignored there).');

const ga = (env.NEXT_PUBLIC_GA_ID ?? '').trim();
add('INFO', 'Google Analytics', ga ? `Enabled (consent default: ${env.NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT || 'denied'})` : 'Disabled');

const adsOn = (env.NEXT_PUBLIC_ADS_ENABLED ?? '').trim().toLowerCase() === 'true';
const client = (env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? '').trim();
if (!adsOn) add('INFO', 'AdSense', 'Disabled (default).');
else if (!/^ca-pub-\d{16}$/.test(client)) add('WARN', 'AdSense', 'NEXT_PUBLIC_ADS_ENABLED=true but the client ID is missing or invalid, so ads stay off.');
else {
  add('INFO', 'AdSense', 'Enabled. Confirm approval, certified consent management, ads.txt and placements (docs/MONETIZATION.md).');
  if (!existsSync('public/ads.txt')) add('TODO', 'public/ads.txt', 'Add the exact line from your AdSense account.');
}

const width = Math.max(...results.map((r) => r.item.length));
for (const r of results) console.log(`${r.status.padEnd(6)} ${r.item.padEnd(width)}  ${r.detail}`);

const todo = results.filter((r) => r.status === 'TODO').length;
const warn = results.filter((r) => r.status === 'WARN').length;
const review = results.filter((r) => r.status === 'REVIEW').length;
console.log('');
if (todo || warn) console.log(`STATE: configuration incomplete (${todo} missing, ${warn} warning).`);
else if (review) console.log(`STATE: operator review required (${review} item).`);
else console.log('STATE: ready for technical verification. This is not proof of legal compliance or AdSense approval.');
if (STRICT && (todo || warn || review)) process.exit(1);
