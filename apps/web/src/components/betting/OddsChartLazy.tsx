'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

/**
 * Lazy-loaded wrapper for OddsChart
 * Reduces initial bundle size by ~100KB (recharts library)
 * Only loads when component is actually rendered
 */
const OddsChartInternal = dynamic(
  () => import('./OddsChart').then(mod => ({ default: mod.OddsChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border border-muted animate-pulse">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading odds chart...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export { OddsChartInternal as OddsChart }
export default OddsChartInternal
