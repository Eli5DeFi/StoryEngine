/**
 * Enhanced Error Boundary for Voidborne
 * 
 * Provides graceful error handling with:
 * - User-friendly error messages
 * - Retry functionality
 * - Error reporting (can integrate with Sentry)
 * - Network error detection
 */

'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Detect error type for better UX
 */
function getErrorType(error: Error): {
  type: 'network' | 'server' | 'client' | 'unknown'
  title: string
  message: string
  actionText: string
} {
  const errorMessage = error.message.toLowerCase()
  
  // Network errors
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection')
  ) {
    return {
      type: 'network',
      title: 'Connection Lost',
      message: 'Please check your internet connection and try again.',
      actionText: 'Retry',
    }
  }
  
  // Server errors (5xx)
  if (
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('server')
  ) {
    return {
      type: 'server',
      title: 'Server Error',
      message: 'Our servers are experiencing issues. Please try again in a moment.',
      actionText: 'Retry',
    }
  }
  
  // Client errors (4xx)
  if (
    errorMessage.includes('400') ||
    errorMessage.includes('404') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden')
  ) {
    return {
      type: 'client',
      title: 'Something Went Wrong',
      message: error.message || 'An unexpected error occurred. Please try refreshing the page.',
      actionText: 'Refresh Page',
    }
  }
  
  // Unknown errors
  return {
    type: 'unknown',
    title: 'Unexpected Error',
    message: error.message || 'Something unexpected happened. Please try again.',
    actionText: 'Try Again',
  }
}

/**
 * Error Boundary Component
 * Used in app/error.tsx
 */
export function ErrorFallback({ error, reset }: ErrorBoundaryProps) {
  const errorInfo = getErrorType(error)
  
  useEffect(() => {
    // Log to error tracking service (Sentry, etc.)
    console.error('Error boundary caught:', error)
    
    // TODO: Send to error tracking
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error)
    // }
  }, [error])
  
  const Icon = errorInfo.type === 'network' ? WifiOff : AlertTriangle
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card rounded-xl p-8 max-w-md w-full">
        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${
            errorInfo.type === 'network' 
              ? 'bg-blue-500/10' 
              : 'bg-red-500/10'
          }`}>
            <Icon className={`w-6 h-6 ${
              errorInfo.type === 'network'
                ? 'text-blue-500'
                : 'text-red-500'
            }`} />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {errorInfo.title}
          </h2>
        </div>
        
        {/* Error Message */}
        <p className="text-foreground/70 mb-6 leading-relaxed">
          {errorInfo.message}
        </p>
        
        {/* Error Details (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 p-3 rounded-lg bg-void-900/50 border border-void-800">
            <summary className="text-sm text-foreground/70 cursor-pointer font-mono">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs text-red-400 overflow-auto">
              {error.stack || error.message}
            </pre>
          </details>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-3 bg-gold hover:bg-gold/90 text-void-950 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            {errorInfo.actionText}
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-3 bg-void-800 hover:bg-void-700 text-foreground rounded-lg font-semibold transition-all active:scale-95"
          >
            Go Home
          </button>
        </div>
        
        {/* Help Text */}
        <p className="mt-6 text-xs text-foreground/50 text-center">
          If this problem persists, please{' '}
          <a 
            href="https://twitter.com/Eli5DeFi" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  )
}

/**
 * Network Status Indicator
 * Shows when user is offline
 */
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  if (isOnline) return null
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 glass-card rounded-lg p-4 border border-red-500/30 bg-red-500/10 z-50">
      <div className="flex items-center gap-3">
        <WifiOff className="w-5 h-5 text-red-500" />
        <div className="flex-1">
          <p className="font-semibold text-foreground">No Internet Connection</p>
          <p className="text-sm text-foreground/70">
            Some features may be unavailable
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Fix missing useState import
 */
import { useState } from 'react'
