import type { NextConfig } from 'next';

/**
 * PixelRush Arcade is a fully static site: `next build` writes plain HTML,
 * CSS and JS to `out/`, which any static host (Vercel, Cloudflare Pages,
 * Netlify, GitHub Pages, S3...) can serve without a Node.js server.
 *
 * - `output: 'export'`  -> static export, no server runtime required.
 * - `trailingSlash`     -> emits `about/index.html` instead of `about.html`,
 *                          which every static host resolves the same way.
 * - `images.unoptimized`-> the Next.js image optimizer needs a server.
 */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
