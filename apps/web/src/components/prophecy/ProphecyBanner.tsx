'use client'

/**
 * ProphecyBanner
 * Compact banner shown on the story page to tease active prophecies.
 * Links to the full /prophecies/[chapterId] gallery.
 *
 * Shows:
 *  - Number of open prophecies
 *  - Minting deadline (before chapter closes)
 *  - CTA to the prophecy gallery
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ProphecySummary {
  total: number
  pending: number
  totalMinted: number
  chapterId: string
}

interface Props {
  chapterId: string
}

export function ProphecyBanner({ chapterId }: Props) {
  const [summary, setSummary] = useState<ProphecySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/prophecies/${chapterId}`)
        if (!res.ok) return
        const data = await res.json()
        setSummary({
          total: data.summary.total,
          pending: data.summary.pending,
          totalMinted: data.summary.totalMinted,
          chapterId,
        })
      } catch {
        // Non-critical — fail silently
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [chapterId])

  // Don't render if no prophecies exist or still loading
  if (loading || !summary || summary.total === 0) return null

  const hasPending = summary.pending > 0
  const spotsTotal = summary.total * 100

  return (
    <Link
      href={`/prophecies/${chapterId}`}
      className={[
        'block rounded-lg border p-4 transition-all duration-300 group',
        hasPending
          ? 'border-amber-500/25 bg-gradient-to-r from-amber-950/20 to-void-950/40 hover:border-amber-400/40'
          : 'border-void-800/30 bg-void-950/40 hover:border-void-700/50',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={[
            'text-xl shrink-0 transition-transform duration-300 group-hover:scale-110',
            hasPending ? 'text-amber-400' : 'text-void-600',
          ].join(' ')}>
            {hasPending ? '✦' : '▪'}
          </div>

          {/* Text */}
          <div>
            <p
              className={`text-sm font-semibold ${hasPending ? 'text-amber-200' : 'text-void-400'}`}
              style={{ fontFamily: 'var(--font-cinzel)' }}
            >
              {hasPending
                ? `${summary.pending} Prophecies Open`
                : `${summary.total} Prophecies Sealed`}
            </p>
            <p className="text-[11px] font-mono text-void-500 mt-0.5">
              {hasPending
                ? `${summary.totalMinted} of ${spotsTotal} spots taken · 5 $FORGE to mint`
                : `${summary.totalMinted} collectors · Chapter resolved`}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className={[
          'text-xs font-mono uppercase tracking-widest shrink-0 transition-colors',
          hasPending ? 'text-amber-400 group-hover:text-amber-300' : 'text-void-500 group-hover:text-void-400',
        ].join(' ')}>
          {hasPending ? 'Mint Now →' : 'View →'}
        </div>
      </div>

      {/* Mint progress bar (open only) */}
      {hasPending && summary.totalMinted > 0 && (
        <div className="mt-3">
          <div className="h-0.5 bg-void-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700"
              style={{ width: `${Math.min((summary.totalMinted / spotsTotal) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  )
}
