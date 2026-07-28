import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/api/docs',
        permanent: false,
      },
      {
        source: '/api-docs',
        destination: '/api/docs',
        permanent: false,
      },
      {
        source: '/swagger',
        destination: '/api/docs',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
