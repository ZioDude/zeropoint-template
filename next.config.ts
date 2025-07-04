import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Disable strict mode in production for better performance
  reactStrictMode: false,
  // Enable experimental features
  experimental: {
    // Optimize bundle size
    optimizeCss: true,
  },
  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: false,
  },
  // Disable telemetry
  telemetry: {
    disabled: true,
  },
};

export default nextConfig;
