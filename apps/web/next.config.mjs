/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Correctness ────────────────────────────────────────────────────────────
  reactStrictMode: true,

  // ── Compiler ────────────────────────────────────────────────────────────────
  compiler: {
    // Strip all console.log/info/debug in production; keep error + warn
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  // ── Image optimisation ───────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ── Metadata base for OG images ─────────────────────────────────────────
  env: {
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL || 'https://voidborne.vercel.app',
  },

  // ── Bundle / tree-shaking ────────────────────────────────────────────────
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'framer-motion',
      '@rainbow-me/rainbowkit',
      'wagmi',
      'viem',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
    ],
  },

  // ── Deployment ──────────────────────────────────────────────────────────
  poweredByHeader: false,
  output: 'standalone',

  // ── TypeScript / ESLint (temporary — remove once errors are resolved) ────
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ── Webpack ─────────────────────────────────────────────────────────────
  webpack: (config, { isServer, webpack }) => {
    // Web3 polyfills — Node built-ins not available in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Bundle analyser (run with ANALYZE=true pnpm build)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = await import('webpack-bundle-analyzer')
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

    // Split vendor chunks for better long-term caching
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,

          // Wallet libs (heavy, change rarely)
          wallet: {
            name: 'wallet',
            test: /[\\/]node_modules[\\/](@rainbow-me|wagmi|viem)[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },

          // UI components
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](framer-motion|lucide-react|@radix-ui)[\\/]/,
            priority: 9,
            reuseExistingChunk: true,
          },

          // Charts (heavy, on-demand)
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            priority: 8,
            reuseExistingChunk: true,
          },

          // React core
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 7,
            reuseExistingChunk: true,
          },

          // Shared across ≥2 chunks
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

  // ── Response headers ────────────────────────────────────────────────────
  async headers() {
    return [
      // Security headers on all routes
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control',   value: 'on' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'origin-when-cross-origin' },
        ],
      },
      // Immutable cache for Next.js static assets
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Short-lived cache for API responses (edge / CDN)
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
    ]
  },
}

export default nextConfig
