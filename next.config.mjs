/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Povolí ESM moduly pro build-time skripty
    esmExternals: true,
  },
  // Povolí statické soubory z public/data
  async rewrites() {
    return [
      {
        source: '/data/:path*',
        destination: '/data/:path*',
      },
    ];
  },
  // Dočasně vypnout ESLint pro build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
