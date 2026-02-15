'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

/**
 * Lazy-loaded wrapper for LiveOddsChart
 * Reduces initial bundle size by ~100KB (recharts library)
 * Only loads when component is actually rendered
 */
const LiveOddsChartInternal = dynamic(
  () => import('./LiveOddsChart').then(mod => ({ default: mod.LiveOddsChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border border-muted animate-pulse">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export { LiveOddsChartInternal as LiveOddsChart }
export default LiveOddsChartInternal
