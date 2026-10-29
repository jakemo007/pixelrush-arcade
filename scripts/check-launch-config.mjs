#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

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
if (!siteUrl) add('TODO', 'NEXT_PUBLIC_SITE_URL', 'Not set. Canonical URLs will use the Vercel domain or localhost.');
else if (!/^https:\/\//.test(siteUrl)) add('WARN', 'NEXT_PUBLIC_SITE_URL', 'Should start with https://');
else add('OK', 'NEXT_PUBLIC_SITE_URL', siteUrl);

const email = (env.NEXT_PUBLIC_CONTACT_EMAIL ?? '').trim();
add(email ? 'OK' : 'TODO', 'NEXT_PUBLIC_CONTACT_EMAIL', email ? 'Set' : 'Not set. /contact says no address is published yet.');

add(/operatorName:\s*''/.test(site) ? 'TODO' : 'OK', 'siteConfig.operatorName', 'Legal name shown in privacy policy and terms.');
add(/legalPagesReviewed:\s*false/.test(site) ? 'TODO' : 'OK', 'siteConfig.legalPagesReviewed', 'Review /privacy and /terms, then set to true.');

const ga = (env.NEXT_PUBLIC_GA_ID ?? '').trim();
add('INFO', 'Google Analytics', ga ? `Enabled (consent default: ${env.NEXT_PUBLIC_ANALYTICS_CONSENT_DEFAULT || 'denied'})` : 'Disabled');

const adsOn = (env.NEXT_PUBLIC_ADS_ENABLED ?? '').trim().toLowerCase() === 'true';
const client = (env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? '').trim();
if (!adsOn) add('INFO', 'AdSense', 'Disabled (default).');
else if (!/^ca-pub-\d{16}$/.test(client)) add('WARN', 'AdSense', 'NEXT_PUBLIC_ADS_ENABLED=true but the client ID is missing or invalid, so ads stay off.');
else {
  add('INFO', 'AdSense', 'Enabled. Confirm approval, consent management, ads.txt and placements (docs/MONETIZATION.md).');
  if (!existsSync('public/ads.txt')) add('TODO', 'public/ads.txt', 'Create it with the line from your AdSense account.');
}

const width = Math.max(...results.map((r) => r.item.length));
for (const r of results) console.log(`${r.status.padEnd(5)} ${r.item.padEnd(width)}  ${r.detail}`);
const todo = results.filter((r) => r.status === 'TODO' || r.status === 'WARN').length;
console.log(todo ? `\n${todo} item(s) need attention before a public launch.` : '\nNo launch blockers found in configuration.');
