/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  reactStrictMode: true,
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Metadata base for OG images
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://voidborne.vercel.app',
  },

  // Bundle optimization
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', 'framer-motion', '@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },

  // Production performance optimizations
  swcMinify: true,
  poweredByHeader: false,

  // Output standalone for better deployment
  output: 'standalone',

  // Webpack optimizations
  webpack: (config, { isServer, webpack }) => {
    // Bundle analyzer (run with ANALYZE=true pnpm build)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
          openAnalyzer: false,
        })
      )
    }
    
    // Split vendor chunks for better caching
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          
          // Wallet libs (heavy, rarely change)
          wallet: {
            name: 'wallet',
            test: /[\\/]node_modules[\\/](@rainbow-me|wagmi|viem)[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
          
          // UI component libs
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](framer-motion|lucide-react|@radix-ui)[\\/]/,
            priority: 9,
            reuseExistingChunk: true,
          },
          
          // Chart libraries (heavy, on-demand)
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            priority: 8,
            reuseExistingChunk: true,
          },
          
          // Common React libs
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 7,
            reuseExistingChunk: true,
          },
          
          // Everything else shared
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

  // Headers for caching and security
  async headers() {
    return [
      // Immutable static assets (hashed filenames — safe forever)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes — short CDN cache with stale-while-revalidate
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=30, stale-while-revalidate=60',
          },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      // Security headers for all pages
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Public images — CDN cache for 1 week
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
