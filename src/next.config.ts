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
    domains: ['localhost', 'gprealty-cy.com'],
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Disable telemetry
  telemetry: {
    disabled: true,
  },
  // Handle missing images gracefully
  async redirects() {
    return [];
  },
};

export default nextConfig; 