/**
 * Application-wide constants for performance and caching
 */

/**
 * Cache durations (in seconds)
 */
export const CACHE_DURATIONS = {
  // Static content
  STATIC_ASSETS: 31536000, // 1 year
  IMAGES: 86400, // 1 day
  
  // API routes
  PLATFORM_STATS: 60, // 1 minute
  TRENDING_DATA: 30, // 30 seconds
  LEADERBOARD: 120, // 2 minutes
  USER_PROFILE: 300, // 5 minutes
  STORY_CONTENT: 3600, // 1 hour
  
  // Revalidation
  STORY_LIST: 600, // 10 minutes
  CHAPTER_LIST: 300, // 5 minutes
} as const

/**
 * Performance thresholds
 */
export const PERFORMANCE = {
  // Lighthouse targets
  LIGHTHOUSE_PERFORMANCE: 90,
  LIGHTHOUSE_ACCESSIBILITY: 95,
  LIGHTHOUSE_BEST_PRACTICES: 95,
  LIGHTHOUSE_SEO: 100,
  
  // Core Web Vitals targets
  LCP_TARGET: 2500, // Largest Contentful Paint (ms)
  FID_TARGET: 100, // First Input Delay (ms)
  CLS_TARGET: 0.1, // Cumulative Layout Shift (score)
  
  // API response times (ms)
  API_FAST: 100,
  API_ACCEPTABLE: 200,
  API_SLOW: 500,
} as const

/**
 * Bundle size targets (KB)
 */
export const BUNDLE_SIZE = {
  FIRST_LOAD_JS: 150, // Initial JS bundle
  TOTAL_SIZE: 500, // Total page weight
} as const
