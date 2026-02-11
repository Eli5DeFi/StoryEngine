/**
 * Performance monitoring utilities
 * Track real user metrics (RUM) and Web Vitals
 */

export interface PerformanceMetrics {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
}

/**
 * Web Vitals thresholds (Google's Core Web Vitals)
 */
export const THRESHOLDS = {
  // Largest Contentful Paint (LCP) - Loading
  LCP: {
    good: 2500, // ≤2.5s
    needsImprovement: 4000, // ≤4s
  },
  // First Input Delay (FID) - Interactivity
  FID: {
    good: 100, // ≤100ms
    needsImprovement: 300, // ≤300ms
  },
  // Cumulative Layout Shift (CLS) - Visual Stability
  CLS: {
    good: 0.1, // ≤0.1
    needsImprovement: 0.25, // ≤0.25
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800, // ≤1.8s
    needsImprovement: 3000, // ≤3s
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800, // ≤800ms
    needsImprovement: 1800, // ≤1.8s
  },
} as const

/**
 * Rate a metric value against thresholds
 */
function rateMetric(
  name: keyof typeof THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

/**
 * Track Web Vitals using the web-vitals library
 * 
 * Call this in _app.tsx or layout.tsx:
 * 
 * useEffect(() => {
 *   trackWebVitals((metric) => {
 *     // Send to analytics
 *     console.log(metric)
 *   })
 * }, [])
 */
export function trackWebVitals(callback: (metric: PerformanceMetrics) => void) {
  if (typeof window === 'undefined') return

  // Track Core Web Vitals
  if ('web-vitals' in window) {
    // @ts-ignore - web-vitals is loaded via script
    import('web-vitals').then(({ onCLS, onFID, onLCP, onFCP, onTTFB }) => {
      onLCP((metric: any) => {
        callback({
          name: 'LCP',
          value: metric.value,
          rating: rateMetric('LCP', metric.value),
          timestamp: Date.now(),
        })
      })
      onFID((metric: any) => {
        callback({
          name: 'FID',
          value: metric.value,
          rating: rateMetric('FID', metric.value),
          timestamp: Date.now(),
        })
      })
      onCLS((metric: any) => {
        callback({
          name: 'CLS',
          value: metric.value,
          rating: rateMetric('CLS', metric.value),
          timestamp: Date.now(),
        })
      })
      onFCP((metric: any) => {
        callback({
          name: 'FCP',
          value: metric.value,
          rating: rateMetric('FCP', metric.value),
          timestamp: Date.now(),
        })
      })
      onTTFB((metric: any) => {
        callback({
          name: 'TTFB',
          value: metric.value,
          rating: rateMetric('TTFB', metric.value),
          timestamp: Date.now(),
        })
      })
    })
  }
}

/**
 * Measure custom performance marks
 * 
 * @example
 * measurePerformance('data-fetch', () => {
 *   return fetch('/api/data')
 * })
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start

  if (process.env.NODE_ENV === 'development') {
    console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`)
  }

  return { result, duration }
}

/**
 * Preload critical resources
 * 
 * @example
 * preloadImage('/hero.jpg')
 * preloadFont('/fonts/cinzel.woff2')
 */
export function preloadImage(src: string) {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src
  document.head.appendChild(link)
}

export function preloadFont(src: string) {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'font'
  link.type = 'font/woff2'
  link.href = src
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}
