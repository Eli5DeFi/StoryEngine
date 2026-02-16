/**
 * Production-safe logger
 * 
 * Only logs errors and warnings in production.
 * Full logging in development.
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
  },
  
  info: (...args: any[]) => {
  },
  
  warn: (...args: any[]) => {
    console.warn(...args)
  },
  
  error: (...args: any[]) => {
    console.error(...args)
  },
  
  debug: (...args: any[]) => {
  },
  
  table: (data: any) => {
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
      } catch (e) {
        // Ignore if marks don't exist
      }
    }
  },
}
