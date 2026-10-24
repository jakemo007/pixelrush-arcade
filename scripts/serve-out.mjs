#!/usr/bin/env node
/**
 * Minimal static file server for previewing the production build in `out/`.
 * Behaves like typical static hosts: /about/ serves about/index.html,
 * /about redirects to /about/, unknown paths get 404.html.
 *
 * Usage: npm run build && npm run preview   (PORT=4000 to change the port)
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.cwd(), 'out');
const port = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

if (!existsSync(root)) {
  console.error('No out/ directory found. Run `npm run build` first.');
  process.exit(1);
}

function send(res, status, file) {
  res.writeHead(status, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  const target = normalize(join(root, pathname));
  if (target !== root && !target.startsWith(root + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (existsSync(target) && statSync(target).isFile()) return send(res, 200, target);

  if (existsSync(target) && statSync(target).isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(308, { Location: `${pathname}/${url.search}` }).end();
      return;
    }
    const index = join(target, 'index.html');
    if (existsSync(index)) return send(res, 200, index);
  }

  const notFound = join(root, '404.html');
  if (existsSync(notFound)) return send(res, 404, notFound);
  res.writeHead(404).end('Not found');
}).listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}`);
});
