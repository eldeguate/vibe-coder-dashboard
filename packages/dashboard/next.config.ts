import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile the shared workspace package
  transpilePackages: ['@vibe-coder/shared'],
};

export default nextConfig;
