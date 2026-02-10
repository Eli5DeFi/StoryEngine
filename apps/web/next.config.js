/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@narrative-forge/bankr-integration', '@narrative-forge/contracts'],
  images: {
    domains: ['narrativeforge.ai'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
