/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Strip console.* in production (keep error + warn for observability)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // Image optimization — AVIF first (best compression), WebP fallback
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600, // 1 hour (up from 60s)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  env: {
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL || 'https://voidborne.vercel.app',
  },

  // Tree-shake large packages at build time
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'framer-motion',
      '@rainbow-me/rainbowkit',
      'wagmi',
      'viem',
    ],
    // Restore scroll position on back/forward navigation
    scrollRestoration: true,
  },

  // Webpack: bundle splitting + Web3 polyfill suppressions
  webpack: (config, { isServer }) => {
    // Suppress Node built-in warnings from Web3 libs
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Bundle analyzer (ANALYZE=true pnpm build)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
          openAnalyzer: false,
        })
      )
    }

    // Client-side only: split heavy vendor chunks for long-lived browser cache
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,

          // Wallet libs — heavy, change rarely → prime cache candidate
          wallet: {
            name: 'wallet',
            test: /[\\/]node_modules[\\/](@rainbow-me|wagmi|viem|@wagmi)[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },

          // UI libs — framer-motion, Radix primitives
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](framer-motion|@radix-ui|lucide-react)[\\/]/,
            priority: 9,
            reuseExistingChunk: true,
          },

          // Chart libs — loaded lazily but shared across chart pages
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](recharts|d3[-/])[\\/]/,
            priority: 8,
            reuseExistingChunk: true,
          },

          // React core — never changes between deploys
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 7,
            reuseExistingChunk: true,
          },

          // Everything else shared across ≥2 routes
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      }
    }

    return config
  },

  // HTTP headers
  async headers() {
    return [
      // Static assets: immutable 1-year cache (hash in filename)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Public assets: 1-day cache
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Safe GET API routes: 60s edge cache + 2min stale-while-revalidate
      // Does NOT apply to POST/DELETE routes (CDNs don't cache those)
      {
        source: '/api/stories/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
      {
        source: '/api/lore/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/api/betting/odds-history/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=30, stale-while-revalidate=60',
          },
        ],
      },
      // Security headers for all routes
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
