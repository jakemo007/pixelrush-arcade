#!/usr/bin/env node
/**
 * Post-build fix for Next.js static export segment-prefetch files.
 *
 * With `output: 'export'`, Next.js 16.4 writes per-segment prefetch data at
 * nested paths such as
 *     out/about/__next.about/__PAGE__.txt
 * while the client router requests the dotted form
 *     /about/__next.about.__PAGE__.txt
 * On a plain static host that request 404s (navigation still works, but every
 * link prefetch fails and logs an error). This script copies each nested file
 * to its dotted name so both forms exist. It is idempotent and safe to re-run.
 *
 * Runs automatically as part of `npm run build`. Remove it once Next.js
 * exports the dotted names itself (the smoke test will show no 404s).
 */
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const OUT = 'out';
if (!existsSync(OUT)) {
  console.error('[fix-segment-paths] out/ not found; run next build first.');
  process.exit(1);
}

let created = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name.startsWith('__next.')) flatten(full, dir);
      else walk(full);
    }
  }
}

/** Copies files under a "__next.*" directory to dotted names in its parent. */
function flatten(segmentDir, parent) {
  const stack = [segmentDir];
  while (stack.length) {
    const current = stack.pop();
    for (const name of readdirSync(current)) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) {
        stack.push(full);
        continue;
      }
      const dotted = relative(parent, full).split(sep).join('.');
      const target = join(parent, dotted);
      if (!existsSync(target)) {
        copyFileSync(full, target);
        created++;
      }
    }
  }
}

walk(OUT);
console.log(`[fix-segment-paths] created ${created} prefetch alias file(s).`);
