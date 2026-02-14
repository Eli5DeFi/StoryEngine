/**
 * Lazy-loaded LiveOddsChart component
 * Reduces initial bundle size by ~200KB (recharts + framer-motion)
 */

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the heavy chart component
export const LiveOddsChart = dynamic(
  () => import('./LiveOddsChart').then(mod => ({ default: mod.LiveOddsChart })),
  {
    loading: () => (
      <div className="w-full h-96 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    ),
    ssr: false, // Disable SSR for charts (they need browser APIs)
  }
)
