/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@voidborne/bankr-integration', '@voidborne/contracts'],
  
  // Image optimization - WebP/AVIF support
  images: {
    domains: ['voidborne.ai', 'narrativeforge.ai'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    minimumCacheTTL: 60,
  },
  
  // Enable compression
  compress: true,
  
  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
    optimizeCss: true,
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Bundle analyzer (dev only)
    if (process.env.ANALYZE === 'true' && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: './bundle-report.html',
        })
      )
    }
    
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      'react-native-sqlite-storage': false,
      '@react-native-async-storage/async-storage': false,
    }
    
    // Tree shaking optimization
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    }
    
    return config
  },
  
  // Caching headers
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
