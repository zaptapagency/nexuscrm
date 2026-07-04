/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint is run separately in CI via `npm run lint`.
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
