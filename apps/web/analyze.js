/**
 * Bundle Analyzer
 * 
 * Run: ANALYZE=true pnpm build
 * 
 * Opens interactive treemap showing bundle composition
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(require('./next.config.js'))
