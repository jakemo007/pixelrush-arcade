#!/usr/bin/env node
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
