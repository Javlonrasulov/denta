import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@denta/types',
    '@denta/mocks',
    '@denta/utils',
    '@denta/design-tokens',
  ],
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@denta/types': path.resolve(__dirname, '../../packages/types/src'),
      '@denta/mocks': path.resolve(__dirname, '../../packages/mocks/src'),
      '@denta/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@denta/design-tokens': path.resolve(
        __dirname,
        '../../packages/design-tokens/src',
      ),
      '@denta/locales': path.resolve(__dirname, '../../locales'),
    };
    return config;
  },
};

export default nextConfig;
