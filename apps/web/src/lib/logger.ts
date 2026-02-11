/**
 * Production-safe logger
 * 
 * Only logs errors and warnings in production.
 * Full logging in development.
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args)
  },
  
  info: (...args: any[]) => {
    if (isDev) console.info(...args)
  },
  
  warn: (...args: any[]) => {
    console.warn(...args)
  },
  
  error: (...args: any[]) => {
    console.error(...args)
  },
  
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args)
  },
  
  table: (data: any) => {
    if (isDev) console.table(data)
  },
}

// Performance monitoring
export const perfLogger = {
  start: (label: string) => {
    if (isDev && typeof performance !== 'undefined') {
      performance.mark(`${label}-start`)
    }
  },
  
  end: (label: string) => {
    if (isDev && typeof performance !== 'undefined') {
      performance.mark(`${label}-end`)
      try {
        performance.measure(label, `${label}-start`, `${label}-end`)
        const measure = performance.getEntriesByName(label)[0]
        console.log(`⚡ ${label}: ${measure.duration.toFixed(2)}ms`)
      } catch (e) {
        // Ignore if marks don't exist
      }
    }
  },
}
