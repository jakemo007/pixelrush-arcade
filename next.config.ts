import { networkInterfaces } from 'node:os';
import type { NextConfig } from 'next';

const lanAddresses = Object.values(networkInterfaces())
  .flatMap((nets) => nets ?? [])
  .filter((net) => net.family === 'IPv4' && !net.internal)
  .map((net) => net.address);

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  allowedDevOrigins: lanAddresses,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
