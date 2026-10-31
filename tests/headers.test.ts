import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function cloudflareHeaders(): Record<string, string> {
  const block = readFileSync('public/_headers', 'utf8').split(/\r?\n\r?\n/)[0] ?? '';
  const headers: Record<string, string> = {};
  for (const line of block.split(/\r?\n/).slice(1)) {
    const index = line.indexOf(':');
    if (index > 0) headers[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return headers;
}

function vercelHeaders(): Record<string, string> {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const all = config.headers.find((entry) => entry.source === '/(.*)');
  return Object.fromEntries((all?.headers ?? []).map((h) => [h.key, h.value]));
}

describe('security headers', () => {
  it('are identical in public/_headers and vercel.json', () => {
    expect(vercelHeaders()).toEqual(cloudflareHeaders());
  });

  it('include a Content-Security-Policy that blocks plugins and framing', () => {
    const csp = cloudflareHeaders()['Content-Security-Policy'];
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
  });
});
