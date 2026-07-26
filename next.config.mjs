/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ESLint configuration
  eslint: {
    // Run linting during build for production
    ignoreDuringBuilds: false,
  },

  // Image optimization
  images: {
    remotePatterns: [],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Production optimizations
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
