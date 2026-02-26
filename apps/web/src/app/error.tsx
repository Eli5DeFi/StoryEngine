'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

/**
 * Global error boundary for the app.
 * Shown when an unhandled error propagates to the root.
 * Replaces the generic Next.js error page with a Voidborne-styled UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6">
      <div
        className="max-w-md w-full text-center p-10 rounded-2xl"
        style={{
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(220, 38, 38, 0.2)',
        }}
      >
        <div className="text-6xl mb-6" aria-hidden="true">⚡</div>

        <h1 className="text-2xl font-bold text-[#F1F5F9] mb-3">
          The Lattice is unstable
        </h1>
        <p className="text-[#94A3B8] mb-6 text-sm leading-relaxed">
          An unexpected disruption has occurred. The Conclave is aware and working to restore order.
        </p>

        {error.digest && (
          <p
            className="text-xs text-[#64748B] mb-6 font-mono"
            aria-label="Error reference code"
          >
            Ref: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          className="w-full px-6 py-3 rounded-lg font-bold text-white transition-all hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          }}
          aria-label="Try again"
        >
          Restore the Protocol
        </button>
      </div>
    </div>
  )
}
