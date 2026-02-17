'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Global error boundary page.
 * Catches unhandled errors in the React tree and shows a friendly message.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('[GlobalError]', error.digest, error.message)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-[80px] mb-2 select-none" aria-hidden="true">⚡</div>

        <h1 className="text-2xl font-display text-[#F1F5F9] mb-3">
          A Disturbance in the Void
        </h1>
        <p className="text-[#94A3B8] mb-2 leading-relaxed">
          Something unexpected disrupted the narrative. The Conclave is investigating.
        </p>
        {error.digest && (
          <p className="text-[#475569] text-xs mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-lg text-sm font-semibold text-[#F1F5F9] transition-all"
            style={{
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg text-sm font-semibold text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}
